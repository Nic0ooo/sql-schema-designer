/**
 * Application principale pour le SQL Schema Designer
 */

class App {
    constructor() {
        // Initialiser le modèle de données
        this.schema = new Schema();
        
        // Initialiser les composants de l'interface
        this.tableRenderer = null;
        this.foreignKeyManager = null;
        this.sqlGenerator = null;
        
        // Référence au modal et à son contenu
        this.tableModal = document.getElementById('table-modal');
        this.sqlModal = document.getElementById('sql-modal');
        this.currentEditingTable = null;
        
        // Initialiser l'application
        this.init();
    }
    
    // Initialise l'application
    init() {
        // Initialiser les gestionnaires
        this.sqlGenerator = new SQLGenerator(this.schema);
        this.foreignKeyManager = new ForeignKeyManager(this.schema, this);
        this.columnDragHandler = new ColumnDragHandler(this.schema);
        
        // Récupérer l'élément canvas pour le renderer
        const canvas = document.getElementById('canvas');
        this.tableRenderer = new TableRenderer(this.schema, canvas);
        
        // Exposer globalement pour que tableRenderer puisse y accéder
        window.app = this;
        window.foreignKeyManager = this.foreignKeyManager;
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
        
        // Ne plus ajouter automatiquement de table de démo
        // La table sera ajoutée uniquement pour les nouveaux projets vides
    }
    
