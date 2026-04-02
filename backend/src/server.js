// backend/src/server.js
require('dotenv').config();

const app  = require('./app');
const port = process.env.PORT || 3000;

// Connexion BDD au démarrage (importé pour l'effet de bord du log)
require('./config/db');

app.listen(port,'0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
});
