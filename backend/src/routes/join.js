// backend/src/routes/join.js
const router  = require('express').Router();
const pool    = require('../config/db');

// GET /api/join/:joinCode — récupère le formulaire (PUBLIC)
router.get('/:joinCode', async (req, res) => {
  try {
    const [[session]] = await pool.query(
      `SELECT s.*, f.title as form_title
       FROM survey_sessions s
       JOIN form_templates f ON s.form_template_id = f.id
       WHERE s.join_code = ?`,
      [req.params.joinCode.toUpperCase()]
    );
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    if (session.status !== 'open') return res.status(403).json({ error: 'Session non ouverte' });

    const [questions] = await pool.query(
      `SELECT q.id, q.type, q.label, q.help_text, q.is_required, q.order_index, q.config_json
       FROM form_questions q
       WHERE q.form_template_id = ?
       ORDER BY q.order_index`,
      [session.form_template_id]
    );

    for (const q of questions) {
      const [options] = await pool.query(
        'SELECT id, label, value, order_index FROM form_question_options WHERE question_id = ? ORDER BY order_index',
        [q.id]
      );
      q.options = options;
      q.config_json = q.config_json ? JSON.parse(q.config_json) : null;
    }

    res.json({
      session: {
        id: session.id,
        title: session.title,
        form_title: session.form_title,
        join_code: session.join_code,
        status: session.status
      },
      questions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/join/:joinCode/submit — soumettre anonymement (PUBLIC)
router.post('/:joinCode/submit', async (req, res) => {
  const { answers, submit_token } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Réponses manquantes' });
  }

  const conn = await pool.getConnection();
  try {
    const [[session]] = await conn.query(
      'SELECT id, status FROM survey_sessions WHERE join_code = ?',
      [req.params.joinCode.toUpperCase()]
    );
    if (!session) { conn.release(); return res.status(404).json({ error: 'Session introuvable' }); }
    if (session.status !== 'open') { conn.release(); return res.status(403).json({ error: 'Session non ouverte' }); }

    // Anti double-soumission
    if (submit_token) {
      const [[existing]] = await conn.query(
        'SELECT id FROM survey_responses WHERE submit_token = ?',
        [submit_token]
      );
      if (existing) { conn.release(); return res.status(409).json({ error: 'Réponse déjà soumise' }); }
    }

    await conn.beginTransaction();

    const [responseResult] = await conn.query(
      'INSERT INTO survey_responses (survey_session_id, submit_token) VALUES (?, ?)',
      [session.id, submit_token || null]
    );
    const responseId = responseResult.insertId;

    for (const answer of answers) {
      await conn.query(
        `INSERT INTO survey_answers (response_id, question_id, value_text, value_number, value_option_id)
         VALUES (?, ?, ?, ?, ?)`,
        [responseId, answer.question_id,
         answer.value_text   || null,
         answer.value_number !== undefined ? answer.value_number : null,
         answer.value_option_id || null]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Réponses enregistrées' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

module.exports = router;
