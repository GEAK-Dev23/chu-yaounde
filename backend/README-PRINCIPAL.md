# 🏥 CHU YAOUNDÉ - PROJET COMPLET

## 📦 Contenu du projet

Ce package contient le **backend complet** et les **guides de déploiement** pour le site web du Centre Hospitalier Universitaire de Yaoundé.

```
CHU-Backend-Complete/
├── 📄 README.md                          ← Vous êtes ici
├── 🚀 DEMARRAGE-RAPIDE.md                ← Commencez par ici si débutant
├── 💻 GUIDE-DEPLOIEMENT-LOCAL.md         ← Déploiement sur votre PC
├── 🌐 GUIDE-DEPLOIEMENT-PRODUCTION.md    ← Déploiement en ligne
├── 🔧 GUIDE-CORRECTION-FRONTEND.md       ← Corrections du frontend
├── 📡 FRONTEND-CONFIG.js                 ← Configuration frontend
│
├── server.js                             ← Point d'entrée du backend
├── package.json                          ← Dépendances Node.js
├── .env                                  ← Configuration (NE PAS PARTAGER!)
├── .env.example                          ← Exemple de configuration
├── .gitignore                            ← Fichiers à ignorer par Git
│
├── config/                               ← Configuration
│   ├── database.js                       ← Connexion MongoDB
│   └── cloudinary.js                     ← Upload d'images (optionnel)
│
├── models/                               ← Modèles de données
│   ├── User.js                           ← Utilisateurs
│   ├── Appointment.js                    ← Rendez-vous
│   ├── Contact.js                        ← Messages de contact
│   ├── Emergency.js                      ← Urgences
│   ├── News.js                           ← Actualités
│   └── Service.js                        ← Services hospitaliers
│
├── routes/                               ← Routes de l'API
│   ├── auth.js                           ← Authentification
│   ├── appointments.js                   ← Gestion des rendez-vous
│   ├── contacts.js                       ← Gestion des contacts
│   ├── emergencies.js                    ← Gestion des urgences
│   ├── news.js                           ← Gestion des actualités
│   ├── services.js                       ← Gestion des services
│   ├── users.js                          ← Gestion des utilisateurs
│   ├── admin.js                          ← Panel administrateur
│   └── chatbot.js                        ← Chatbot médical
│
├── middleware/                           ← Middlewares
│   ├── auth.js                           ← Authentification JWT
│   ├── validation.js                     ← Validation des données
│   └── upload.js                         ← Upload de fichiers
│
├── utils/                                ← Utilitaires
│   ├── emailService.js                   ← Envoi d'emails
│   ├── smsService.js                     ← Envoi de SMS
│   ├── notifications.js                  ← Système de notifications
│   └── helpers.js                        ← Fonctions helper
│
└── uploads/                              ← Fichiers uploadés
    └── .gitkeep
```

---

## 🎯 DÉMARRAGE RAPIDE

### Pour les débutants

**👉 Lisez d'abord**: `DEMARRAGE-RAPIDE.md`

Ce guide vous explique étape par étape comment:
- Installer Node.js
- Installer MongoDB
- Lancer le projet en 5 minutes

### Pour les développeurs

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos valeurs

# 3. Démarrer MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# 4. Lancer le serveur
npm run dev

# ✅ Backend accessible sur http://localhost:5000
```

---

## 📚 GUIDES DISPONIBLES

| Guide | Objectif | Public |
|-------|----------|--------|
| **DEMARRAGE-RAPIDE.md** | Lancer le projet en 5 min | Débutants |
| **GUIDE-DEPLOIEMENT-LOCAL.md** | Installation complète locale | Tous |
| **GUIDE-DEPLOIEMENT-PRODUCTION.md** | Déployer en ligne (Render, VPS) | Avancé |
| **GUIDE-CORRECTION-FRONTEND.md** | Corriger les erreurs frontend | Développeurs |

---

## 🔧 CONFIGURATION REQUISE

### Logiciels nécessaires

| Logiciel | Version minimale | Lien de téléchargement |
|----------|-----------------|------------------------|
| **Node.js** | 18.0.0+ | https://nodejs.org |
| **MongoDB** | 6.0+ | https://www.mongodb.com/try/download/community |
| **npm** | 9.0.0+ | Inclus avec Node.js |

### Optionnel

- **Git**: Pour le versionnement
- **Postman**: Pour tester l'API
- **VS Code**: Éditeur recommandé

---

## ⚙️ CONFIGURATION

### 1. Variables d'environnement

Copiez `.env.example` vers `.env` et modifiez:

```env
# Base de données
MONGO_URI=mongodb://localhost:27017/chu_yaounde

