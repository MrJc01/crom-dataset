package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB(dsn string) {
	if dsn == "" {
		dsn = "./dataset.db"
	}
	var err error
	DB, err = sql.Open("sqlite3", dsn)
	if err != nil {
		log.Fatalf("Erro ao abrir o banco de dados: %v", err)
	}

	createTables()
}

func createTables() {
	licenseTable := `
	CREATE TABLE IF NOT EXISTS licenses (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT UNIQUE NOT NULL
	);`

	_, err := DB.Exec(licenseTable)
	if err != nil {
		log.Fatalf("Erro ao criar tabela licenses: %v", err)
	}

	// Insere licenças padrões
	defaultLicenses := []string{
		"CC0 1.0 (Domínio Público)",
		"CC BY 4.0 (Uso Comercial)",
		"CC BY-NC 4.0 (Não Comercial)",
		"Suno Non-Commercial",
		"Proprietária",
	}
	for _, l := range defaultLicenses {
		DB.Exec("INSERT OR IGNORE INTO licenses (name) VALUES (?)", l)
	}

	query := `
	CREATE TABLE IF NOT EXISTS items (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT,
		category TEXT,
		license_id INTEGER,
		provider TEXT,
		provider_metadata JSON,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(license_id) REFERENCES licenses(id)
	);
	`
	_, err = DB.Exec(query)
	if err != nil {
		log.Fatalf("Erro ao criar tabela items: %v", err)
	}

	tokenTable := `
	CREATE TABLE IF NOT EXISTS tokens (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		token TEXT UNIQUE NOT NULL,
		email TEXT NOT NULL,
		role TEXT NOT NULL CHECK(role IN ('read', 'write')),
		monthly_limit INTEGER DEFAULT 0,
		used_this_month INTEGER DEFAULT 0,
		last_used_month TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(tokenTable)
	if err != nil {
		log.Fatalf("Erro ao criar tabela tokens: %v", err)
	}

	// Insere um token de leitura padrão para o frontend
	DB.Exec("INSERT OR IGNORE INTO tokens (token, email, role, monthly_limit) VALUES (?, ?, ?, ?)", "default-read-token", "frontend@local", "read", 0)

	log.Println("Tabelas inicializadas com sucesso.")
}
