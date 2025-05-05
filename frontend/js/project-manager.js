/**
 * Gestionnaire de projets pour SQL Schema Designer
 * Ce module s'occupe des opérations liées à la persistance des projets
 */

class ProjectManager {
    constructor(app) {
        this.app = app;
        this.currentProjectId = null;
        this.projects = [];
        this.apiUrl = 'http://localhost:3000'; // URL de l'API backend
        
        // Référence aux éléments DOM
        this.projectModal = document.getElementById('project-modal');
        this.projectSelector = document.getElementById('project-selector');
        this.saveButton = document.getElementById('save-project-btn');
        
        // Initialiser
        this.init();
    }
    
    // Initialisation: charger les projets et configurer les événements
    async init() {
        // Charger la liste des projets
        await this.loadProjects();
        
        // Configuration des événements
        this.setupEventListeners();
        
        // Désactiver certains boutons au démarrage
        this.updateUIState(false);
    }
    
    // Configuration des événements liés aux projets
    setupEventListeners() {
        // Bouton nouveau projet
        document.getElementById('new-project-btn').addEventListener('click', () => {
            this.openProjectModal();
        });
        
        // Soumission du formulaire de projet
        document.getElementById('project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });
        
        // Changement de projet dans le sélecteur
        this.projectSelector.addEventListener('change', () => {
            const selectedProjectId = this.projectSelector.value;
            if (selectedProjectId) {
                this.loadProject(selectedProjectId);
            } else {
                // Réinitialiser l'application si aucun projet n'est sélectionné
                this.resetApplication();
                this.currentProjectId = null;
                this.updateUIState(false);
            }
        });
        
        // Bouton de sauvegarde
        this.saveButton.addEventListener('click', () => {
            if (this.currentProjectId) {
                this.saveProject();
            } else {
                alert('Veuillez d\'abord sélectionner ou créer un projet.');
            }
        });
        
        // Fermeture du modal de projet
        document.querySelectorAll('#project-modal .close, #project-modal .close-modal').forEach(element => {
            element.addEventListener('click', () => {
                this.projectModal.style.display = 'none';
            });
        });
    }
    
    // Nouvelle méthode pour réinitialiser complètement l'application
    resetApplication() {
        // Créer un nouveau schéma vide
        this.app.schema = new Schema();
        
        // Nettoyer le canvas
        const canvas = document.getElementById('canvas');
        const tables = canvas.querySelectorAll('.table-card');
        tables.forEach(table => {
            canvas.removeChild(table);
        });
        
        // Mettre à jour les renderers
        this.app.tableRenderer.schema = this.app.schema;
        this.app.foreignKeyManager.schema = this.app.schema;
        this.app.sqlGenerator.schema = this.app.schema;
    }
    
    // Charger la liste des projets depuis l'API
    async loadProjects() {
        try {
            const response = await fetch(`${this.apiUrl}/projects`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            this.projects = await response.json();
            
            // Mettre à jour le sélecteur de projets
            this.updateProjectSelector();
            
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
            alert('Impossible de charger la liste des projets. Vérifiez que le serveur est bien démarré.');
        }
    }
    
    // Mettre à jour le sélecteur de projets dans l'UI
    updateProjectSelector() {
        // Vider le sélecteur
        this.projectSelector.innerHTML = '<option value="">-- Sélectionner un projet --</option>';
        
        // Ajouter chaque projet comme option
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            this.projectSelector.appendChild(option);
        });
    }
    
    // Ouvre le modal de création de projet
    openProjectModal() {
        // Réinitialiser le formulaire
        document.getElementById('project-form').reset();
        
        // Afficher le modal
        this.projectModal.style.display = 'block';
    }
    
