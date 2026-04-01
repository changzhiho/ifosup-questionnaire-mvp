// backend/src/routes/responses.js
const router = require('express').Router();
const pool   = require('../config/db');

// POST /api/sessions/:code/respond — soumettre réponses (PUBLIC, anonyme)
router.post('/:code/respond', async (req, res) => {
  const { answers } = req.body; // [{ question_id, value_text, value_number, value_option_id }]
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Réponses manquantes' });
  }

  const conn = await pool.getConnection();
  try {
    // Récupérer la session
    const [[session]] = await conn.query(
      'SELECT id, status FROM survey_sessions WHERE join_code = ?',
      [req.params.code.toUpperCase()]
    );
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    if (session.status !== 'open') return res.status(403).json({ error: 'Session non ouverte' });

    await conn.beginTransaction();

    // Créer la réponse (anonyme)
    const [responseResult] = await conn.query(
      'INSERT INTO survey_responses (survey_session_id) VALUES (?)',
      [session.id]
    );
    const responseId = responseResult.insertId;

    // Insérer chaque réponse individuelle
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
    res.status(201).json({ message: 'Réponses enregistrées', responseId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

// GET /api/sessions/:code/results — résultats (JWT requis, owner only)
const { authMiddleware } = require('../middlewares/auth');
router.get('/:code/results', authMiddleware, async (req, res) => {
  try {
    const [[session]] = await pool.query(
      'SELECT * FROM survey_sessions WHERE join_code = ? AND created_by_user_id = ?',
      [req.params.code.toUpperCase(), req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    const [responses] = await pool.query(
      `SELECT r.id, r.submitted_at,
              a.question_id, a.value_text, a.value_number, a.value_option_id,
              q.label as question_label, q.type as question_type
       FROM survey_responses r
       JOIN survey_answers a ON a.response_id = r.id
       JOIN form_questions q ON q.id = a.question_id
       WHERE r.survey_session_id = ?
       ORDER BY r.id, q.order_index`,
      [session.id]
    );

    const totalResponses = [...new Set(responses.map(r => r.id))].length;
    res.json({ session, totalResponses, answers: responses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
