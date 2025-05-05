FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package.json et installer les dépendances
COPY package.json ./
RUN npm install

# Copier le code source
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["node", "src/server.js"]