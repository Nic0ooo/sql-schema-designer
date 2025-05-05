FROM postgres:15-alpine

# Copier des scripts d'initialisation
COPY init.sql /docker-entrypoint-initdb.d/

# Exposer le port PostgreSQL
EXPOSE 5432