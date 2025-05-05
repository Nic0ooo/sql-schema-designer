-- Création de la table des projets pour stocker les différents schémas
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table des tables pour chaque projet
CREATE TABLE IF NOT EXISTS schema_tables (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    table_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    x INTEGER NOT NULL DEFAULT 50,
    y INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table des colonnes pour chaque table
CREATE TABLE IF NOT EXISTS table_columns (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL REFERENCES schema_tables(id) ON DELETE CASCADE,
    column_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_primary_key BOOLEAN NOT NULL DEFAULT FALSE,
    is_foreign_key BOOLEAN NOT NULL DEFAULT FALSE,
    reference_table VARCHAR(50),
    reference_column VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table des relations entre tables
CREATE TABLE IF NOT EXISTS relationships (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    relationship_id VARCHAR(50) NOT NULL,
    source_table VARCHAR(50) NOT NULL,
    source_column VARCHAR(50) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    target_column VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Projet de démonstration
INSERT INTO projects (name, description) 
VALUES ('Projet de démonstration', 'Un projet d''exemple pour montrer les fonctionnalités de SQL Schema Designer');