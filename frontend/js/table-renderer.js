/**
 * Gère le rendu des tables dans le canvas avec style UML/MCD
 */
class TableRenderer {
    constructor(schema, canvas) {
        this.schema = schema;
        this.canvas = canvas;
        this.draggedTable = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.svgElement = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialMouseX = 0;
        this.initialMouseY = 0;
        this.isDragging = false;
        this.zoomLevel = 1;  // Niveau de zoom initial (100%)
        
        // Nouvelles propriétés pour le déplacement du canvas
        this.canvasOffsetX = 0; // Décalage horizontal du canvas
        this.canvasOffsetY = 0; // Décalage vertical du canvas
        this.isPanning = false; // État du déplacement
        this.lastPanPointX = 0; // Dernière position X pour le déplacement
        this.lastPanPointY = 0; // Dernière position Y pour le déplacement
        
        // Initialiser le SVG pour les relations
        this.initSVG();
        
        // Ajouter un gestionnaire d'événements pour le zoom
        this.setupZoom();
        
        // Ajouter un gestionnaire d'événements pour le déplacement du canvas
        this.setupPanning();
    }
    
    // Initialiser l'élément SVG pour dessiner les relations
    initSVG() {
        // Supprimer l'ancien SVG s'il existe
        const oldSvg = this.canvas.querySelector('svg');
        if (oldSvg) {
            oldSvg.remove();
        }
        
        // Créer un nouvel élément SVG qui couvre tout le canvas
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.style.position = 'absolute';
        this.svgElement.style.top = '0';
        this.svgElement.style.left = '0';
        this.svgElement.style.width = '100%';
        this.svgElement.style.height = '100%';
        this.svgElement.style.pointerEvents = 'none';
        this.svgElement.style.zIndex = '0';
        
        // Ajouter les définitions pour les marqueurs
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Marqueur pour les flèches de relation
        const arrowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        arrowMarker.setAttribute('id', 'arrow');
        arrowMarker.setAttribute('viewBox', '0 0 10 10');
        arrowMarker.setAttribute('refX', '8');
        arrowMarker.setAttribute('refY', '5');
        arrowMarker.setAttribute('markerWidth', `${8 / this.zoomLevel}`);
        arrowMarker.setAttribute('markerHeight', `${8 / this.zoomLevel}`);
        arrowMarker.setAttribute('orient', 'auto-start-reverse');
        
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        arrowPath.setAttribute('fill', '#3498db');
        
        arrowMarker.appendChild(arrowPath);
        
        // Marqueur de type "losange" pour les relations N-N
        const diamondMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        diamondMarker.setAttribute('id', 'diamond');
        diamondMarker.setAttribute('viewBox', '0 0 10 10');
        diamondMarker.setAttribute('refX', '5');
        diamondMarker.setAttribute('refY', '5');
        diamondMarker.setAttribute('markerWidth', `${10 / this.zoomLevel}`);
        diamondMarker.setAttribute('markerHeight', `${10 / this.zoomLevel}`);
        diamondMarker.setAttribute('orient', 'auto');
        
        const diamondPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        diamondPath.setAttribute('d', 'M 0 5 L 5 0 L 10 5 L 5 10 z');
        diamondPath.setAttribute('fill', 'white');
        diamondPath.setAttribute('stroke', '#3498db');
        diamondPath.setAttribute('stroke-width', '1');
        
        diamondMarker.appendChild(diamondPath);
        
        // Ajouter les marqueurs aux définitions
        defs.appendChild(arrowMarker);
        defs.appendChild(diamondMarker);
        this.svgElement.appendChild(defs);
        
        // Ajouter le SVG au canvas
        this.canvas.appendChild(this.svgElement);
    }

