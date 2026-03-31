// backend/src/routes/admin.js
const router = require('express').Router();
const pool   = require('../config/db');
const { authMiddleware, requireRole } = require('../middlewares/auth');

router.use(authMiddleware, requireRole('admin'));

// Users
router.get('/users', async (req, res) => {
  const [users] = await pool.query('SELECT id, email, role, first_name, last_name, is_active, created_at FROM users');
  res.json(users);
});

router.post('/users', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { email, password, role, first_name, last_name } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password, role requis' });
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (?,?,?,?,?)',
    [email, hash, role, first_name || null, last_name || null]
  );
  res.status(201).json({ message: 'User créé', userId: result.insertId });
});

router.delete('/users/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'User introuvable' });
  res.json({ message: 'User supprimé' });
});

// Formations
router.get('/formations', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM formations ORDER BY name');
  res.json(rows);
});

router.post('/formations', async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'name et code requis' });
  const [result] = await pool.query('INSERT INTO formations (name, code) VALUES (?,?)', [name, code]);
  res.status(201).json({ message: 'Formation créée', formationId: result.insertId });
});

// Courses
router.get('/courses', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM courses ORDER BY name');
  res.json(rows);
});

router.post('/courses', async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'name et code requis' });
  const [result] = await pool.query('INSERT INTO courses (name, code) VALUES (?,?)', [name, code]);
  res.status(201).json({ message: 'Cours créé', courseId: result.insertId });
});

module.exports = router;
