/**
 * Gère le rendu des tables dans le canvas
 */
class TableRenderer {
    constructor(schema, canvas) {
        this.schema = schema;
        this.canvas = canvas;
        this.draggedTable = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.svgElement = null;
        
        // Initialiser le SVG pour les relations
        this.initSVG();
    }
    
    // Initialiser l'élément SVG pour dessiner les relations
    initSVG() {
        // Supprimer l'ancien SVG s'il existe
        const oldSvg = this.canvas.querySelector('svg');
        if (oldSvg) {
            oldSvg.remove();
        }
        
        // Créer un nouvel élément SVG
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        // Ajouter le marker pour les flèches
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrow');
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '5');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto-start-reverse');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        path.setAttribute('fill', 'black');
        
        marker.appendChild(path);
        defs.appendChild(marker);
        this.svgElement.appendChild(defs);
        
        // Ajouter le SVG au canvas
        this.canvas.appendChild(this.svgElement);
    }

    // Rendre toutes les tables
    renderTables() {
        // Réinitialiser l'élément SVG
        this.initSVG();
        
        // Supprimer toutes les tables existantes du DOM
        const existingTables = this.canvas.querySelectorAll('.table');
        existingTables.forEach(table => table.remove());
        
        // Rendre chaque table
        Object.values(this.schema.tables).forEach(table => {
            this.renderTable(table);
        });
    }

    // Rendre une table spécifique
    renderTable(table) {
        // Créer l'élément de table
        const tableElement = document.createElement('div');
        tableElement.className = 'table';
        tableElement.id = table.id;
        tableElement.style.left = `${table.x}px`;
        tableElement.style.top = `${table.y}px`;
        
        // Créer l'en-tête de la table
        const header = document.createElement('div');
        header.className = 'table-header';
        
        const title = document.createElement('div');
        title.className = 'table-title';
        title.textContent = table.name;
        
        const actions = document.createElement('div');
        actions.className = 'table-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'table-action-btn edit-table-btn';
        editBtn.textContent = '✏️';
        editBtn.title = 'Modifier la table';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'table-action-btn delete-table-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Supprimer la table';
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        header.appendChild(title);
        header.appendChild(actions);
        
        // Créer le contenu de la table
        const content = document.createElement('div');
        content.className = 'table-content';
        
        const columnList = document.createElement('ul');
        columnList.className = 'column-list';
        
        // Ajouter chaque colonne à la liste
        table.columns.forEach(column => {
            const columnItem = document.createElement('li');
            columnItem.className = `column-item ${column.isPrimaryKey ? 'primary-key' : ''} ${column.isForeignKey ? 'foreign-key' : ''}`;
            columnItem.setAttribute('data-column-id', column.id);
            
            const columnInfo = document.createElement('div');
            columnInfo.className = 'column-info';
            
            const columnName = document.createElement('span');
            columnName.className = 'column-name';
            columnName.textContent = column.name;
            
            const columnType = document.createElement('span');
            columnType.className = 'column-type';
            columnType.textContent = column.type;
            
            columnInfo.appendChild(columnName);
            columnInfo.appendChild(document.createTextNode(' '));
            columnInfo.appendChild(columnType);
            
            const badges = document.createElement('div');
            badges.className = 'column-badges';
            
            if (column.isPrimaryKey) {
                const pkBadge = document.createElement('span');
                pkBadge.className = 'badge pk';
                pkBadge.textContent = 'PK';
                badges.appendChild(pkBadge);
            }
            
            if (column.isForeignKey) {
                const fkBadge = document.createElement('span');
                fkBadge.className = 'badge fk';
                fkBadge.textContent = 'FK';
                badges.appendChild(fkBadge);
            }
            
            columnItem.appendChild(columnInfo);
            columnItem.appendChild(badges);
            columnList.appendChild(columnItem);
        });
        
        content.appendChild(columnList);
        
        // Assembler la table
        tableElement.appendChild(header);
        tableElement.appendChild(content);
        
        // Ajouter la table au canvas
        this.canvas.appendChild(tableElement);
        
        // Ajouter les écouteurs d'événements pour le déplacement
        this.setupDraggable(tableElement, header);
        
        // Configurer les boutons d'action
        this.setupTableActions(tableElement, table.id);
    }

    // Configurer le comportement de déplacement des tables
    setupDraggable(tableElement, handle) {
        handle.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('table-action-btn')) {
                return; // Ne pas démarrer le glisser-déposer si on clique sur un bouton d'action
            }
            
            this.draggedTable = tableElement;
            
            // Calculer l'offset pour que le déplacement soit relatif au point de clic
            const rect = tableElement.getBoundingClientRect();
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;
            
            // Ajouter une classe pour indiquer que la table est en cours de déplacement
            tableElement.classList.add('dragging');
            
            // Empêcher la sélection de texte pendant le déplacement
            e.preventDefault();
        });
        
        // Gérer le mouvement de la souris
        document.addEventListener('mousemove', (e) => {
            if (!this.draggedTable) return;
            
            // Calculer la nouvelle position
            const canvasRect = this.canvas.getBoundingClientRect();
            let newX = e.clientX - canvasRect.left - this.offsetX;
            let newY = e.clientY - canvasRect.top - this.offsetY;
            
            // Limiter la position à l'intérieur du canvas
            newX = Math.max(0, Math.min(newX, canvasRect.width - this.draggedTable.offsetWidth));
            newY = Math.max(0, Math.min(newY, canvasRect.height - this.draggedTable.offsetHeight));
            
            // Mettre à jour la position
            this.draggedTable.style.left = `${newX}px`;
            this.draggedTable.style.top = `${newY}px`;
            
            // Mettre à jour la position dans le modèle
            const tableId = this.draggedTable.id;
            const table = this.schema.getTable(tableId);
            if (table) {
                table.x = newX;
                table.y = newY;
                
                // Mettre à jour les relations
                if (window.foreignKeyManager) {
                    window.foreignKeyManager.renderRelationships();
                }
            }
        });
        
        // Terminer le déplacement
        document.addEventListener('mouseup', () => {
            if (!this.draggedTable) return;
            
            this.draggedTable.classList.remove('dragging');
            this.draggedTable = null;
        });
    }

    // Configurer les boutons d'action pour une table
    setupTableActions(tableElement, tableId) {
        const editBtn = tableElement.querySelector('.edit-table-btn');
        const deleteBtn = tableElement.querySelector('.delete-table-btn');
        
        // Bouton de modification
        editBtn.addEventListener('click', () => {
            // Déclencher l'événement d'édition de table
            const event = new CustomEvent('edit-table', {
                detail: { tableId }
            });
            document.dispatchEvent(event);
        });
        
        // Bouton de suppression
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Êtes-vous sûr de vouloir supprimer cette table? Cette action ne peut pas être annulée.`)) {
                // Supprimer la table du schéma
                this.schema.removeTable(tableId);
                
                // Supprimer l'élément du DOM
                tableElement.remove();
                
                // Mettre à jour les relations
                if (window.foreignKeyManager) {
                    window.foreignKeyManager.renderRelationships();
                }
            }
        });
    }
}