# Secret JWT (TRÈS IMPORTANT - CHANGEZ-LE!)
JWT_SECRET=VotreCléSuperSecrètePersonnelle2024

# Email (optionnel pour commencer)
EMAIL_USERNAME=votre-email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app

# CORS (ajoutez l'URL de votre frontend)
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
```

### 2. Frontend

**⚠️ IMPORTANT**: Le frontend doit pointer vers `http://localhost:5000/api`

Lisez `GUIDE-CORRECTION-FRONTEND.md` pour corriger les URLs.

---

## 🚀 COMMANDES

### Développement

```bash
# Démarrer en mode dev (auto-reload)
npm run dev

# Démarrer en mode production
npm start

# Lancer les tests
npm test

# Vérifier le code
npm run lint
```

### MongoDB

```bash
# Démarrer MongoDB
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Vérifier le statut
# Windows
sc query MongoDB

# macOS
brew services list

# Linux
sudo systemctl status mongod
```

---

## 🔌 API ENDPOINTS

### Authentification

```
POST   /api/auth/register          - Inscription
POST   /api/auth/login             - Connexion
GET    /api/auth/me                - Profil utilisateur
PUT    /api/auth/updateprofile     - Modifier le profil
PUT    /api/auth/updatepassword    - Changer le mot de passe
POST   /api/auth/logout            - Déconnexion
POST   /api/auth/forgotpassword    - Mot de passe oublié
PUT    /api/auth/resetpassword/:token - Réinitialiser
```

### Rendez-vous

```
GET    /api/appointments           - Liste des rendez-vous
POST   /api/appointments           - Créer un rendez-vous
GET    /api/appointments/:id       - Détails
PUT    /api/appointments/:id       - Modifier
DELETE /api/appointments/:id       - Annuler
GET    /api/appointments/available-slots - Créneaux disponibles
```

### Contacts

```
POST   /api/contacts               - Envoyer un message
GET    /api/contacts               - Liste (admin)
GET    /api/contacts/:id           - Détails
PUT    /api/contacts/:id/reply     - Répondre
```

### Urgences

```
POST   /api/emergencies            - Signaler une urgence
GET    /api/emergencies            - Liste (staff)
PUT    /api/emergencies/:id/status - Mettre à jour le statut
```

### Actualités

```
GET    /api/news                   - Liste des actualités
GET    /api/news/:id               - Détails
POST   /api/news                   - Créer (admin)
PUT    /api/news/:id               - Modifier (admin)
DELETE /api/news/:id               - Supprimer (admin)
```

### Services

```
GET    /api/services               - Liste des services
GET    /api/services/:id           - Détails
POST   /api/services               - Créer (admin)
PUT    /api/services/:id           - Modifier (admin)
```

### Health Check

```
GET    /health                     - Vérifier l'état du serveur
```

---

## 🧪 TESTER L'API

### Avec curl

