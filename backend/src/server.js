const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de la connexion à PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sql_schema_designer'
});

// Vérifier la connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erreur de connexion à PostgreSQL:', err);
  }
  console.log('Connecté à PostgreSQL avec succès!');
  release();
});

// Routes pour les projets
app.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des projets:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/projects', async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Le nom du projet est obligatoire' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de la création du projet:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/projects/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    
    const tablesResult = await pool.query('SELECT * FROM schema_tables WHERE project_id = $1', [id]);
    const columnsResult = await pool.query(
      'SELECT tc.* FROM table_columns tc JOIN schema_tables st ON tc.table_id = st.id WHERE st.project_id = $1',
      [id]
    );
    const relationshipsResult = await pool.query('SELECT * FROM relationships WHERE project_id = $1', [id]);
    
    const project = projectResult.rows[0];
    project.tables = tablesResult.rows;
    
    // Associer les colonnes à leurs tables respectives
    project.tables.forEach(table => {
      table.columns = columnsResult.rows.filter(col => col.table_id === table.id);
    });
    
    project.relationships = relationshipsResult.rows;
    
    res.json(project);
  } catch (err) {
    console.error('Erreur lors de la récupération du projet:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Sauvegarder un schéma complet
app.post('/projects/:id/schema', async (req, res) => {
  const { id } = req.params;
  const { tables, relationships } = req.body;
  
  try {
    // Commencer une transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Vérifier que le projet existe
      const projectCheck = await client.query('SELECT id FROM projects WHERE id = $1', [id]);
      if (projectCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Projet non trouvé' });
      }
      
      // Mettre à jour la date de mise à jour du projet
      await client.query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [id]);
      
      // Supprimer toutes les anciennes tables (ce qui supprimera également les colonnes en cascade)
      await client.query('DELETE FROM schema_tables WHERE project_id = $1', [id]);
      
      // Supprimer toutes les anciennes relations
      await client.query('DELETE FROM relationships WHERE project_id = $1', [id]);
      
      // Insérer les nouvelles tables
      for (const table of tables) {
        const tableResult = await client.query(
          'INSERT INTO schema_tables (project_id, table_id, name, x, y) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [id, table.id, table.name, table.x, table.y]
        );
        const tableDbId = tableResult.rows[0].id;
        
        // Insérer les colonnes de cette table
        for (const column of table.columns) {
          await client.query(
            'INSERT INTO table_columns (table_id, column_id, name, type, is_primary_key, is_foreign_key, reference_table, reference_column) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [tableDbId, column.id, column.name, column.type, column.isPrimaryKey, column.isForeignKey, column.referenceTable, column.referenceColumn]
          );
        }
      }
      
      // Insérer les relations
      for (const rel of relationships) {
        await client.query(
          'INSERT INTO relationships (project_id, relationship_id, source_table, source_column, target_table, target_column) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, rel.id, rel.sourceTable, rel.sourceColumn, rel.targetTable, rel.targetColumn]
        );
      }
      
      // Valider la transaction
      await client.query('COMMIT');
      res.status(200).json({ message: 'Schéma sauvegardé avec succès' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du schéma:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour supprimer un projet
app.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    
    res.status(200).json({ message: 'Projet supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression du projet:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});