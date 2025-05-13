/**
 * Génère le code SQL à partir du schéma
 */
class SQLGenerator {
    constructor(schema) {
        this.schema = schema;
    }

    // Génère le code SQL complet pour PostgreSQL
    generateSQL() {
        let sql = '';
        
        // Commentaire d'en-tête
        sql += '-- SQL Schema généré par SQL Schema Designer\n';
        sql += `-- Date de génération: ${new Date().toLocaleString()}\n\n`;
        
        // Créer les tables
        sql += this.generateTableSQL();
        
        // Ajouter les contraintes de clés étrangères
        sql += this.generateForeignKeySQL();
        
        return sql;
    }

    // Génère le SQL pour la création des tables
    generateTableSQL() {
        let sql = '';
        
        // Traiter chaque table
        Object.values(this.schema.tables).forEach(table => {
            sql += `-- Table: ${table.name}\n`;
            sql += `CREATE TABLE ${this.escapeName(table.name)} (\n`;
            
            // Ajouter les colonnes
            const columnDefs = table.columns.map(column => {
                let colDef = `    ${this.escapeName(column.name)} ${column.type}`;
                
                // Gestion des clés primaires au niveau de la colonne
                if (column.isPrimaryKey) {
                    colDef += ' PRIMARY KEY';
                }
                
                // Ajouter la contrainte NOT NULL si définie
                if (column.notNull && !column.isPrimaryKey) { // Les clés primaires sont déjà NOT NULL
                    colDef += ' NOT NULL';
                }
                
                // Ajouter la valeur par défaut si définie
                if (column.defaultValue) {
                    // Déterminer si la valeur par défaut a besoin de guillemets
                    let defaultVal = column.defaultValue;
                    
                    // Gérer les valeurs spéciales comme CURRENT_TIMESTAMP, NOW(), etc.
                    const specialDefaults = ['CURRENT_TIMESTAMP', 'NOW()', 'CURRENT_DATE', 'CURRENT_TIME', 'NULL', 'TRUE', 'FALSE'];
                    const isSpecial = specialDefaults.some(sd => defaultVal.toUpperCase().includes(sd));
                    
                    // Si ce n'est pas une valeur spéciale et que c'est un type de texte, ajouter des guillemets simples
                    if (!isSpecial && 
                        (column.type.toUpperCase().includes('VARCHAR') || 
                        column.type.toUpperCase().includes('CHAR') ||
                        column.type.toUpperCase().includes('TEXT') ||
                        column.type.toUpperCase().includes('DATE') ||
                        column.type.toUpperCase().includes('TIME'))) {
                        defaultVal = `'${defaultVal}'`;
                    }
                    
                    colDef += ` DEFAULT ${defaultVal}`;
                }
                
                return colDef;
            });
            
            // Ajouter les définitions de colonnes à la requête
            sql += columnDefs.join(',\n');
            
            // Fermer la définition de table
            sql += '\n);\n\n';
        });
        
        return sql;
    }

    // Génère le SQL pour les contraintes de clés étrangères
    generateForeignKeySQL() {
        let sql = '';
        
        // Traiter chaque relation
        Object.values(this.schema.relationships).forEach(rel => {
            const sourceTable = this.schema.getTable(rel.sourceTable);
            const targetTable = this.schema.getTable(rel.targetTable);
            const sourceColumn = this.schema.getColumnById(rel.sourceTable, rel.sourceColumn);
            const targetColumn = this.schema.getColumnById(rel.targetTable, rel.targetColumn);
            
            if (!sourceTable || !targetTable || !sourceColumn || !targetColumn) {
                return;
            }
            
            // Générer un nom pour la contrainte
            const constraintName = `fk_${sourceTable.name}_${sourceColumn.name}`;
            
            sql += `-- Clé étrangère: ${sourceTable.name}.${sourceColumn.name} -> ${targetTable.name}.${targetColumn.name}\n`;
            sql += `ALTER TABLE ${this.escapeName(sourceTable.name)}\n`;
            sql += `    ADD CONSTRAINT ${this.escapeName(constraintName)}\n`;
            sql += `    FOREIGN KEY (${this.escapeName(sourceColumn.name)})\n`;
            sql += `    REFERENCES ${this.escapeName(targetTable.name)} (${this.escapeName(targetColumn.name)});\n\n`;
        });
        
        return sql;
    }

    // Échappe les noms d'objets SQL si nécessaire
    escapeName(name) {
        // Si le nom contient des espaces ou des caractères spéciaux, l'entourer de guillemets doubles
        if (/[^a-zA-Z0-9_]/.test(name) || /^\d/.test(name) || this.isReservedKeyword(name)) {
            return `"${name}"`;
        }
        return name;
    }

    // Vérifie si un nom est un mot-clé réservé PostgreSQL
    isReservedKeyword(name) {
        const keywords = [
            'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric',
            'authorization', 'between', 'binary', 'both', 'case', 'cast', 'check', 'collate',
            'column', 'constraint', 'create', 'cross', 'current_catalog', 'current_date',
            'current_role', 'current_schema', 'current_time', 'current_timestamp', 'current_user',
            'default', 'deferrable', 'desc', 'distinct', 'do', 'else', 'end', 'except', 'false',
            'fetch', 'for', 'foreign', 'freeze', 'from', 'full', 'grant', 'group', 'having',
            'ilike', 'in', 'initially', 'inner', 'intersect', 'into', 'is', 'isnull', 'join',
            'lateral', 'leading', 'left', 'like', 'limit', 'localtime', 'localtimestamp',
            'natural', 'not', 'notnull', 'null', 'offset', 'on', 'only', 'or', 'order', 'outer',
            'overlaps', 'placing', 'primary', 'references', 'returning', 'right', 'select',
            'session_user', 'similar', 'some', 'symmetric', 'table', 'tablesample', 'then',
            'to', 'trailing', 'true', 'union', 'unique', 'user', 'using', 'variadic', 'verbose',
            'when', 'where', 'window', 'with'
        ];
        
        return keywords.includes(name.toLowerCase());
    }
}