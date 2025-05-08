/**
 * Gestion des clés étrangères et des relations entre tables
 * Version améliorée pour un rendu UML/MCD
 */

class ForeignKeyManager {
    constructor(schema, app) {
        this.schema = schema;
        this.app = app;
        this.relationElements = {};
        this.selectedRelation = null;
    }

    // Met à jour les options de tables et colonnes dans le formulaire
    updateForeignKeyOptions(formElement) {
        const referenceTables = formElement.querySelectorAll('.reference-table');
        const referenceColumns = formElement.querySelectorAll('.reference-column');
        
        // Mettre à jour les options de tables
        referenceTables.forEach(select => {
            const currentValue = select.value;
            // Vider les options actuelles
            select.innerHTML = '<option value="">--Sélectionner une table--</option>';
            
            // Ajouter toutes les tables disponibles
            Object.values(this.schema.tables).forEach(table => {
                const option = document.createElement('option');
                option.value = table.id;
                option.textContent = table.name;
                select.appendChild(option);
            });
            
            // Restaurer la valeur si elle existe toujours
            if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
                select.value = currentValue;
                
                // Déclencher la mise à jour des colonnes
                const event = new Event('change');
                select.dispatchEvent(event);
            }
        });
        
        // Configuration des événements pour les sélections de tables
        referenceTables.forEach((select, index) => {
            select.addEventListener('change', () => {
                this.updateReferenceColumns(select, referenceColumns[index]);
            });
        });
    }

    // Met à jour les options de colonnes en fonction de la table sélectionnée
    updateReferenceColumns(tableSelect, columnSelect) {
        const tableId = tableSelect.value;
        if (!tableId) {
            columnSelect.innerHTML = '<option value="">--Sélectionner une colonne--</option>';
            columnSelect.disabled = true;
            return;
        }
        
        const table = this.schema.getTable(tableId);
        if (!table) return;
        
        // Sauvegarder la valeur actuelle
        const currentValue = columnSelect.value;
        
        // Réinitialiser et activer le sélecteur
        columnSelect.innerHTML = '<option value="">--Sélectionner une colonne--</option>';
        columnSelect.disabled = false;
        
        // Ajouter uniquement les clés primaires comme options
        table.columns
            .filter(col => col.isPrimaryKey)
            .forEach(column => {
                const option = document.createElement('option');
                option.value = column.id;
                option.textContent = column.name;
                columnSelect.appendChild(option);
            });
        
        // Restaurer la valeur si elle existe toujours
        if (currentValue && columnSelect.querySelector(`option[value="${currentValue}"]`)) {
            columnSelect.value = currentValue;
        }
    }

    // Crée les éléments visuels pour les relations
    renderRelationships() {
        const svgElement = this.app.tableRenderer.svgElement;
        if (!svgElement) return;
        
        // Supprimer tous les éléments de relation existants
        const existingRelations = svgElement.querySelectorAll('.relation-group');
        existingRelations.forEach(el => el.remove());
        
        this.relationElements = {};
        
        // Redessiner toutes les relations
        Object.values(this.schema.relationships).forEach(rel => {
            this.renderRelationship(rel);
        });
    }

    // Dessine une relation spécifique avec style UML
    renderRelationship(relationship) {
        const sourceTable = this.schema.getTable(relationship.sourceTable);
        const targetTable = this.schema.getTable(relationship.targetTable);
        
        if (!sourceTable || !targetTable) return;
        
        const sourceElement = document.getElementById(relationship.sourceTable);
        const targetElement = document.getElementById(relationship.targetTable);
        
        if (!sourceElement || !targetElement) return;
        
        // Créer un groupe pour la relation
        const relationGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        relationGroup.classList.add('relation-group');
        relationGroup.setAttribute('data-relation-id', relationship.id);
        
        // Calculer les points de connexion
        const connectionPoints = this.calculateConnectionPoints(sourceElement, targetElement);
        
        // Créer la ligne avec un style UML
        const path = this.createRelationPath(connectionPoints);
        path.classList.add('relation-line');
        path.classList.add('one-to-many'); // Par défaut pour les clés étrangères
        path.setAttribute('stroke', '#3498db');
        
        // Ajouter les points d'ancrage
        const sourceAnchor = this.createAnchorPoint(connectionPoints.start.x, connectionPoints.start.y);
        const targetAnchor = this.createAnchorPoint(connectionPoints.end.x, connectionPoints.end.y);
        
        // Ajouter les cardinalités
        const sourceCardinality = this.createCardinalityText("1", connectionPoints.start.x, connectionPoints.start.y, connectionPoints.direction);
        const targetCardinality = this.createCardinalityText("N", connectionPoints.end.x, connectionPoints.end.y, this.inverseDirection(connectionPoints.direction));
        
        // Ajouter tous les éléments au groupe
        relationGroup.appendChild(path);
        relationGroup.appendChild(sourceAnchor);
        relationGroup.appendChild(targetAnchor);
        relationGroup.appendChild(sourceCardinality);
        relationGroup.appendChild(targetCardinality);
        
        // Ajouter le groupe au SVG
        this.app.tableRenderer.svgElement.appendChild(relationGroup);
        
        // Stocker la référence
        this.relationElements[relationship.id] = relationGroup;
        
        // Configuration des événements
        this.setupRelationEvents(relationGroup, relationship);
    }

    // Calcule les meilleurs points de connexion entre deux tables
    calculateConnectionPoints(sourceElement, targetElement) {
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        
        // Récupérer le niveau de zoom actuel
        const zoomLevel = this.app.tableRenderer.zoomLevel;
        
        // Points centraux des tables
        const sourceCenter = {
            x: sourceRect.left + sourceRect.width / 2 - canvasRect.left,
            y: sourceRect.top + sourceRect.height / 2 - canvasRect.top
        };
        
        const targetCenter = {
            x: targetRect.left + targetRect.width / 2 - canvasRect.left,
            y: targetRect.top + targetRect.height / 2 - canvasRect.top
        };
        
        // Déterminer la direction principale de la connexion
        let direction;
        
        // Calculer l'angle entre les deux points centraux
        const angle = Math.atan2(targetCenter.y - sourceCenter.y, targetCenter.x - sourceCenter.x) * 180 / Math.PI;
        
        // Déterminer la direction en fonction de l'angle
        if (angle > -45 && angle <= 45) direction = 'right';
        else if (angle > 45 && angle <= 135) direction = 'bottom';
        else if (angle > 135 || angle <= -135) direction = 'left';
        else direction = 'top';
        
        let start, end;
        
        // Obtenir les dimensions des tables en tenant compte des transformations CSS
        const sourceScale = parseFloat(sourceElement.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
        const targetScale = parseFloat(targetElement.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
        
        // Déterminer les points de départ et d'arrivée en fonction de la direction
        switch(direction) {
            case 'right':
                start = {
                    x: sourceRect.right - canvasRect.left,
                    y: sourceCenter.y
                };
                end = {
                    x: targetRect.left - canvasRect.left,
                    y: targetCenter.y
                };
                break;
            case 'left':
                start = {
                    x: sourceRect.left - canvasRect.left,
                    y: sourceCenter.y
                };
                end = {
                    x: targetRect.right - canvasRect.left,
                    y: targetCenter.y
                };
                break;
            case 'bottom':
                start = {
                    x: sourceCenter.x,
                    y: sourceRect.bottom - canvasRect.top
                };
                end = {
                    x: targetCenter.x,
                    y: targetRect.top - canvasRect.top
                };
                break;
            case 'top':
                start = {
                    x: sourceCenter.x,
                    y: sourceRect.top - canvasRect.top
                };
                end = {
                    x: targetCenter.x,
                    y: targetRect.bottom - canvasRect.top
                };
                break;
        }
        
        return { start, end, direction };
    }
    
    // Crée un chemin SVG pour la relation
    createRelationPath(points) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Récupérer le niveau de zoom actuel pour ajuster la visibilité des relations
        const zoomLevel = this.app.tableRenderer.zoomLevel;
        
        // Créer une ligne droite entre les points
        const d = `M ${points.start.x} ${points.start.y} L ${points.end.x} ${points.end.y}`;
        
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        
        // Ajuster l'épaisseur de la ligne en fonction du zoom
        const strokeWidth = Math.max(1, 2 / zoomLevel);
        path.setAttribute('stroke-width', strokeWidth);
        
        // Ajuster les marqueurs de fin en fonction du zoom
        path.setAttribute('marker-end', 'url(#arrow)');
        
        return path;
    }
    
    // Crée un point d'ancrage pour la relation
    createAnchorPoint(x, y) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.classList.add('anchor-point');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        
        return circle;
    }
    
    // Crée un texte de cardinalité
    createCardinalityText(text, x, y, direction) {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.classList.add('cardinality');
        textElement.textContent = text;
        
        // Positionner le texte en fonction de la direction
        let offsetX = 0;
        let offsetY = 0;
        
        switch(direction) {
            case 'right':
                offsetX = 10;
                break;
            case 'left':
                offsetX = -10;
                textElement.setAttribute('text-anchor', 'end');
                break;
            case 'bottom':
                offsetY = 15;
                textElement.setAttribute('text-anchor', 'middle');
                break;
            case 'top':
                offsetY = -10;
                textElement.setAttribute('text-anchor', 'middle');
                break;
        }
        
        textElement.setAttribute('x', x + offsetX);
        textElement.setAttribute('y', y + offsetY);
        
        return textElement;
    }
    
    // Renvoie la direction opposée
    inverseDirection(direction) {
        switch(direction) {
            case 'right': return 'left';
            case 'left': return 'right';
            case 'top': return 'bottom';
            case 'bottom': return 'top';
            default: return direction;
        }
    }
    
    // Configure les événements pour les relations
    setupRelationEvents(relationGroup, relationship) {
        const path = relationGroup.querySelector('path');
        
        // Survol
        relationGroup.addEventListener('mouseover', () => {
            path.setAttribute('stroke-width', '3');
            path.setAttribute('stroke', '#e74c3c');
        });
        
        relationGroup.addEventListener('mouseout', () => {
            if (this.selectedRelation !== relationship.id) {
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke', '#3498db');
            }
        });
        
        // Sélection
        relationGroup.addEventListener('click', () => {
            // Désélectionner la relation précédente
            if (this.selectedRelation && this.relationElements[this.selectedRelation]) {
                const prevPath = this.relationElements[this.selectedRelation].querySelector('path');
                prevPath.setAttribute('stroke-width', '2');
                prevPath.setAttribute('stroke', '#3498db');
            }
            
            // Sélectionner la nouvelle relation
            this.selectedRelation = relationship.id;
            path.setAttribute('stroke-width', '3');
            path.setAttribute('stroke', '#e74c3c');
        });
    }
}