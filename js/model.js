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
}