    // Configuration du zoom sur le canvas
    setupZoom() {
        // Éléments de l'interface utilisateur pour le zoom
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomResetBtn = document.getElementById('zoom-reset-btn');
        const zoomLevelDisplay = document.getElementById('zoom-level');

        // Fonction pour mettre à jour l'affichage du niveau de zoom
        const updateZoomDisplay = () => {
            zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        };

        // Fonction pour appliquer le zoom aux tables
        const applyZoom = (delta, centerX, centerY) => {
            // Nouvelle valeur de zoom
            const newZoom = Math.max(0.2, Math.min(3, this.zoomLevel * delta));
            const zoomFactor = newZoom / this.zoomLevel;
            
            // Mettre à jour le niveau de zoom
            this.zoomLevel = newZoom;
            
            // Mise à jour de l'affichage
            updateZoomDisplay();
            
            // Appliquer le zoom à toutes les tables
            const tables = this.canvas.querySelectorAll('.table');
            tables.forEach(table => {
                // Obtenir la position actuelle
                const rect = table.getBoundingClientRect();
                const canvasRect = this.canvas.getBoundingClientRect();
                
                // Si pas de centre spécifié, utiliser le centre du canvas
                const zoomCenterX = centerX !== undefined ? centerX : canvasRect.width / 2;
                const zoomCenterY = centerY !== undefined ? centerY : canvasRect.height / 2;
                
                // Position relative au centre du zoom
                const relX = rect.left - canvasRect.left - zoomCenterX;
                const relY = rect.top - canvasRect.top - zoomCenterY;
                
                // Appliquer le zoom
                const newX = zoomCenterX + relX * zoomFactor;
                const newY = zoomCenterY + relY * zoomFactor;
                
                // Mettre à jour la position
                table.style.left = `${newX}px`;
                table.style.top = `${newY}px`;
                
                // Mettre à jour la taille
                const currScale = parseFloat(table.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
                const newScale = currScale * zoomFactor;
                table.style.transform = `scale(${newScale})`;
                
                // Ajuster l'échelle des boutons pour qu'ils restent de taille constante
                const buttonScale = 1 / newScale;
                const actionButtons = table.querySelectorAll('.table-action-btn');
                actionButtons.forEach(btn => {
                    btn.style.setProperty('--button-scale', buttonScale);
                });
                
                // Mettre à jour la position et l'échelle dans le modèle
                const tableId = table.id;
                const tableObj = this.schema.getTable(tableId);
                if (tableObj) {
                    tableObj.x = newX;
                    tableObj.y = newY;
                    tableObj.scale = newScale;
                }
            });
            
            // Mettre à jour les relations
            if (window.foreignKeyManager) {
                window.foreignKeyManager.renderRelationships();
            }
        };

        // Gestionnaire pour le zoom avec la molette de la souris
        this.canvas.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                // Empêcher le zoom par défaut du navigateur
                e.preventDefault();
                
                // Facteur de zoom: positif pour zoom arrière, négatif pour zoom avant
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                
                // Position de la souris comme centre du zoom
                const canvasRect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - canvasRect.left;
                const mouseY = e.clientY - canvasRect.top;
                
                // Appliquer le zoom
                applyZoom(delta, mouseX, mouseY);
            }
        }, { passive: false });

        // Gestionnaire pour le bouton zoom avant
        zoomInBtn.addEventListener('click', () => {
            applyZoom(1.2); // +20% de zoom
        });

        // Gestionnaire pour le bouton zoom arrière
        zoomOutBtn.addEventListener('click', () => {
            applyZoom(0.8); // -20% de zoom
        });

        // Gestionnaire pour le bouton réinitialiser le zoom
        zoomResetBtn.addEventListener('click', () => {
            // Calculer le facteur de zoom pour retourner à 100%
            const resetFactor = 1 / this.zoomLevel;
            applyZoom(resetFactor);
        });

        // Initialisation de l'affichage
        updateZoomDisplay();
    }

    // Configuration du déplacement (pan) dans le canvas
    setupPanning() {
        // Gestionnaire pour le début du déplacement (clic droit ou clic de la molette)
        this.canvas.addEventListener('mousedown', (e) => {
            // Activer le déplacement avec le bouton droit (2) ou le clic de la molette (1)
            if (e.button === 2 || e.button === 1) {
                e.preventDefault();
                
                // Marquer le début du déplacement
                this.isPanning = true;
                this.lastPanPointX = e.clientX;
                this.lastPanPointY = e.clientY;
                
                // Changer le curseur pour indiquer le mode déplacement
                this.canvas.style.cursor = 'grabbing';
            }
        });
        
        // Gestionnaire pour le déplacement du canvas
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                // Calculer le delta de déplacement
                const deltaX = e.clientX - this.lastPanPointX;
                const deltaY = e.clientY - this.lastPanPointY;
                
                // Mettre à jour les points de référence
                this.lastPanPointX = e.clientX;
                this.lastPanPointY = e.clientY;
                
                // Mettre à jour le décalage global du canvas
                this.canvasOffsetX += deltaX;
                this.canvasOffsetY += deltaY;
                
                // Déplacer toutes les tables
                const tables = this.canvas.querySelectorAll('.table');
                tables.forEach(table => {
                    const currentX = parseInt(table.style.left) || 0;
                    const currentY = parseInt(table.style.top) || 0;
                    
                    table.style.left = `${currentX + deltaX}px`;
                    table.style.top = `${currentY + deltaY}px`;
                    
                    // Mettre à jour la position dans le modèle
                    const tableId = table.id;
                    const tableObj = this.schema.getTable(tableId);
                    if (tableObj) {
                        tableObj.x = currentX + deltaX;
                        tableObj.y = currentY + deltaY;
                    }
                });
                
                // Mettre à jour les relations
                if (window.foreignKeyManager) {
                    window.foreignKeyManager.renderRelationships();
                }
            }
        });
        
        // Gestionnaire pour la fin du déplacement
        document.addEventListener('mouseup', (e) => {
            if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            }
        });
        
        // Désactiver le menu contextuel pour permettre le déplacement avec le clic droit
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Gestionnaire pour quitter la zone du canvas
        this.canvas.addEventListener('mouseleave', () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            }
        });
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
        
        // Appliquer l'échelle si définie
        if (table.scale) {
            tableElement.style.transform = `scale(${table.scale})`;
            // Calculer l'échelle inverse pour les boutons d'action
            const buttonScale = 1 / table.scale;
            tableElement.style.setProperty('--button-scale', buttonScale);
        }
        
        // Créer l'en-tête de la table avec les boutons d'action
        const header = document.createElement('div');
        header.className = 'table-header';
        
        const title = document.createElement('div');
        title.className = 'table-title';
        title.textContent = table.name;
        
        const actions = document.createElement('div');
        actions.className = 'table-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'table-action-btn edit-table-btn';
        editBtn.title = 'Modifier la table';
        editBtn.textContent = '✏️';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'table-action-btn delete-table-btn';
        deleteBtn.title = 'Supprimer la table';
        deleteBtn.textContent = '🗑️';
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        header.appendChild(title);
        header.appendChild(actions);
        
        // Créer le contenu de la table
        const content = document.createElement('div');
        content.className = 'table-content';
        
        // Colonnes séparées par type
        const primaryColumns = table.columns.filter(col => col.isPrimaryKey);
        const foreignColumns = table.columns.filter(col => col.isForeignKey && !col.isPrimaryKey);
        const regularColumns = table.columns.filter(col => !col.isPrimaryKey && !col.isForeignKey);
        
        const columnList = document.createElement('ul');
        columnList.className = 'column-list';
        
        this.addColumnsToList(primaryColumns, columnList, 'primary-keys');
        this.addColumnsToList(regularColumns, columnList, 'regular-attributes');
        this.addColumnsToList(foreignColumns, columnList, 'foreign-keys');
        
        content.appendChild(columnList);
        
        // Assembler et ajouter la table
        tableElement.appendChild(header);
        tableElement.appendChild(content);
        this.canvas.appendChild(tableElement);
        
        // Configuration des interactions
        this.setupDraggable(tableElement, header);
        this.setupTableActions(tableElement, table.id);
    }
    
    // Ajouter une liste de colonnes à la table
    addColumnsToList(columns, list, className) {
        if (columns.length === 0) return;
        
        // Séparateur entre sections si nécessaire
        if (list.children.length > 0) {
            const separator = document.createElement('li');
            separator.className = 'column-separator';
            list.appendChild(separator);
        }
        
        // Ajouter chaque colonne
        columns.forEach(column => {
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
            list.appendChild(columnItem);
        });
    }

    // Configurer le comportement de glisser-déposer pour les tables
    setupDraggable(tableElement, handle) {
        handle.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('table-action-btn') || e.target.closest('.table-action-btn')) {
                return; // Ne pas démarrer le glisser-déposer si on clique sur un bouton d'action
            }
            
            this.draggedTable = tableElement;
            this.isDragging = true;
            
            // Position initiale de la souris
            this.initialMouseX = e.clientX;
            this.initialMouseY = e.clientY;
            
            // Position initiale de la table
            const rect = tableElement.getBoundingClientRect();
            this.dragStartX = rect.left;
            this.dragStartY = rect.top;
            
            // Calculer l'offset pour que le déplacement soit relatif au point de clic
            const canvasRect = this.canvas.getBoundingClientRect();
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;
            
            // Ajouter une classe pour indiquer que la table est en cours de déplacement
            tableElement.classList.add('dragging');
            
            // Ajouter une transition douce uniquement pendant le glissement
            tableElement.style.transition = 'none';
            
            // Empêcher la sélection de texte pendant le déplacement
            e.preventDefault();
        });
        
        // Gérer le mouvement de la souris pour le glisser-déposer
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Terminer le déplacement
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    // Gestion du mouvement de la souris pour le glisser-déposer
    handleMouseMove(e) {
        if (!this.isDragging || !this.draggedTable) return;
        
        // Calculer la nouvelle position
        const canvasRect = this.canvas.getBoundingClientRect();
        let newX = e.clientX - canvasRect.left - this.offsetX;
        let newY = e.clientY - canvasRect.top - this.offsetY;
        
        // Limiter la position à l'intérieur du canvas
        newX = Math.max(0, Math.min(newX, canvasRect.width - this.draggedTable.offsetWidth / 2));
        newY = Math.max(0, Math.min(newY, canvasRect.height - this.draggedTable.offsetHeight / 2));
        
        // Mise à jour de la position avec effet de glissement fluide
        this.draggedTable.style.left = `${newX}px`;
        this.draggedTable.style.top = `${newY}px`;
        
        // Mettre à jour la position dans le modèle
        const tableId = this.draggedTable.id;
        const table = this.schema.getTable(tableId);
        if (table) {
            table.x = newX;
            table.y = newY;
            
            // Mettre à jour les relations en temps réel pour un effet visuel agréable
            if (window.foreignKeyManager) {
                window.foreignKeyManager.renderRelationships();
            }
        }
    }
    
    // Gestion de la fin du déplacement
    handleMouseUp(e) {
        if (!this.isDragging || !this.draggedTable) return;
        
        // Réactiver la transition pour une fin de déplacement fluide
        this.draggedTable.style.transition = 'transform 0.1s ease';
        this.draggedTable.classList.remove('dragging');
        
        // Animation de fin de déplacement
        if (Math.abs(e.clientX - this.initialMouseX) > 5 || Math.abs(e.clientY - this.initialMouseY) > 5) {
            // Si le déplacement est significatif, ajouter une petite animation
            this.draggedTable.style.transform += ' scale(1.02)';
            setTimeout(() => {
                if (this.draggedTable) {
                    const scale = this.schema.getTable(this.draggedTable.id)?.scale || 1;
                    this.draggedTable.style.transform = `scale(${scale})`;
                }
            }, 100);
        }
        
        // Réinitialiser l'état
        this.isDragging = false;
        this.draggedTable = null;
        
        // Mettre à jour les relations une dernière fois
        if (window.foreignKeyManager) {
            window.foreignKeyManager.renderRelationships();
        }
    }

    // Configurer les boutons d'action pour une table
    setupTableActions(tableElement, tableId) {
        const editBtn = tableElement.querySelector('.edit-table-btn');
        const deleteBtn = tableElement.querySelector('.delete-table-btn');
        
        // Bouton de modification
        editBtn.addEventListener('click', () => {
            // Récupérer la référence à la table
            const table = this.schema.getTable(tableId);
            
            // Déclencher l'ouverture du modal d'édition de table
            if (window.app) {
                window.app.openTableModal(table);
            }
        });
        
        // Bouton de suppression
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Êtes-vous sûr de vouloir supprimer cette table? Cette action ne peut pas être annulée.`)) {
                // Supprimer la table du schéma
                this.schema.removeTable(tableId);
                
                // Supprimer l'élément du DOM avec animation
                tableElement.style.transform = 'scale(0.8)';
                tableElement.style.opacity = '0';
                
                setTimeout(() => {
                    if (tableElement.parentNode) {
                        tableElement.parentNode.removeChild(tableElement);
                    }
                    
                    // Mettre à jour les relations
                    if (window.foreignKeyManager) {
                        window.foreignKeyManager.renderRelationships();
                    }
                }, 300);
            }
        });
    }
}