package main

import (
	"bytes"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"crom-dataset/database"

	"github.com/joho/godotenv"
)

type DatasetItem struct {
	ID               int             `json:"id"`
	Title            string          `json:"title"`
	Description      string          `json:"description"`
	Category         string          `json:"category"`
	LicenseID        int             `json:"license_id"`
	LicenseName      string          `json:"license_name,omitempty"`
	Provider         string          `json:"provider"`
	ProviderMetadata json.RawMessage `json:"provider_metadata"`
	CreatedAt        string          `json:"created_at"`
}

type License struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type APIToken struct {
	ID            int    `json:"id"`
	Token         string `json:"token"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	MonthlyLimit  int    `json:"monthly_limit"`
	UsedThisMonth int    `json:"used_this_month"`
	CreatedAt     string `json:"created_at"`
}

// Middleware para verificar a API Key de Admin
func AdminAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")
		adminKey := os.Getenv("ADMIN_API_KEY")

		if apiKey != adminKey || adminKey == "" {
			http.Error(w, "Acesso Negado: Chave de API Admin inválida", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Middleware para verificar Token de Usuário (Leitura/Escrita)
func TokenAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Se for requisição OPTIONS, libera
		if r.Method == "OPTIONS" {
			next.ServeHTTP(w, r)
			return
		}

		token := r.Header.Get("X-API-Key")
		if token == "" {
			http.Error(w, "Acesso Negado: Token não fornecido", http.StatusUnauthorized)
			return
		}

		var dbRole string
		var monthlyLimit, usedThisMonth, id int
		var lastUsedMonth sql.NullString

		err := database.DB.QueryRow("SELECT id, role, monthly_limit, used_this_month, last_used_month FROM tokens WHERE token = ?", token).Scan(&id, &dbRole, &monthlyLimit, &usedThisMonth, &lastUsedMonth)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Acesso Negado: Token inválido", http.StatusUnauthorized)
			} else {
				http.Error(w, "Erro no servidor ao validar token", http.StatusInternalServerError)
			}
			return
		}

		if r.Method == http.MethodPost && dbRole != "write" {
			http.Error(w, "Acesso Negado: Permissão insuficiente para inserção", http.StatusForbidden)
			return
		}

		if r.Method == http.MethodPost && monthlyLimit > 0 {
			currentMonth := time.Now().Format("2006-01")
			if !lastUsedMonth.Valid || lastUsedMonth.String != currentMonth {
				usedThisMonth = 0
			}
			if usedThisMonth >= monthlyLimit {
				http.Error(w, "Acesso Negado: Limite mensal de inserção atingido", http.StatusTooManyRequests)
				return
			}
		}

		// Passa o ID do token no header para uso interno nos handlers
		r.Header.Set("X-Token-ID", fmt.Sprintf("%d", id))
		next.ServeHTTP(w, r)
	})
}

// Middleware de CORS simplificado
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func getStatsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	stats := struct {
		TotalItems      int `json:"total_items"`
		TotalCategories int `json:"total_categories"`
		TotalProviders  int `json:"total_providers"`
	}{}

	database.DB.QueryRow("SELECT COUNT(*) FROM items").Scan(&stats.TotalItems)
	database.DB.QueryRow("SELECT COUNT(DISTINCT category) FROM items WHERE category != ''").Scan(&stats.TotalCategories)
	database.DB.QueryRow("SELECT COUNT(DISTINCT provider) FROM items WHERE provider != ''").Scan(&stats.TotalProviders)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func getSingleItemHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/items/")
	if idStr == "" {
		http.Error(w, "ID ausente", http.StatusBadRequest)
		return
	}

	query := `
		SELECT i.id, i.title, i.description, i.category, i.license_id, l.name as license_name, i.provider, i.provider_metadata, i.created_at 
		FROM items i 
		LEFT JOIN licenses l ON i.license_id = l.id 
		WHERE i.id = ?
	`
	row := database.DB.QueryRow(query, idStr)

	var item DatasetItem
	var metadata string
	var lName sql.NullString
	if err := row.Scan(&item.ID, &item.Title, &item.Description, &item.Category, &item.LicenseID, &lName, &item.Provider, &metadata, &item.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Dataset não encontrado", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if lName.Valid {
		item.LicenseName = lName.String
	}
	item.ProviderMetadata = json.RawMessage(metadata)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func getItemsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")
	
	page := 1
	limit := 20
	
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	offset := (page - 1) * limit

	searchTerm := r.URL.Query().Get("search")
	categoryFilter := r.URL.Query().Get("category")

	var conditions []string
	var args []interface{}

	if searchTerm != "" {
		conditions = append(conditions, "(i.title LIKE ? OR i.description LIKE ? OR i.category LIKE ?)")
		like := "%" + searchTerm + "%"
		args = append(args, like, like, like)
	}
	if categoryFilter != "" {
		conditions = append(conditions, "i.category = ?")
		args = append(args, categoryFilter)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	query := fmt.Sprintf(`
		SELECT i.id, i.title, i.description, i.category, i.license_id, l.name as license_name, i.provider, i.provider_metadata, i.created_at 
		FROM items i 
		LEFT JOIN licenses l ON i.license_id = l.id 
		%s
		ORDER BY i.created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)
	args = append(args, limit, offset)
	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []DatasetItem
	for rows.Next() {
		var item DatasetItem
		var metadata string
		var lName sql.NullString
		if err := rows.Scan(&item.ID, &item.Title, &item.Description, &item.Category, &item.LicenseID, &lName, &item.Provider, &metadata, &item.CreatedAt); err != nil {
			log.Println("Erro ao ler item:", err)
			continue
		}
		if lName.Valid {
			item.LicenseName = lName.String
		}
		item.ProviderMetadata = json.RawMessage(metadata)
		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func uploadToHuggingFace(filePath string, filename string) (string, error) {
	hfToken := os.Getenv("HF_TOKEN")
	hfRepo := os.Getenv("HF_DEFAULT_REPO")

	if hfToken == "" || hfRepo == "" {
		return "", fmt.Errorf("hugging face credentials not configured")
	}

	fileBytes, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	
	encodedContent := base64.StdEncoding.EncodeToString(fileBytes)

	payload := map[string]interface{}{
		"operations": []map[string]interface{}{
			{
				"operation": "addOrUpdate",
				"path":      filename,
				"content":   encodedContent,
				"encoding":  "base64",
			},
		},
		"commit_message": "Upload via CROM Dataset",
		"summary":        "Upload via CROM Dataset",
	}

	payloadBytes, _ := json.Marshal(payload)

	url := fmt.Sprintf("https://huggingface.co/api/datasets/%s/commit/main", hfRepo)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+hfToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated && resp.StatusCode != 200 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("HF API error: %d %s", resp.StatusCode, string(bodyBytes))
	}

	downloadUrl := fmt.Sprintf("https://huggingface.co/datasets/%s/resolve/main/%s?download=true", hfRepo, filename)
	return downloadUrl, nil
}

func createItemHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var item DatasetItem
	var metadataJSON []byte

	contentType := r.Header.Get("Content-Type")

	if strings.Contains(contentType, "multipart/form-data") {
		// Handler amigável para envio de arquivos/links pelo Frontend
		err := r.ParseMultipartForm(100 << 20) // 100MB Max
		if err != nil {
			http.Error(w, "Falha ao ler multipart form", http.StatusBadRequest)
			return
		}

		item.Title = r.FormValue("title")
		item.Description = r.FormValue("description")
		item.Category = r.FormValue("category")
		item.Provider = r.FormValue("provider")
		lid, _ := strconv.Atoi(r.FormValue("license_id"))
		item.LicenseID = lid

		// Sanitização de inputs
		if len(item.Title) > 200 {
			item.Title = item.Title[:200]
		}
		if len(item.Description) > 5000 {
			item.Description = item.Description[:5000]
		}

		profile := r.FormValue("profile")
		fileUrl := r.FormValue("url")

		// Processar Arquivo se existir
		file, handler, err := r.FormFile("file")
		if err == nil {
			defer file.Close()
			os.MkdirAll("uploads", os.ModePerm)
			filePath := "uploads/" + fmt.Sprintf("%d_", time.Now().Unix()) + handler.Filename
			f, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0666)
			if err == nil {
				io.Copy(f, file)
				f.Close()
				
				if item.Provider == "HuggingFace" {
					hfUrl, hfErr := uploadToHuggingFace(filePath, handler.Filename)
					if hfErr == nil {
						fileUrl = hfUrl
						os.Remove(filePath) // Remove local para economizar disco
					} else {
						log.Println("Erro HF Upload:", hfErr)
						fileUrl = "/api/" + filePath
					}
				} else {
					fileUrl = "/api/" + filePath
				}
			}
		}

		metadataMap := map[string]string{
			"profile": profile,
			"url": fileUrl,
		}
		metadataJSON, _ = json.Marshal(metadataMap)

	} else {
		// Handler tradicional de JSON (usado pelos mocks do monitor)
		if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}
		// Sanitização de inputs
		if len(item.Title) > 200 {
			item.Title = item.Title[:200]
		}
		if len(item.Description) > 5000 {
			item.Description = item.Description[:5000]
		}
		var err error
		metadataJSON, err = json.Marshal(item.ProviderMetadata)
		if err != nil {
			metadataJSON = []byte("{}")
		}
	}

	query := `INSERT INTO items (title, description, category, license_id, provider, provider_metadata) VALUES (?, ?, ?, ?, ?, ?)`
	res, err := database.DB.Exec(query, item.Title, item.Description, item.Category, item.LicenseID, item.Provider, string(metadataJSON))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	item.ID = int(id)

	// Incrementa contagem de uso do token se for POST
	tokenID := r.Header.Get("X-Token-ID")
	if tokenID != "" {
		currentMonth := time.Now().Format("2006-01")
		database.DB.Exec("UPDATE tokens SET used_this_month = used_this_month + 1, last_used_month = ? WHERE id = ?", currentMonth, tokenID)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

func getLicensesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	rows, err := database.DB.Query("SELECT id, name FROM licenses ORDER BY id ASC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var licenses []License
	for rows.Next() {
		var l License
		if err := rows.Scan(&l.ID, &l.Name); err != nil {
			log.Println("Erro ao ler licença:", err)
			continue
		}
		licenses = append(licenses, l)
	}

	if licenses == nil {
		licenses = []License{}
	}
	json.NewEncoder(w).Encode(licenses)
}

func createTokenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req APIToken
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || (req.Role != "read" && req.Role != "write") {
		http.Error(w, "Corpo da requisição inválido. Informe email e role (read/write).", http.StatusBadRequest)
		return
	}

	b := make([]byte, 16)
	rand.Read(b)
	newToken := hex.EncodeToString(b)

	query := `INSERT INTO tokens (token, email, role, monthly_limit) VALUES (?, ?, ?, ?)`
	res, err := database.DB.Exec(query, newToken, req.Email, req.Role, req.MonthlyLimit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	req.ID = int(id)
	req.Token = newToken

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

func SetupRouter() http.Handler {
	mux := http.NewServeMux()
	
	// Expor arquivos estáticos (Uploads locais)
	mux.Handle("/api/uploads/", http.StripPrefix("/api/uploads/", http.FileServer(http.Dir("./uploads"))))
	
	// Rotas protegidas por Token de Usuário
	userMux := http.NewServeMux()
	userMux.HandleFunc("/api/items/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			// Se for exatamente "/api/items/", cai no getAll. Senão, no getByID.
			if r.URL.Path == "/api/items" || r.URL.Path == "/api/items/" {
				getItemsHandler(w, r)
			} else {
				getSingleItemHandler(w, r)
			}
		} else if r.Method == http.MethodPost {
			createItemHandler(w, r)
		}
	})
	userMux.HandleFunc("/api/items", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			getItemsHandler(w, r)
		} else if r.Method == http.MethodPost {
			createItemHandler(w, r)
		}
	})
	userMux.HandleFunc("/api/licenses", getLicensesHandler)
	mux.Handle("/api/items", TokenAuthMiddleware(userMux))
	mux.Handle("/api/items/", TokenAuthMiddleware(userMux))
	mux.Handle("/api/licenses", TokenAuthMiddleware(userMux))

	// Rota pública de estatísticas (sem autenticação)
	mux.HandleFunc("/api/stats", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		getStatsHandler(w, r)
	})
	
	// Rotas protegidas por Admin API Key
	adminMux := http.NewServeMux()
	adminMux.HandleFunc("/api/admin/tokens", createTokenHandler)
	mux.Handle("/api/admin/tokens", AdminAuthMiddleware(adminMux))

	return CORSMiddleware(mux)
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: arquivo .env não encontrado, usando variáveis de ambiente do sistema.")
	}

	database.InitDB("")

	handler := SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Servidor rodando na porta %s\n", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}