    // Créer un nouveau projet
    async createProject() {
        const name = document.getElementById('project-name').value.trim();
        const description = document.getElementById('project-description').value.trim();
        
        if (!name) {
            alert('Veuillez saisir un nom de projet.');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const newProject = await response.json();
            
            // Fermer le modal
            this.projectModal.style.display = 'none';
            
            // Rafraîchir la liste des projets
            await this.loadProjects();
            
            // Réinitialiser l'application et créer un schéma vide
            this.resetApplication();
            
            // Sélectionner le nouveau projet
            this.projectSelector.value = newProject.id;
            
            // Définir le projet courant
            this.currentProjectId = newProject.id;
            
            // Activer les boutons
            this.updateUIState(true);
            
            alert(`Projet "${name}" créé avec succès.`);
            
        } catch (error) {
            console.error('Erreur lors de la création du projet:', error);
            alert('Impossible de créer le projet. Veuillez réessayer.');
        }
    }
    
    // Charger un projet spécifique depuis l'API
    async loadProject(projectId) {
        try {
            const response = await fetch(`${this.apiUrl}/projects/${projectId}`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const project = await response.json();
            
            // Réinitialiser l'application avant de charger les données du projet
            this.resetApplication();
            
            // Définir le projet courant et convertir les données en schéma
            this.currentProjectId = projectId;
            this.convertProjectToSchema(project);
            
            // Activer les boutons
            this.updateUIState(true);
            
        } catch (error) {
            console.error('Erreur lors du chargement du projet:', error);
            alert('Impossible de charger le projet. Veuillez réessayer.');
        }
    }
    
    // Sauvegarder le projet actuel
    async saveProject() {
        if (!this.currentProjectId) {
            alert('Aucun projet sélectionné.');
            return;
        }
        
        try {
            // Convertir le schéma actuel en données à envoyer
            const schemaData = {
                tables: Object.values(this.app.schema.tables),
                relationships: Object.values(this.app.schema.relationships)
            };
            
            const response = await fetch(`${this.apiUrl}/projects/${this.currentProjectId}/schema`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(schemaData)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            alert('Projet sauvegardé avec succès.');
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du projet:', error);
            alert('Impossible de sauvegarder le projet. Veuillez réessayer.');
        }
    }
    
    // Conversion des données du projet en schéma pour l'application
    convertProjectToSchema(project) {
        // Créer un nouveau schéma
        const schema = new Schema();
        
        // Créer les tables
        project.tables.forEach(tableData => {
            const table = schema.createTable(tableData.name, tableData.x, tableData.y);
            table.id = tableData.table_id;
            
            // Ajouter les colonnes
            tableData.columns.forEach(colData => {
                schema.createColumn(
                    table.id,
                    colData.name,
                    colData.type,
                    colData.is_primary_key,
                    colData.is_foreign_key,
                    colData.reference_table,
                    colData.reference_column
                );
            });
        });
        
        // Ajouter les relations
        project.relationships.forEach(relData => {
            schema.createRelationship(
                relData.source_table,
                relData.source_column,
                relData.target_table,
                relData.target_column
            );
        });
        
        // Mettre à jour le schéma de l'application
        this.app.schema = schema;
        
        // Mettre à jour les références du schéma dans les gestionnaires
        this.app.tableRenderer.schema = schema;
        this.app.foreignKeyManager.schema = schema;
        this.app.sqlGenerator.schema = schema;
        
        // Rafraîchir l'affichage
        this.app.tableRenderer.renderTables();
        this.app.foreignKeyManager.renderRelationships();
    }
    
    // Mettre à jour l'état de l'interface utilisateur
    updateUIState(projectLoaded) {
        document.getElementById('add-table-btn').disabled = !projectLoaded;
        document.getElementById('save-project-btn').disabled = !projectLoaded;
        document.getElementById('export-sql-btn').disabled = !projectLoaded;
        
        // Style visuel pour les boutons désactivés
        const buttons = [
            document.getElementById('add-table-btn'),
            document.getElementById('save-project-btn'),
            document.getElementById('export-sql-btn')
        ];
        
        buttons.forEach(btn => {
            if (projectLoaded) {
                btn.classList.remove('disabled-btn');
            } else {
                btn.classList.add('disabled-btn');
            }
        });
    }
}

// Initialiser le gestionnaire de projets au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que l'instance d'App soit disponible
    setTimeout(() => {
        if (window.app) {
            window.projectManager = new ProjectManager(window.app);
        } else {
            console.error('L\'instance App n\'est pas disponible.');
        }
    }, 100);
});