package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

// StorageProvider define a interface para qualquer provedor de armazenamento externo.
// O CROM Dataset é uma "casca" — nunca armazena binários localmente.
// Todos os dados são delegados a provedores externos.
type StorageProvider interface {
	// Upload envia bytes para o provedor e retorna a URL pública de download.
	Upload(fileBytes []byte, filename string) (downloadURL string, err error)
	// Name retorna o nome identificador do provedor.
	Name() string
}

// ── HuggingFace Provider ──────────────────────────────────────────────

// HuggingFaceProvider implementa upload para repositórios HuggingFace Datasets.
type HuggingFaceProvider struct {
	Token  string
	RepoID string
}

func NewHuggingFaceProvider() (*HuggingFaceProvider, error) {
	token := os.Getenv("HF_TOKEN")
	repo := os.Getenv("HF_DEFAULT_REPO")
	if token == "" || repo == "" {
		return nil, fmt.Errorf("HF_TOKEN e HF_DEFAULT_REPO devem estar configurados no .env")
	}
	return &HuggingFaceProvider{Token: token, RepoID: repo}, nil
}

func (hf *HuggingFaceProvider) Name() string {
	return "HuggingFace"
}

// Upload envia os bytes diretamente para a API do HuggingFace via formato NDJSON.
// A API do HuggingFace requer Content-Type: application/x-ndjson (newline-delimited JSON).
func (hf *HuggingFaceProvider) Upload(fileBytes []byte, filename string) (string, error) {
	encodedContent := base64.StdEncoding.EncodeToString(fileBytes)

	// Usa timestamp para evitar colisões de nome
	uniqueFilename := fmt.Sprintf("%d_%s", time.Now().Unix(), filename)

	// Formato NDJSON: cada linha é um JSON independente
	// Linha 1: header com mensagem do commit
	// Linha 2: conteúdo do arquivo em base64
	headerLine, _ := json.Marshal(map[string]interface{}{
		"key": "header",
		"value": map[string]string{
			"summary": "Upload via CROM Dataset",
		},
	})

	fileLine, _ := json.Marshal(map[string]interface{}{
		"key": "file",
		"value": map[string]interface{}{
			"content":  encodedContent,
			"path":     uniqueFilename,
			"encoding": "base64",
		},
	})

	ndjsonPayload := append(headerLine, '\n')
	ndjsonPayload = append(ndjsonPayload, fileLine...)
	ndjsonPayload = append(ndjsonPayload, '\n')

	url := fmt.Sprintf("https://huggingface.co/api/datasets/%s/commit/main", hf.RepoID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(ndjsonPayload))
	if err != nil {
		return "", fmt.Errorf("erro ao criar requisição HF: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+hf.Token)
	req.Header.Set("Content-Type", "application/x-ndjson")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("erro de rede ao conectar ao HuggingFace: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("HuggingFace API retornou %d: %s", resp.StatusCode, string(bodyBytes))
	}

	downloadURL := fmt.Sprintf("https://huggingface.co/datasets/%s/resolve/main/%s?download=true", hf.RepoID, uniqueFilename)
	return downloadURL, nil
}

// ── Internet Archive Provider ─────────────────────────────────────────

// InternetArchiveProvider implementa upload via S3-like API do Internet Archive.
// Gratuito, ilimitado, sem cartão de crédito.
// Docs: https://archive.org/developers/ias3.html
type InternetArchiveProvider struct {
	AccessKey string
	SecretKey string
	ItemID    string // Nome do "bucket" (item) no archive.org
}

func NewInternetArchiveProvider() (*InternetArchiveProvider, error) {
	accessKey := os.Getenv("IA_ACCESS_KEY")
	secretKey := os.Getenv("IA_SECRET_KEY")
	itemID := os.Getenv("IA_ITEM_ID")
	if accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("IA_ACCESS_KEY e IA_SECRET_KEY devem estar configurados no .env (obtenha em https://archive.org/account/s3.php)")
	}
	if itemID == "" {
		itemID = "crom-dataset-uploads"
	}
	return &InternetArchiveProvider{AccessKey: accessKey, SecretKey: secretKey, ItemID: itemID}, nil
}

func (ia *InternetArchiveProvider) Name() string {
	return "InternetArchive"
}

// Upload envia arquivo via PUT para a API S3-like do Internet Archive.
func (ia *InternetArchiveProvider) Upload(fileBytes []byte, filename string) (string, error) {
	uniqueFilename := fmt.Sprintf("%d_%s", time.Now().Unix(), filename)

	url := fmt.Sprintf("https://s3.us.archive.org/%s/%s", ia.ItemID, uniqueFilename)
	req, err := http.NewRequest("PUT", url, bytes.NewReader(fileBytes))
	if err != nil {
		return "", fmt.Errorf("erro ao criar requisição IA: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("LOW %s:%s", ia.AccessKey, ia.SecretKey))
	req.Header.Set("x-amz-auto-make-bucket", "1")
	req.Header.Set("x-archive-meta-collection", "opensource")
	req.Header.Set("x-archive-meta-mediatype", "data")
	req.Header.Set("x-archive-meta-title", "CROM Dataset Uploads")
	req.Header.Set("x-archive-queue-derive", "0") // Skip derive (desnecessário para datasets)
	req.ContentLength = int64(len(fileBytes))

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("erro de rede ao conectar ao Internet Archive: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Internet Archive API retornou %d: %s", resp.StatusCode, string(bodyBytes))
	}

	downloadURL := fmt.Sprintf("https://archive.org/download/%s/%s", ia.ItemID, uniqueFilename)
	return downloadURL, nil
}

// ── Catbox.moe Provider ───────────────────────────────────────────────

// CatboxProvider implementa upload anônimo para Catbox.moe.
// Gratuito, sem conta, permanente, até 200MB por arquivo.
type CatboxProvider struct{}

func NewCatboxProvider() (*CatboxProvider, error) {
	return &CatboxProvider{}, nil
}

func (cb *CatboxProvider) Name() string {
	return "Catbox"
}

// Upload envia arquivo via multipart POST para a API do Catbox.moe (anônimo).
func (cb *CatboxProvider) Upload(fileBytes []byte, filename string) (string, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	_ = writer.WriteField("reqtype", "fileupload")

	part, err := writer.CreateFormFile("fileToUpload", filename)
	if err != nil {
		return "", fmt.Errorf("erro ao criar form file para Catbox: %w", err)
	}
	if _, err := part.Write(fileBytes); err != nil {
		return "", fmt.Errorf("erro ao escrever bytes para Catbox: %w", err)
	}
	writer.Close()

	req, err := http.NewRequest("POST", "https://catbox.moe/user/api.php", body)
	if err != nil {
		return "", fmt.Errorf("erro ao criar requisição Catbox: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; CROMDataset/1.0)")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("erro de rede ao conectar ao Catbox.moe: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	downloadURL := string(respBytes)

	if resp.StatusCode != http.StatusOK || downloadURL == "" {
		return "", fmt.Errorf("Catbox.moe retornou %d: %s", resp.StatusCode, downloadURL)
	}

	return downloadURL, nil
}

// ── Provider Registry ─────────────────────────────────────────────────

// SupportedProviders retorna a lista de provedores disponíveis para upload de arquivos.
var SupportedFileProviders = []string{"HuggingFace", "InternetArchive", "Catbox"}

// GetStorageProvider retorna o provider correto com base no nome.
// Para "Link Externo" / outros, não há provider — a URL já é fornecida pelo usuário.
func GetStorageProvider(providerName string) (StorageProvider, error) {
	switch providerName {
	case "HuggingFace":
		return NewHuggingFaceProvider()
	case "InternetArchive":
		return NewInternetArchiveProvider()
	case "Catbox":
		return NewCatboxProvider()
	default:
		return nil, fmt.Errorf("provedor de storage não suportado para upload de arquivo: '%s'. Suportados: %v", providerName, SupportedFileProviders)
	}
}
