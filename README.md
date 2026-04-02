# IFOSUP Questionnaire MVP

**Application web de questionnaires pour évaluation des cours IFOSUP**.  
Professeurs créent des formulaires, génèrent QR codes/sessions anonymes, étudiants répondent sur mobile, dashboard résultats en temps réel.

**Version MVP** : Auth, formulaires simples, QR/sessions, réponses anonymes, dashboard basique. 

## 🎯 Fonctionnalités MVP

| Rôle | Fonctionnalités |
|------|-----------------|
| **Admin** | Gestion users, formations, cours |
| **Prof** | Login, dashboard sessions, créer formulaire simple, QR/code court, fermer session, voir résultats |
| **Étudiant** | Page publique `respond/:joinCode` (1 question/écran, mobile-first, anonyme) |

**Post-MVP** : Form builder drag&drop, IA anonymisation, Teams notifications.

## 🛠️ Stack Technique

| Couche | Technologies | Justification |
|--------|--------------|---------------|
| **Frontend** | Vue 3 + Vite + Tailwind + Pinia + Vue Router | Léger, rapide, écosystème form builder riche |
| **Backend** | Node.js + Express + MySQL2 | JS unifié, simple, diagramme DB prêt |
| **Auth** | JWT + bcrypt | Léger, sécurisé |
| **QR** | qrcode | Génération serveur |
| **Déploiement** | **Render (Backend + DB) + Vercel (Frontend)** | Gratuit, zéro config, scalabilité |

**Diagramme DB** : [IFOSUP_Diagramme_DB.pdf](./docs/IFOSUP_Diagramme_DB.pdf)

## 🚀 Installation Locale

### Prérequis
- Node.js ≥ 18
- MySQL ≥ 8 (local ou Render)
- Git

### 1. Clone & Structure
```bash
git clone https://github.com/changzhiho/ifosup-questionnaire-mvp.git
cd ifosup-questionnaire-mvp
```

**Arborescence monorepo** :
```
├── backend/     # Express API
├── frontend/    # Vue 3 Vite
├── docs/        # Diagramme DB, rapport TFE
└── README.md
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Édite .env : DB_HOST, DB_USER, DB_PASS, JWT_SECRET, FRONTEND_URL
npm install
npm run db:migrate  # Crée tables (script SQL fourni)
npm run dev
```
**Port** : `3000`

### 3. Frontend
```bash
cd ../frontend
cp .env.example .env
# Édite .env : VITE_API_URL=http://localhost:3000
npm install
npm run dev
```
**Port** : `5173`

## ☁️ Déploiement Production (Render + Vercel)

### Backend + DB sur Render
1. [Render.com](https://render.com) → New Web Service → GitHub → `backend/`
2. **Variables d'environnement** :
   ```
   PORT=10000
   DB_HOST=...
   DB_USER=...
   DB_PASS=...
   DB_NAME=ifosup
   JWT_SECRET=...
   FRONTEND_URL=https://ifosup-questionnaire-frontend.vercel.app
   ```
3. **Build** : `npm install`
4. **Start** : `npm start`

**API** : `https://ifosup-questionnaire-backend.onrender.com`

### Frontend sur Vercel
1. [Vercel.com](https://vercel.com) → New Project → GitHub → `frontend/`
2. **Variable** : `VITE_API_URL=https://ifosup-questionnaire-backend.onrender.com`
3. **Build** : Auto (Vite)

**Frontend** : `https://ifosup-questionnaire-frontend.vercel.app`

**QR pointe vers** : `https://ifosup-questionnaire-frontend.vercel.app/respond/:joinCode`

## 🔒 Sécurité & Qualité

### Sécurité critique
- ✅ **Auth** : JWT + bcrypt, tokens one-use pour soumissions
- ✅ **Validation** : Serveur (express-validator), XSS/CSRF protection
- ✅ **Anonymat** : Pas de tracking IP, cookies temporaires
- ✅ **Secrets** : `.env` → `.gitignore`, Render/Vercel vars
- ⚠️ **Formulaires publics** : Rate limiting, double-soumission bloquée

### Tests & CI
```yaml
# .github/workflows/ci.yml
- Jest (backend), Vitest (frontend)
- Supertest (API)
- Playwright (E2E)
- ESLint + Prettier + Husky
```

## 📋 Roadmap & Issues

**Issues GitHub** : [Voir le backlog](https://github.com/changzhiho/ifosup-questionnaire-mvp/issues)

**Phases complétées** :
- ✅ Phase 1 : Backend API + BDD
- ✅ Phase 2 : Frontend Vue
- ✅ Phase 3 : Déploiement Render + Vercel
- 🔄 Phase 4 : Rapport TFE


## 🤝 Contribution

1. `git checkout -b feature/xxx`
2. `git commit -m "feat: add QR endpoint"`
3. PR avec tests

**Style** : ESLint + Prettier + Husky.

## 📄 Rapport

**Livrables** :
- ✅ URL production fonctionnelle
- ✅ Diagramme DB UML
- ✅ Captures parcours utilisateur
- ✅ Architecture + justification stack
- 🔄 Plan version finale

**Contact** : changzhiho@github.com
