.PHONY: build start stop restart clean logs setup help

# Variables
DOCKER_COMPOSE = docker-compose

help:
	@echo "SQL Schema Designer - Commandes disponibles:"
	@echo "make build    - Construire tous les conteneurs"
	@echo "make start    - Démarrer l'application"
	@echo "make stop     - Arrêter l'application"
	@echo "make restart  - Redémarrer l'application"
	@echo "make clean    - Supprimer tous les conteneurs et volumes"
	@echo "make logs     - Afficher les logs"
	@echo "make setup    - Installer les dépendances du projet"

build:
	$(DOCKER_COMPOSE) build

start:
	$(DOCKER_COMPOSE) up -d

stop:
	$(DOCKER_COMPOSE) down

restart: stop start

clean:
	$(DOCKER_COMPOSE) down -v --remove-orphans

logs:
	$(DOCKER_COMPOSE) logs -f

setup:
	cd backend && npm install