// backend/src/routes/forms.js
const router = require('express').Router();
const pool   = require('../config/db');
const { authMiddleware } = require('../middlewares/auth');

// Toutes les routes formulaires nécessitent un JWT valide
router.use(authMiddleware);

// GET /api/forms — liste des templates de l'utilisateur connecté
router.get('/', async (req, res) => {
  try {
    const [forms] = await pool.query(
      `SELECT id, title, description, is_global, created_at, updated_at
       FROM form_templates
       WHERE owner_user_id = ? OR is_global = TRUE
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(forms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/forms — créer un template
router.post('/', async (req, res) => {
  const { title, description, is_global = false, questions = [] } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO form_templates (owner_user_id, title, description, is_global)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, title, description || null, is_global]
    );
    const formId = result.insertId;

    // Insérer les questions si fournies
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const [qResult] = await conn.query(
        `INSERT INTO form_questions (form_template_id, type, label, help_text, is_required, order_index, config_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [formId, q.type, q.label, q.help_text || null, q.is_required || false, i, q.config_json ? JSON.stringify(q.config_json) : null]
      );
      // Insérer les options si c'est un choix
      if (q.options && Array.isArray(q.options)) {
        for (let j = 0; j < q.options.length; j++) {
          await conn.query(
            `INSERT INTO form_question_options (question_id, label, value, order_index)
             VALUES (?, ?, ?, ?)`,
            [qResult.insertId, q.options[j].label, q.options[j].value, j]
          );
        }
      }
    }

    await conn.commit();
    res.status(201).json({ message: 'Formulaire créé', formId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

// GET /api/forms/:id — détail + questions + options
router.get('/:id', async (req, res) => {
  try {
    const [[form]] = await pool.query(
      'SELECT * FROM form_templates WHERE id = ? AND (owner_user_id = ? OR is_global = TRUE)',
      [req.params.id, req.user.id]
    );
    if (!form) return res.status(404).json({ error: 'Formulaire introuvable' });

    const [questions] = await pool.query(
      'SELECT * FROM form_questions WHERE form_template_id = ? ORDER BY order_index',
      [req.params.id]
    );

    for (const q of questions) {
      const [options] = await pool.query(
        'SELECT * FROM form_question_options WHERE question_id = ? ORDER BY order_index',
        [q.id]
      );
      q.options = options;
    }

    res.json({ ...form, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/forms/:id — supprimer (cascade sur les questions)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM form_templates WHERE id = ? AND owner_user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Formulaire introuvable' });
    res.json({ message: 'Formulaire supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
