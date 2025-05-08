/**
 * Gestion du glisser-déposer des colonnes pour réorganiser leur ordre
 */
class ColumnDragHandler {
    constructor(schema) {
        this.schema = schema;
        this.draggedElement = null;
        this.dragColumn = null;
        this.sourceTable = null;
        this.placeholder = null;
        this.initialY = 0;
        this.offsetY = 0;
        
        this.init();
    }
    
    init() {
        // Ajoute les gestionnaires d'événements globaux pour le drag & drop
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    /**
     * Initialise le drag & drop pour une liste de colonnes dans le modal d'édition de table
     * @param {HTMLElement} columnsList - L'élément conteneur des colonnes
     * @param {string} tableId - L'ID de la table en cours d'édition
     */
    setupColumnDragInModal(columnsList, tableId) {
        // Récupération des lignes de colonnes
        const columnRows = columnsList.querySelectorAll('.column-row');
        
        // Ajout des gestionnaires d'événements pour chaque ligne
        columnRows.forEach(row => {
            // Vérifier si une poignée existe déjà
            let dragHandle = row.querySelector('.column-drag-handle');
            
            if (!dragHandle) {
                // Créer la poignée de drag & drop
                dragHandle = document.createElement('div');
                dragHandle.className = 'column-drag-handle';
                dragHandle.innerHTML = '⋮⋮'; // Icône de glissement
                dragHandle.title = 'Glisser pour réorganiser';
                
                // Insérer la poignée au début de la ligne
                row.insertBefore(dragHandle, row.firstChild);
            }
            
            // Gestionnaire pour commencer le drag & drop
            dragHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                
                // Stocker l'élément en cours de déplacement
                this.draggedElement = row;
                this.sourceTable = tableId;
                
                // Position initiale de la souris
                this.initialY = e.clientY;
                
                // Offset entre le haut de l'élément et la position de la souris
                const rect = row.getBoundingClientRect();
                this.offsetY = this.initialY - rect.top;
                
                // Créer un élément placeholder pour visualiser l'emplacement cible
                this.placeholder = document.createElement('div');
                this.placeholder.className = 'column-row-placeholder';
                this.placeholder.style.height = `${row.offsetHeight}px`;
                
                // Styles pour l'élément en cours de déplacement
                row.classList.add('dragging');
                
                // Insérer le placeholder
                row.parentNode.insertBefore(this.placeholder, row);
                
                // Positionnement absolu pour l'élément draggé
                const width = row.offsetWidth;
                row.style.width = `${width}px`;
                row.style.position = 'absolute';
                row.style.zIndex = '1000';
                row.style.top = `${rect.top}px`;
                row.style.left = `${rect.left}px`;
            });
        });
    }
    
    /**
     * Gère le déplacement de la souris pendant le drag & drop
     */
    handleMouseMove(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        
        // Mise à jour de la position de l'élément draggé
        this.draggedElement.style.top = `${e.clientY - this.offsetY}px`;
        
        const columnsContainer = this.draggedElement.parentElement;
        const rows = Array.from(columnsContainer.querySelectorAll('.column-row:not(.dragging)'));
        
        // Trouver l'élément sur lequel on survole
        const rowUnder = rows.find(row => {
            const box = row.getBoundingClientRect();
            const middleY = box.y + box.height / 2;
            return e.clientY < middleY;
        });
        
        // Déplacer le placeholder
        if (rowUnder) {
            columnsContainer.insertBefore(this.placeholder, rowUnder);
        } else if (rows.length > 0) {
            // Si on est après tous les éléments, ajouter à la fin
            const lastRow = rows[rows.length - 1];
            columnsContainer.insertBefore(this.placeholder, lastRow.nextSibling);
        }
    }
    
    /**
     * Gère la fin du drag & drop lorsque le bouton de la souris est relâché
     */
    handleMouseUp(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        
        // Réinitialiser les styles
        this.draggedElement.classList.remove('dragging');
        this.draggedElement.style.position = '';
        this.draggedElement.style.zIndex = '';
        this.draggedElement.style.top = '';
        this.draggedElement.style.width = '';
        
        // Insérer l'élément à sa nouvelle position
        if (this.placeholder && this.placeholder.parentElement) {
            this.placeholder.parentNode.insertBefore(this.draggedElement, this.placeholder);
            this.placeholder.parentNode.removeChild(this.placeholder);
        }
        
        // Réinitialiser les variables
        this.draggedElement = null;
        this.sourceTable = null;
        this.placeholder = null;
        this.initialY = 0;
        this.offsetY = 0;
    }
    
    /**
     * Récupère l'ordre actuel des colonnes dans le formulaire
     * @param {NodeList|HTMLCollection} columnRows - Les lignes de colonnes dans leur ordre actuel
     * @returns {Array} - Tableau d'objets représentant les colonnes dans leur nouvel ordre
     */
    getColumnOrder(columnRows) {
        return Array.from(columnRows).map(row => {
            return {
                id: row.dataset.columnId,
                name: row.querySelector('.column-name').value,
                type: row.querySelector('.column-type').value,
                isPrimaryKey: row.querySelector('.primary-key').checked,
                isForeignKey: row.querySelector('.foreign-key').checked,
                referenceTable: row.querySelector('.foreign-key').checked ? row.querySelector('.reference-table').value : null,
                referenceColumn: row.querySelector('.foreign-key').checked ? row.querySelector('.reference-column').value : null
            };
        });
    }
}