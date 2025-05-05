/**
 * Gestion des clés étrangères et des relations entre tables
 */

class ForeignKeyManager {
    constructor(schema, tableRenderer) {
        this.schema = schema;
        this.tableRenderer = tableRenderer;
        this.relationLines = {};
    }

    // Met à jour les options de tables et colonnes dans le formulaire
    updateForeignKeyOptions(formElement) {
        const referenceTables = formElement.querySelectorAll('.reference-table');
        const referenceColumns = formElement.querySelectorAll('.reference-column');
        
        // Mettre à jour les options de tables
        referenceTables.forEach(select => {
            const currentValue = select.value;
            // Vider les options actuelles
            select.innerHTML = '<option value=\"\">--Sélectionner une table--</option>';
            
            // Ajouter toutes les tables disponibles
            Object.values(this.schema.tables).forEach(table => {
                const option = document.createElement('option');
                option.value = table.id;
                option.textContent = table.name;
                select.appendChild(option);
            });
            
            // Restaurer la valeur si elle existe toujours
            if (currentValue && select.querySelector(`option[value=\"${currentValue}\"]`)) {
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
            columnSelect.innerHTML = '<option value=\"\">--Sélectionner une colonne--</option>';
            columnSelect.disabled = true;
            return;
        }
        
        const table = this.schema.getTable(tableId);
        if (!table) return;
        
        // Sauvegarder la valeur actuelle
        const currentValue = columnSelect.value;
        
        // Réinitialiser et activer le sélecteur
        columnSelect.innerHTML = '<option value=\"\">--Sélectionner une colonne--</option>';
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
        if (currentValue && columnSelect.querySelector(`option[value=\"${currentValue}\"]`)) {
            columnSelect.value = currentValue;
        }
    }

    // Crée les éléments visuels pour les relations
    renderRelationships() {
        // D'abord, supprime toutes les lignes existantes
        Object.values(this.relationLines).forEach(line => {
            if (line && line.parentNode) {
                line.parentNode.removeChild(line);
            }
        });
        this.relationLines = {};
        
        // Puis redessine toutes les relations
        Object.values(this.schema.relationships).forEach(rel => {
            this.renderRelationship(rel);
        });
    }

    // Dessine une relation spécifique
    renderRelationship(relationship) {
        const sourceTable = this.schema.getTable(relationship.sourceTable);
        const targetTable = this.schema.getTable(relationship.targetTable);
        const sourceColumn = this.schema.getColumnById(relationship.sourceTable, relationship.sourceColumn);
        const targetColumn = this.schema.getColumnById(relationship.targetTable, relationship.targetColumn);
        
        if (!sourceTable || !targetTable || !sourceColumn || !targetColumn) return;
        
        const sourceElement = document.querySelector(`#${relationship.sourceTable} .column-item[data-column-id=\"${relationship.sourceColumn}\"]`);
        const targetElement = document.querySelector(`#${relationship.targetTable} .column-item[data-column-id=\"${relationship.targetColumn}\"]`);
        
        if (!sourceElement || !targetElement) return;
        
        // Calcul des positions pour la flèche
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        
        const sourceTableElement = document.getElementById(relationship.sourceTable);
        const targetTableElement = document.getElementById(relationship.targetTable);
        const sourceTableRect = sourceTableElement.getBoundingClientRect();
        const targetTableRect = targetTableElement.getBoundingClientRect();
        
        // Points de départ et d'arrivée pour la flèche
        const isSourceRightOfTarget = sourceTableRect.left > targetTableRect.right;
        const isSourceLeftOfTarget = sourceTableRect.right < targetTableRect.left;
        const isSourceBelowTarget = sourceTableRect.top > targetTableRect.bottom;
        const isSourceAboveTarget = sourceTableRect.bottom < targetTableRect.top;
        
        let startX, startY, endX, endY;
        
        // Déterminer les points de départ et d'arrivée en fonction de la position relative des tables
        if (isSourceRightOfTarget) {
            startX = sourceTableRect.left - canvasRect.left;
            endX = targetTableRect.right - canvasRect.left;
        } else if (isSourceLeftOfTarget) {
            startX = sourceTableRect.right - canvasRect.left;
            endX = targetTableRect.left - canvasRect.left;
        } else {
            // Si les tables se chevauchent horizontalement
            startX = (sourceTableRect.left + sourceTableRect.right) / 2 - canvasRect.left;
            endX = (targetTableRect.left + targetTableRect.right) / 2 - canvasRect.left;
        }
        
        if (isSourceBelowTarget) {
            startY = sourceTableRect.top - canvasRect.top;
            endY = targetTableRect.bottom - canvasRect.top;
        } else if (isSourceAboveTarget) {
            startY = sourceTableRect.bottom - canvasRect.top;
            endY = targetTableRect.top - canvasRect.top;
        } else {
            // Si les tables se chevauchent verticalement
            startY = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
            endY = targetRect.top + targetRect.height / 2 - canvasRect.top;
        }
        
        // Créer une ligne SVG pour la relation
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', 'black');
        line.setAttribute('stroke-width', '2');
        line.set('Attributemarker-end', 'url(#arrow)');

        // Ajouter la ligne SVG à la page
        const svg = document.getElementById('canvas');
        svg.appendChild(line);
        
        // Ajouter un écouteur d'événements pour la relation
        line.addEventListener('mouseover', function() {
            line.setAttribute('stroke', 'red');
        });
        
        line.addEventListener('mouseout', function() {
            line.setAttribute('stroke', 'black');
        });
        
        line.addEventListener('click', function() {
            // Gérer l'événement de clic sur la ligne
            // Par exemple, vous pouvez afficher un message ou effectuer une actionspécifique
            console.log('Relation cliquée');
        });
    }
}