    // Configure tous les écouteurs d'événements de l'interface
    setupEventListeners() {
        // Bouton d'ajout de table
        document.getElementById('add-table-btn').addEventListener('click', () => {
            this.openTableModal();
        });
        
        // Bouton d'export SQL
        document.getElementById('export-sql-btn').addEventListener('click', () => {
            this.exportSQL();
        });
        
        // Configuration du modal de table
        this.setupTableModalEvents();
        
        // Configuration du modal SQL
        this.setupSQLModalEvents();
        
        // Fermeture des modals avec les boutons de fermeture
        document.querySelectorAll('.close, .close-modal').forEach(element => {
            element.addEventListener('click', () => {
                this.tableModal.style.display = 'none';
                this.sqlModal.style.display = 'none';
            });
        });
        
        // Fermeture des modals en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target === this.tableModal) {
                this.tableModal.style.display = 'none';
            }
            if (e.target === this.sqlModal) {
                this.sqlModal.style.display = 'none';
            }
        });
    }
    
    // Configure les événements pour le modal de table
    setupTableModalEvents() {
        // Bouton d'ajout de colonne
        document.getElementById('add-column-btn').addEventListener('click', () => {
            this.addColumnToForm();
        });
        
        // Soumission du formulaire de table
        document.getElementById('table-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTable();
        });
    }
    
    // Configure les événements pour le modal SQL
    setupSQLModalEvents() {
        // Bouton de copie du SQL
        document.getElementById('copy-sql-btn').addEventListener('click', () => {
            const sqlOutput = document.getElementById('sql-output');
            navigator.clipboard.writeText(sqlOutput.textContent)
                .then(() => {
                    alert('SQL copié dans le presse-papiers !');
                })
                .catch(err => {
                    console.error('Erreur lors de la copie du SQL :', err);
                    // Fallback: sélectionner le texte
                    const range = document.createRange();
                    range.selectNode(sqlOutput);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                });
        });
    }
    
    // Ouvre le modal pour ajouter/éditer une table
    openTableModal(table = null) {
        // Réinitialiser le formulaire
        const form = document.getElementById('table-form');
        form.reset();
        
        // Vider le conteneur de colonnes
        const columnsContainer = document.getElementById('columns-container');
        columnsContainer.innerHTML = '';
        
        // Définir le titre du modal
        const modalTitle = document.getElementById('modal-title');
        
        if (table) {
            // Mode édition
            modalTitle.textContent = 'Éditer la Table';
            document.getElementById('table-name').value = table.name;
            
            // Ajouter les colonnes existantes
            table.columns.forEach(column => {
                this.addColumnToForm(column);
            });
            
            this.currentEditingTable = table;
        } else {
            // Mode création
            modalTitle.textContent = 'Ajouter une Table';
            this.currentEditingTable = null;
            
            // Ajouter une colonne vide par défaut
            this.addColumnToForm();
        }
        
        // Mettre à jour les options de clé étrangère
        this.foreignKeyManager.updateForeignKeyOptions(form);
        
        // Configurer le glisser-déposer pour réorganiser les colonnes
        const tableId = this.currentEditingTable ? this.currentEditingTable.id : null;
        setTimeout(() => {
            this.columnDragHandler.setupColumnDragInModal(columnsContainer, tableId);
        }, 100);
        
        // Afficher le modal
        this.tableModal.style.display = 'block';
    }
    
    // Ajoute une colonne au formulaire
    addColumnToForm(column = null) {
        const columnsContainer = document.getElementById('columns-container');
        
        // Cloner le template de colonne
        const template = document.getElementById('column-template');
        const columnRow = template.content.cloneNode(true).querySelector('.column-row');
        
        // Obtenir les éléments de la ligne
        const columnName = columnRow.querySelector('.column-name');
        const columnType = columnRow.querySelector('.column-type');
        const primaryKeyCheckbox = columnRow.querySelector('.primary-key');
        const foreignKeyCheckbox = columnRow.querySelector('.foreign-key');
        const foreignKeyOptions = columnRow.querySelector('.foreign-key-options');
        const referenceTable = columnRow.querySelector('.reference-table');
        const referenceColumn = columnRow.querySelector('.reference-column');
        const removeBtn = columnRow.querySelector('.remove-column-btn');
        
        // Configurer les événements pour cette ligne
        foreignKeyCheckbox.addEventListener('change', () => {
            if (foreignKeyCheckbox.checked) {
                foreignKeyOptions.classList.remove('hidden');
                this.foreignKeyManager.updateForeignKeyOptions(columnRow);
            } else {
                foreignKeyOptions.classList.add('hidden');
            }
        });
        
        referenceTable.addEventListener('change', () => {
            this.foreignKeyManager.updateReferenceColumns(referenceTable, referenceColumn);
        });
        
        removeBtn.addEventListener('click', () => {
            if (columnsContainer.children.length > 1) {
                columnsContainer.removeChild(columnRow);
            } else {
                alert('Une table doit avoir au moins une colonne.');
            }
        });
        
        // Si on édite une colonne existante, remplir les champs
        if (column) {
            columnName.value = column.name;
            columnType.value = column.type;
            primaryKeyCheckbox.checked = column.isPrimaryKey;
            foreignKeyCheckbox.checked = column.isForeignKey;
            
            // Stocker les références pour une utilisation ultérieure
            if (column.isForeignKey) {
                foreignKeyOptions.classList.remove('hidden');
                
                // Stocker les références dans des attributs data pour les récupérer après la mise à jour des options
                columnRow.dataset.referenceTable = column.referenceTable || '';
                columnRow.dataset.referenceColumn = column.referenceColumn || '';
            }
            
            // Stocker l'ID de la colonne pour l'édition
            columnRow.dataset.columnId = column.id;
        }
        
        // Ajouter la ligne au conteneur
        columnsContainer.appendChild(columnRow);
        
        // Mettre à jour les options de clé étrangère
        setTimeout(() => {
            this.foreignKeyManager.updateForeignKeyOptions(columnRow);
            
            // Si c'est une clé étrangère existante, restaurer les valeurs sélectionnées
            if (column && column.isForeignKey) {
                setTimeout(() => {
                    // Maintenant que les options sont mises à jour, sélectionner les bonnes valeurs
                    if (columnRow.dataset.referenceTable) {
                        referenceTable.value = columnRow.dataset.referenceTable;
                        // Déclencher la mise à jour des colonnes de référence
                        const event = new Event('change');
                        referenceTable.dispatchEvent(event);
                        
                        // Attendre que les colonnes soient mises à jour puis sélectionner la colonne de référence
                        setTimeout(() => {
                            if (columnRow.dataset.referenceColumn) {
                                referenceColumn.value = columnRow.dataset.referenceColumn;
                            }
                        }, 50);
                    }
                }, 50);
            }
        }, 0);
    }
    
    // Enregistre la table à partir du formulaire
    saveTable() {
        const tableName = document.getElementById('table-name').value.trim();
        if (!tableName) {
            alert('Veuillez saisir un nom de table.');
            return;
        }
        
        // Vérifier la validité des colonnes
        const columnRows = document.querySelectorAll('#columns-container .column-row');
        const columns = [];
        
        let hasColumn = false;
        let hasPrimaryKey = false;
        
        // Variable pour suivre si une clé étrangère manque de référence
        let missingForeignKeyReference = false;
        
        // Utiliser le gestionnaire de glisser-déposer pour récupérer les colonnes dans leur ordre actuel
        columnRows.forEach(row => {
            const name = row.querySelector('.column-name').value.trim();
            if (name) {
                hasColumn = true;
                const type = row.querySelector('.column-type').value;
                const isPrimaryKey = row.querySelector('.primary-key').checked;
                const isForeignKey = row.querySelector('.foreign-key').checked;
                
                let referenceTable = null;
                let referenceColumn = null;
                
                if (isForeignKey) {
                    referenceTable = row.querySelector('.reference-table').value;
                    referenceColumn = row.querySelector('.reference-column').value;
                    
                    if (!referenceTable || !referenceColumn) {
                        missingForeignKeyReference = true;
                        // Ne pas sortir de la fonction ici, continuer pour collecter toutes les erreurs
                    }
                }
                
                if (isPrimaryKey) {
                    hasPrimaryKey = true;
                }
                
                columns.push({
                    id: row.dataset.columnId,
                    name,
                    type,
                    isPrimaryKey,
                    isForeignKey,
                    referenceTable,
                    referenceColumn
                });
            }
        });
        
        // Vérifier s'il manque des références de clés étrangères
        if (missingForeignKeyReference) {
            alert('Veuillez sélectionner une table et une colonne de référence pour chaque clé étrangère.');
            return;
        }
        
        if (!hasColumn) {
            alert('Veuillez ajouter au moins une colonne.');
            return;
        }
        
        // Créer ou mettre à jour la table
        let table;
        let isNewTable = false;
        
        if (this.currentEditingTable) {
            // Mode édition - conserver les coordonnées x, y et l'échelle
            table = this.currentEditingTable;
            const oldName = table.name;
            table.name = tableName;
            
            // Mémoriser les colonnes et relations à préserver avant la suppression
            const columnsToKeep = [];
            columns.forEach(newCol => {
                if (newCol.id) {
                    const existingColumn = table.columns.find(col => col.id === newCol.id);
                    if (existingColumn) {
                        columnsToKeep.push(newCol.id);
                    }
                }
            });
            
            // Supprimer toutes les anciennes colonnes et relations
            while (table.columns.length > 0) {
                this.schema.removeColumn(table.id, table.columns[0].id);
            }
            
            // Supprimer l'élément DOM de la table existante pour éviter le doublon
            const existingTableElement = document.getElementById(table.id);
            if (existingTableElement) {
                existingTableElement.remove();
            }
        } else {
            // Mode création - générer une position aléatoire sur le canvas
            const canvas = document.getElementById('canvas');
            const canvasWidth = canvas.clientWidth - 250; // Tenir compte de la largeur de la table
            const canvasHeight = canvas.clientHeight - 150; // Tenir compte de la hauteur de la table
            const x = Math.floor(Math.random() * canvasWidth);
            const y = Math.floor(Math.random() * canvasHeight);
            
            table = this.schema.createTable(tableName, x, y);
            isNewTable = true;
        }
        
        // Ajouter les nouvelles colonnes
        columns.forEach(columnData => {
            this.schema.createColumn(
                table.id,
                columnData.name,
                columnData.type,
                columnData.isPrimaryKey,
                columnData.isForeignKey,
                columnData.referenceTable,
                columnData.referenceColumn
            );
        });
        
        // Fermer le modal
        this.tableModal.style.display = 'none';
        
        // Mettre à jour l'affichage
        this.tableRenderer.renderTable(table);
        this.foreignKeyManager.renderRelationships();
    }
    
    // Exporte le SQL vers le modal
    exportSQL() {
        const sql = this.sqlGenerator.generateSQL();
        document.getElementById('sql-output').textContent = sql;
        this.sqlModal.style.display = 'block';
    }
    
    // Ajoute une table de démonstration par défaut
    // Cette méthode ne sera plus appelée automatiquement
    // Elle sera utilisée uniquement quand nécessaire
    addDefaultTable() {
        // Créer une table "users" de démo
        const usersTable = this.schema.createTable('users', 50, 50);
        
        // Ajouter quelques colonnes de base
        this.schema.createColumn(usersTable.id, 'id', 'SERIAL', true);
        this.schema.createColumn(usersTable.id, 'username', 'VARCHAR(50)', false);
        this.schema.createColumn(usersTable.id, 'email', 'VARCHAR(100)', false);
        this.schema.createColumn(usersTable.id, 'created_at', 'TIMESTAMP', false);
        
        // Afficher la table
        this.tableRenderer.renderTable(usersTable);
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});