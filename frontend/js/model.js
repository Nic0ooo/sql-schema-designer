/**
 * Classes modèles pour la structure des données
 */

class Column {
    constructor(id, name, type, isPrimaryKey = false, isForeignKey = false, referenceTable = null, referenceColumn = null) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.isPrimaryKey = isPrimaryKey;
        this.isForeignKey = isForeignKey;
        this.referenceTable = referenceTable;
        this.referenceColumn = referenceColumn;
    }
}

class Table {
    constructor(id, name, x = 50, y = 50) {
        this.id = id;
        this.name = name;
        this.columns = [];
        this.x = x;
        this.y = y;
    }

    addColumn(column) {
        this.columns.push(column);
    }

    removeColumn(columnId) {
        const index = this.columns.findIndex(col => col.id === columnId);
        if (index !== -1) {
            this.columns.splice(index, 1);
        }
    }

    getPrimaryKeys() {
        return this.columns.filter(col => col.isPrimaryKey);
    }

    getForeignKeys() {
        return this.columns.filter(col => col.isForeignKey);
    }
    
    // Méthode pour réorganiser une colonne à une nouvelle position
    moveColumn(columnId, newIndex) {
        // Trouver l'index actuel de la colonne
        const currentIndex = this.columns.findIndex(col => col.id === columnId);
        if (currentIndex === -1) return false;
        
        // Vérifier que le nouvel index est valide
        if (newIndex < 0 || newIndex >= this.columns.length) return false;
        
        // Extraire la colonne
        const column = this.columns[currentIndex];
        
        // Supprimer la colonne de sa position actuelle
        this.columns.splice(currentIndex, 1);
        
        // Insérer la colonne à sa nouvelle position
        this.columns.splice(newIndex, 0, column);
        
        return true;
    }
    
    // Méthode pour mettre à jour l'ordre complet des colonnes
    updateColumnsOrder(orderedColumnIds) {
        // Vérifier que tous les IDs fournis correspondent à des colonnes existantes
        if (orderedColumnIds.length !== this.columns.length) return false;
        if (!orderedColumnIds.every(id => this.columns.some(col => col.id === id))) return false;
        
        // Créer un nouvel ordre de colonnes
        const newOrder = orderedColumnIds.map(id => 
            this.columns.find(col => col.id === id)
        );
        
        // Mettre à jour les colonnes
        this.columns = newOrder;
        
        return true;
    }
}

class Relationship {
    constructor(id, sourceTable, sourceColumn, targetTable, targetColumn) {
        this.id = id;
        this.sourceTable = sourceTable;
        this.sourceColumn = sourceColumn;
        this.targetTable = targetTable;
        this.targetColumn = targetColumn;
    }
}

class Schema {
    constructor() {
        this.tables = {};
        this.relationships = {};
        this.nextTableId = 1;
        this.nextColumnId = 1;
        this.nextRelationshipId = 1;
    }

    createTable(name, x, y) {
        const id = `table_${this.nextTableId++}`;
        const table = new Table(id, name, x, y);
        this.tables[id] = table;
        return table;
    }

    getTable(tableId) {
        return this.tables[tableId];
    }

    removeTable(tableId) {
        // Supprimer toutes les relations associées à cette table
        Object.keys(this.relationships).forEach(relId => {
            const rel = this.relationships[relId];
            if (rel.sourceTable === tableId || rel.targetTable === tableId) {
                delete this.relationships[relId];
            }
        });
        
        // Supprimer la table
        delete this.tables[tableId];
    }

    createColumn(tableId, name, type, isPrimaryKey = false, isForeignKey = false, referenceTable = null, referenceColumn = null) {
        const table = this.getTable(tableId);
        if (!table) return null;
        
        const id = `column_${this.nextColumnId++}`;
        const column = new Column(id, name, type, isPrimaryKey, isForeignKey, referenceTable, referenceColumn);
        table.addColumn(column);
        
        // Si c'est une clé étrangère, créer automatiquement une relation
        if (isForeignKey && referenceTable && referenceColumn) {
            this.createRelationship(tableId, id, referenceTable, referenceColumn);
        }
        
        return column;
    }

    removeColumn(tableId, columnId) {
        const table = this.getTable(tableId);
        if (!table) return;
        
        // Supprimer toutes les relations associées à cette colonne
        Object.keys(this.relationships).forEach(relId => {
            const rel = this.relationships[relId];
            if ((rel.sourceTable === tableId && rel.sourceColumn === columnId) || 
                (rel.targetTable === tableId && rel.targetColumn === columnId)) {
                delete this.relationships[relId];
            }
        });
        
        table.removeColumn(columnId);
    }

    createRelationship(sourceTableId, sourceColumnId, targetTableId, targetColumnId) {
        const id = `rel_${this.nextRelationshipId++}`;
        const relationship = new Relationship(
            id, sourceTableId, sourceColumnId, targetTableId, targetColumnId
        );
        this.relationships[id] = relationship;
        return relationship;
    }

    removeRelationship(relationshipId) {
        delete this.relationships[relationshipId];
    }

    getTableByName(name) {
        return Object.values(this.tables).find(table => table.name === name);
    }

    getColumnById(tableId, columnId) {
        const table = this.getTable(tableId);
        if (!table) return null;
        return table.columns.find(col => col.id === columnId);
    }
    
    // Réorganiser une colonne à une nouvelle position dans la table
    moveColumn(tableId, columnId, newIndex) {
        const table = this.getTable(tableId);
        if (!table) return false;
        
        return table.moveColumn(columnId, newIndex);
    }
    
    // Mettre à jour l'ordre complet des colonnes dans une table
    updateColumnsOrder(tableId, orderedColumnIds) {
        const table = this.getTable(tableId);
        if (!table) return false;
        
        return table.updateColumnsOrder(orderedColumnIds);
    }
}