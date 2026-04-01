// backend/src/routes/sessions.js
const router = require('express').Router();
const pool   = require('../config/db');
const { authMiddleware } = require('../middlewares/auth');
const crypto = require('crypto');
const QRCode = require('qrcode');

function generateJoinCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/sessions — liste des sessions du prof connecté
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [sessions] = await pool.query(
      `SELECT s.id, s.title, s.status, s.join_code, s.created_at,
              f.title as form_title
       FROM survey_sessions s
       JOIN form_templates f ON s.form_template_id = f.id
       WHERE s.created_by_user_id = ?
       ORDER BY s.created_at DESC`,
      [req.user.id]
    )
    res.json(sessions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})


// POST /api/sessions — créer une session (JWT requis)
router.post('/', authMiddleware, async (req, res) => {
  const { form_template_id, title, course_id, formation_id, academic_year_id, closes_at } = req.body;
  if (!form_template_id || !title) {
    return res.status(400).json({ error: 'form_template_id et title requis' });
  }
  try {
    const [[form]] = await pool.query(
      'SELECT id FROM form_templates WHERE id = ? AND (owner_user_id = ? OR is_global = TRUE)',
      [form_template_id, req.user.id]
    );
    if (!form) return res.status(404).json({ error: 'Template introuvable' });

    const join_code = generateJoinCode();
    const [result] = await pool.query(
      `INSERT INTO survey_sessions
        (form_template_id, course_id, formation_id, academic_year_id, created_by_user_id, title, status, join_code, closes_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      [form_template_id, course_id || null, formation_id || null, academic_year_id || null,
       req.user.id, title, join_code, closes_at || null]
    );
    res.status(201).json({ message: 'Session créée', sessionId: result.insertId, join_code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sessions — liste des sessions du prof connecté
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [sessions] = await pool.query(
      `SELECT s.id, s.title, s.status, s.join_code, s.created_at,
              f.title as form_title
       FROM survey_sessions s
       JOIN form_templates f ON s.form_template_id = f.id
       WHERE s.created_by_user_id = ?
       ORDER BY s.created_at DESC`,
      [req.user.id]
    )
    res.json(sessions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})


// GET /api/sessions/:id/qrcode (JWT requis)
router.get('/:id/qrcode', authMiddleware, async (req, res) => {
  try {
    const [[session]] = await pool.query(
      'SELECT join_code FROM survey_sessions WHERE id = ? AND created_by_user_id = ?',
      [req.params.id, req.user.id]  // ← req.user.id fonctionne maintenant
    );
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const joinUrl = `${frontendUrl}/join/${session.join_code}`;
    const qrBase64 = await QRCode.toDataURL(joinUrl);

    res.json({ join_code: session.join_code, qr_base64: qrBase64, url: joinUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/sessions/:id/status (JWT requis)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['draft', 'open', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Status invalide (draft | open | closed)' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE survey_sessions SET status = ? WHERE id = ? AND created_by_user_id = ?',
      [status, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Session introuvable' });
    res.json({ message: `Session ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sessions/:code — récupérer par code (PUBLIC — étudiants)
router.get('/:code', async (req, res) => {
  try {
    const [[session]] = await pool.query(
      `SELECT s.*, f.title as form_title
       FROM survey_sessions s
       JOIN form_templates f ON s.form_template_id = f.id
       WHERE s.join_code = ?`,
      [req.params.code.toUpperCase()]
    );
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    if (session.status === 'closed') return res.status(410).json({ error: 'Session fermée' });

    const [questions] = await pool.query(
      `SELECT q.*, GROUP_CONCAT(
         JSON_OBJECT('id', o.id, 'label', o.label, 'value', o.value)
         ORDER BY o.order_index
       ) as options_json
       FROM form_questions q
       LEFT JOIN form_question_options o ON o.question_id = q.id
       WHERE q.form_template_id = ?
       GROUP BY q.id
       ORDER BY q.order_index`,
      [session.form_template_id]
    );

    const questionsFormatted = questions.map(q => ({
      ...q,
      options: q.options_json ? JSON.parse(`[${q.options_json}]`) : []
    }));

    res.json({ session, questions: questionsFormatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sessions/:id/results
router.get('/:id/results', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.id

    const [[session]] = await pool.query(
      `SELECT s.id, s.title, s.status, s.form_template_id, f.title AS form_title
       FROM survey_sessions s
       JOIN form_templates f ON f.id = s.form_template_id
       WHERE s.id = ? AND s.created_by_user_id = ?`,
      [sessionId, req.user.id]
    )

    if (!session) {
      return res.status(404).json({ error: 'Session introuvable' })
    }

    const [questions] = await pool.query(
      `SELECT q.id, q.question_text, q.question_type, q.position
       FROM form_questions q
       WHERE q.form_template_id = ?
       ORDER BY q.position ASC, q.id ASC`,
      [session.form_template_id]
    )

    const results = []

    for (const question of questions) {
      if (question.question_type === 'multiple_choice') {
        const [options] = await pool.query(
          `SELECT id, option_text
           FROM form_question_options
           WHERE question_id = ?
           ORDER BY id ASC`,
          [question.id]
        )

        const [counts] = await pool.query(
          `SELECT answer_value, COUNT(*) AS count
           FROM survey_answers
           WHERE question_id = ?
           GROUP BY answer_value`,
          [question.id]
        )

        const total = counts.reduce((sum, row) => sum + Number(row.count), 0)

        const choices = options.map((option) => {
          const found = counts.find((c) => c.answer_value === option.option_text)
          const count = found ? Number(found.count) : 0
          return {
            label: option.option_text,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          }
        })

        results.push({
          id: question.id,
          question_text: question.question_text,
          question_type: question.question_type,
          total_responses: total,
          choices,
        })
      } else if (question.question_type === 'scale') {
        const [counts] = await pool.query(
          `SELECT answer_value, COUNT(*) AS count
           FROM survey_answers
           WHERE question_id = ?
           GROUP BY answer_value
           ORDER BY CAST(answer_value AS UNSIGNED) ASC`,
          [question.id]
        )

        const total = counts.reduce((sum, row) => sum + Number(row.count), 0)

        const scale = [1, 2, 3, 4, 5].map((value) => {
          const found = counts.find((c) => Number(c.answer_value) === value)
          const count = found ? Number(found.count) : 0
          return {
            label: String(value),
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          }
        })

        results.push({
          id: question.id,
          question_text: question.question_text,
          question_type: question.question_type,
          total_responses: total,
          choices: scale,
        })
      } else {
        const [answers] = await pool.query(
          `SELECT answer_value
           FROM survey_answers
           WHERE question_id = ?
             AND answer_value IS NOT NULL
             AND TRIM(answer_value) <> ''
           ORDER BY id DESC`,
          [question.id]
        )

        results.push({
          id: question.id,
          question_text: question.question_text,
          question_type: question.question_type,
          total_responses: answers.length,
          text_answers: answers.map((a) => a.answer_value),
        })
      }
    }

    res.json({
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        form_title: session.form_title,
      },
      results,
    })
  } catch (err) {
    console.error('Erreur GET /sessions/:id/results', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})


module.exports = router;
