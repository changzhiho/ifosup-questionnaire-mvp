// backend/src/routes/auth.js
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');

// POST /api/auth/register  — inscription (rôle professor uniquement)
router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Mot de passe trop court (min 8 caractères)' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES (?, ?, 'professor', ?, ?)`,
      [email, hash, first_name || null, last_name || null]
    );

    return res.status(201).json({ message: 'Compte créé', userId: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login  — connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id:         user.id,
        email:      user.email,
        role:       user.role,
        first_name: user.first_name,
        last_name:  user.last_name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
