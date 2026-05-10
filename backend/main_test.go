package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"crom-dataset/database"
)

func setupTestDB() {
	// Inicializa o banco SQLite na memória RAM para não criar sujeira
	database.InitDB(":memory:")
}

func TestGetItems(t *testing.T) {
	setupTestDB()
	router := SetupRouter()

	req, _ := http.NewRequest("GET", "/api/items", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Esperava status %d por falta de token, obteve %d", http.StatusUnauthorized, w.Code)
	}
}

func TestCreateToken(t *testing.T) {
	setupTestDB()
	os.Setenv("ADMIN_API_KEY", "superadmin")
	router := SetupRouter()

	reqBody := []byte(`{"email":"teste@crom.run","role":"write","monthly_limit":10}`)
	req, _ := http.NewRequest("POST", "/api/admin/tokens", bytes.NewBuffer(reqBody))
	req.Header.Set("X-API-Key", "superadmin")
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Esperava %d ao criar token, obteve %d. Body: %s", http.StatusCreated, w.Code, w.Body.String())
	}
}

func TestPostItemWithToken(t *testing.T) {
	setupTestDB()
	router := SetupRouter()

	// Inserir um token válido de escrita manualmente para o teste
	_, err := database.DB.Exec("INSERT INTO tokens (token, email, role, monthly_limit) VALUES (?, ?, ?, ?)", "test-write-token", "test@crom.run", "write", 100)
	if err != nil {
		t.Fatalf("Falha ao inserir token de teste: %v", err)
	}

	reqBody := []byte(`{"title":"Meu Dataset Teste","description":"Descricao", "category": "Audio", "provider": "Local"}`)
	req, _ := http.NewRequest("POST", "/api/items", bytes.NewBuffer(reqBody))
	req.Header.Set("X-API-Key", "test-write-token")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Esperava %d ao enviar token correto, obteve %d. Body: %s", http.StatusCreated, w.Code, w.Body.String())
	}

	var item DatasetItem
	err = json.Unmarshal(w.Body.Bytes(), &item)
	if err != nil {
		t.Fatalf("Erro ao decodificar resposta JSON: %v", err)
	}

	if item.Title != "Meu Dataset Teste" {
		t.Errorf("O título inserido não corresponde: %s", item.Title)
	}
}