```bash
# Health check
curl http://localhost:5000/health

# Inscription
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123",
    "phone": "+237600000000"
  }'

# Connexion
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### Avec Postman

1. Téléchargez Postman: https://www.postman.com/downloads/
2. Importez la collection (si fournie)
3. Testez les endpoints

---

## 🔐 SÉCURITÉ

### En développement

- ✅ JWT_SECRET par défaut fourni
- ✅ CORS configuré pour localhost
- ✅ Rate limiting activé

### En production

**⚠️ IMPORTANT - À faire ABSOLUMENT**:

- [ ] Changer `JWT_SECRET` (utilisez un générateur)
- [ ] Configurer `ALLOWED_ORIGINS` avec vos vrais domaines
- [ ] Activer HTTPS
- [ ] Utiliser MongoDB Atlas avec whitelist IP
- [ ] Configurer des sauvegardes
- [ ] Activer le monitoring
- [ ] Ne jamais committer le fichier `.env`

---

## 📱 FRONTEND

### Configuration

1. **Copiez** `FRONTEND-CONFIG.js` dans `frontend/js/`

2. **Modifiez** l'URL de l'API dans le frontend:
```javascript
// frontend/js/main.js ligne 5
apiBaseUrl: "http://localhost:5000/api"  // ← Corrigez cette ligne
```

3. **Lisez** `GUIDE-CORRECTION-FRONTEND.md` pour plus de détails

### Démarrer le frontend

```bash
# Option 1: Python
cd frontend
python -m http.server 8080

# Option 2: Node.js
npx http-server frontend -p 8080

# Option 3: VS Code
# Installez "Live Server" extension
# Clic droit sur index.html > Open with Live Server
```

Accédez à: http://localhost:8080

---

## 🌐 DÉPLOIEMENT

### En local

**👉 Lisez**: `GUIDE-DEPLOIEMENT-LOCAL.md`

### En production

**Options gratuites**:
- **Render.com** (recommandé) 👉 `GUIDE-DEPLOIEMENT-PRODUCTION.md`
- **Railway.app**
- **Heroku**

**Options payantes**:
- **VPS** (DigitalOcean, Linode, etc.)
- **AWS** / **Google Cloud** / **Azure**

**👉 Lisez**: `GUIDE-DEPLOIEMENT-PRODUCTION.md`

---

## 🐛 DÉPANNAGE

### ❌ Port 5000 déjà utilisé

```bash
# Trouver le processus
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Ou changer le port dans .env
PORT=5001
```

### ❌ MongoDB connection failed

```bash
# Vérifier que MongoDB est démarré
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Tester la connexion
mongosh
```

### ❌ Cannot find module

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### ❌ CORS errors

Dans `.env`, ajoutez l'URL de votre frontend:
```env
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
```

---

## 📞 SUPPORT

### Ressources

- **README.md** - Documentation générale (ce fichier)
- **DEMARRAGE-RAPIDE.md** - Guide de démarrage
- **GUIDE-DEPLOIEMENT-LOCAL.md** - Installation locale
- **GUIDE-DEPLOIEMENT-PRODUCTION.md** - Déploiement en ligne
- **GUIDE-CORRECTION-FRONTEND.md** - Corrections frontend

### En cas de problème

1. Vérifiez les logs dans la console
2. Vérifiez que MongoDB est démarré
3. Vérifiez le fichier `.env`
4. Testez avec Postman
5. Consultez les guides

---

## ✅ CHECKLIST DE DÉMARRAGE

- [ ] Node.js installé (v18+)
- [ ] MongoDB installé et démarré
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` configuré
- [ ] JWT_SECRET changé
- [ ] Backend démarré (`npm run dev`)
- [ ] Test `/health` réussi
- [ ] Frontend: URL API corrigée
- [ ] Frontend accessible

---

## 📄 LICENCE

MIT License - CHU Yaoundé 2024

---

## 👥 CONTRIBUTION

Ce projet a été développé pour le Centre Hospitalier Universitaire de Yaoundé.

Pour toute contribution:
1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 🎉 FÉLICITATIONS!

Vous êtes maintenant prêt à utiliser le backend CHU Yaoundé!

**Prochaines étapes**:
1. ✅ Démarrer le backend
2. ✅ Corriger le frontend (voir GUIDE-CORRECTION-FRONTEND.md)
3. ✅ Tester localement
4. 🌐 Déployer en ligne (voir GUIDE-DEPLOIEMENT-PRODUCTION.md)

**Besoin d'aide?**
- Consultez les guides dans ce dossier
- Vérifiez les logs
- Testez avec Postman

---

**🏥 CHU Yaoundé - Développé avec ❤️ pour votre santé**
