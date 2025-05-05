# SQL Schema Designer

Une application web permettant de concevoir visuellement des schémas de bases de données SQL et de générer le code SQL correspondant.

## Fonctionnalités

- Création visuelle de schémas de bases de données
- Gestion de plusieurs projets avec persistance des données
- Création et modification de tables avec colonnes typées
- Définition de clés primaires et étrangères
- Relations entre tables avec visualisation graphique
- Export du code SQL (compatible PostgreSQL)
- Interface intuitive avec glisser-déposer
- Architecture complète avec Docker et Make

## Structure du projet

```
sql-schema-designer/
├── docker-compose.yml    # Configuration Docker Compose
├── Makefile              # Commandes Make pour simplifier l'utilisation
├── README.md             # Documentation du projet
├── backend/              # API backend Node.js
│   ├── package.json      # Dépendances Node.js
│   └── server.js         # Serveur Express
├── docker/               # Configuration Docker
│   ├── backend/          # Docker pour le backend
│   ├── frontend/         # Docker pour le frontend
│   └── postgres/         # Docker pour la base de données
├── frontend/             # Interface utilisateur
│   ├── index.html        # Page HTML principale
│   ├── style.css         # Styles CSS
│   └── js/               # Scripts JavaScript
│       ├── app.js        # Application principale
│       ├── model.js      # Modèles de données
│       ├── project-manager.js # Gestion des projets et persistance
│       ├── table-renderer.js  # Affichage des tables
│       ├── foreignkey-manager.js # Gestion des relations
│       └── sql-generator.js   # Génération du code SQL
└── scripts/              # Scripts utilitaires
```

## Prérequis

- Docker et Docker Compose
- Make (optionnel, mais recommandé)

## Installation

1. Clonez le dépôt:
```bash
git clone https://github.com/votre-nom/sql-schema-designer.git
cd sql-schema-designer
```

2. Construisez et démarrez l'application:
```bash
make build   # Construction des conteneurs Docker
make start   # Démarrage de l'application
```

Si vous n'avez pas Make, vous pouvez utiliser directement Docker Compose:
```bash
docker-compose build
docker-compose up -d
```

## Utilisation

1. **Accès à l'application**:
   - Ouvrez votre navigateur à l'adresse: http://localhost:8080

2. **Gestion des projets**:
   - Créez un nouveau projet via le bouton "Nouveau Projet"
   - Sélectionnez un projet existant dans la liste déroulante
   - Sauvegardez vos modifications avec le bouton "Sauvegarder"

3. **Conception du schéma**:
   - Ajoutez une table avec le bouton "Ajouter une Table"
   - Définissez le nom de la table et ses colonnes
   - Spécifiez les clés primaires et étrangères
   - Déplacez les tables en les faisant glisser sur le canvas

4. **Export SQL**:
   - Cliquez sur "Exporter SQL" pour générer le code SQL
   - Copiez le SQL généré pour l'utiliser dans votre SGBD

5. **Persistance des données**:
   - Vos projets sont automatiquement sauvegardés dans la base de données
   - Vous pouvez fermer et rouvrir l'application sans perdre vos schémas

## Commandes Make

```bash
make help     # Afficher l'aide
make build    # Construire les conteneurs Docker
make start    # Démarrer l'application
make stop     # Arrêter l'application
make restart  # Redémarrer l'application
make logs     # Afficher les logs
make clean    # Supprimer tous les conteneurs et volumes (efface les données)
```

## Architecture technique

L'application utilise une architecture en trois couches:

1. **Frontend** (Nginx + JavaScript vanilla):
   - Interface utilisateur pour la conception visuelle
   - Communication avec l'API backend pour la persistance

2. **Backend** (Node.js + Express):
   - API RESTful pour la gestion des projets
   - Sauvegarde et chargement des schémas de base de données

3. **Base de données** (PostgreSQL):
   - Stockage des projets et des schémas
   - Persistance des données entre les sessions

## Développement

Pour contribuer au développement:

1. Installez les dépendances du backend:
```bash
cd backend
npm install
```

2. Lancez l'application en mode développement:
```bash
make setup
make start
```

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.