// backend/src/app.js
const express = require('express');
const cors    = require('cors');
const formsRouter     = require('./routes/forms');
const sessionsRouter  = require('./routes/sessions');
const responsesRouter = require('./routes/responses');
const adminRouter = require('./routes/admin');
require('dotenv').config();

const authRouter = require('./routes/auth');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/auth',     authRouter);
app.use('/api/forms',    formsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/sessions', responsesRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` });
});

module.exports = app;

app.use('/api/admin', adminRouter);
