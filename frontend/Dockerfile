FROM nginx:alpine

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Créer le répertoire de l'application
WORKDIR /usr/share/nginx/html

# Copier les fichiers du frontend
COPY index.html .
COPY style.css .
COPY js/ /usr/share/nginx/html/js/

# Exposer le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]