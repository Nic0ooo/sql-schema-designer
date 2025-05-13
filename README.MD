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
- Réorganisation des colonnes par glisser-déposer
- Options avancées pour les colonnes:
  - Définition de taille pour VARCHAR et CHAR
  - Précision et échelle pour les types numériques
  - Types sériels auto-incrémentés (SERIAL, BIGSERIAL, SMALLSERIAL)
  - Contraintes NOT NULL
  - Valeurs par défaut
- Zoom et déplacement du canvas pour une meilleure visualisation
- Architecture complète avec Docker et Make

## Structure du projet

```bash
sql-schema-designer/
├── docker-compose.yml     # Configuration Docker Compose
├── Makefile               # Commandes Make pour simplifier l'utilisation
├── README.md              # Documentation du projet
├── backend/               # API backend Node.js
│   ├── Dockerfile         # Configuration Docker pour le backend
│   ├── package.json       # Dépendances Node.js
│   └── src/               # Code source du backend
│       └── server.js      # Serveur Express
├── postgres/              # Configuration PostgreSQL
│   ├── Dockerfile         # Configuration Docker pour PostgreSQL
│   └── init.sql           # Script d'initialisation de la base de données
├── frontend/              # Interface utilisateur
│   ├── Dockerfile         # Configuration Docker pour le frontend
│   ├── index.html         # Page HTML principale
│   ├── style.css          # Styles CSS
│   ├── nginx.conf         # Configuration du serveur web Nginx
│   └── js/                # Scripts JavaScript
│       ├── app.js              # Application principale
│       ├── model.js            # Modèles de données
│       ├── project-manager.js  # Gestion des projets et persistance
│       ├── table-renderer.js   # Affichage des tables
│       ├── foreignkey-manager.js # Gestion des relations
│       ├── sql-generator.js    # Génération du code SQL
│       └── column-drag-handler.js # Gestion du réarrangement des colonnes
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
   - Ouvrez votre navigateur à l'adresse: `http://localhost:8080`

2. **Gestion des projets**:
   - Créez un nouveau projet via le bouton "Nouveau Projet"
   - Sélectionnez un projet existant dans la liste déroulante
   - Sauvegardez vos modifications avec le bouton "Sauvegarder"

3. **Conception du schéma**:
   - Ajoutez une table avec le bouton "Ajouter une Table"
   - Définissez le nom de la table et ses colonnes
   - Spécifiez les clés primaires et étrangères
   - Déplacez les tables en les faisant glisser sur le canvas
   - Réorganisez les colonnes avec le glisser-déposer en utilisant les poignées (⋮⋮)

4. **Options avancées des colonnes**:
   - Cliquez sur le bouton d'options (⚙️) pour chaque colonne
   - Spécifiez la taille pour les types VARCHAR et CHAR (ex: VARCHAR(255))
   - Définissez la précision et l'échelle pour les types numériques
   - Ajoutez des contraintes NOT NULL et des valeurs par défaut
   - Utilisez les types SERIAL pour les clés primaires auto-incrémentées

5. **Export SQL**:
   - Cliquez sur "Exporter SQL" pour générer le code SQL
   - Copiez le SQL généré pour l'utiliser dans votre SGBD

6. **Navigation dans le schéma**:
   - Utilisez la molette de la souris pour zoomer (avec la touche Ctrl)
   - Déplacez le canvas avec le clic droit ou le clic molette

7. **Persistance des données**:
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