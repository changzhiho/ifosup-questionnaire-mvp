// backend/src/routes/sessions.js
const router = require('express').Router();
const pool   = require('../config/db');
const { authMiddleware } = require('../middlewares/auth');
const crypto = require('crypto');
const QRCode = require('qrcode');

function generateJoinCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

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

module.exports = router;
