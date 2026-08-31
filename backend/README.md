# 🏥 CHU Yaoundé - Backend API

API REST complète pour le système de gestion hospitalière du Centre Hospitalier Universitaire de Yaoundé.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation locale](#installation-locale)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet)
- [API Endpoints](#api-endpoints)
- [Déploiement](#déploiement)
- [Tests](#tests)

## ✨ Fonctionnalités

- ✅ Authentification JWT sécurisée
- ✅ Gestion des rendez-vous médicaux
- ✅ Système de messagerie (contacts)
- ✅ Gestion des urgences
- ✅ Publication d'actualités
- ✅ Gestion des services hospitaliers
- ✅ Panel d'administration
- ✅ Chatbot médical
- ✅ Upload de documents
- ✅ Notifications email et SMS
- ✅ Rate limiting
- ✅ Validation des données
- ✅ Protection contre les attaques (XSS, NoSQL injection, etc.)

## 🛠 Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de données**: MongoDB
- **Authentification**: JWT (JSON Web Tokens)
- **Validation**: Express-Validator, Joi
- **Sécurité**: Helmet, CORS, XSS-Clean, etc.
- **Email**: Nodemailer
- **SMS**: Twilio (optionnel)
- **Upload**: Multer, Cloudinary (optionnel)

## 🚀 Installation locale

### Prérequis

- Node.js (version 18 ou supérieure)
- MongoDB (local ou Atlas)
- npm ou yarn

### Étapes d'installation

1. **Cloner ou extraire le projet**
```bash
cd CHU-Backend-Complete
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```
Ensuite, modifiez le fichier `.env` avec vos propres valeurs.

4. **Démarrer MongoDB**

Si vous utilisez MongoDB local:
```bash
# Sur Windows
net start MongoDB

# Sur macOS (avec Homebrew)
brew services start mongodb-community

# Sur Linux
sudo systemctl start mongod
```

5. **Démarrer le serveur**

Mode développement (avec auto-reload):
```bash
npm run dev
```

Mode production:
```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

## ⚙️ Configuration

### Variables d'environnement essentielles

Modifiez le fichier `.env`:

```env
# Base de données
MONGO_URI=mongodb://localhost:27017/chu_yaounde

# JWT Secret (utilisez une clé forte en production!)
JWT_SECRET=votre_cle_secrete_unique_tres_longue

# Email (Gmail)
EMAIL_USERNAME=votre-email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app
```

### Configuration Gmail pour les emails

1. Activez la validation en 2 étapes sur votre compte Gmail
2. Générez un mot de passe d'application:
   - https://myaccount.google.com/apppasswords
3. Utilisez ce mot de passe dans `EMAIL_PASSWORD`

## 📁 Structure du projet

```
CHU-Backend-Complete/
├── config/
│   ├── database.js          # Configuration MongoDB
│   └── cloudinary.js        # Configuration Cloudinary (optionnel)
├── middleware/
│   ├── auth.js              # Authentification JWT
│   ├── validation.js        # Validation des données
│   └── upload.js            # Upload de fichiers
├── models/
│   ├── User.js              # Modèle utilisateur
│   ├── Appointment.js       # Modèle rendez-vous
│   ├── Contact.js           # Modèle contact
│   ├── Emergency.js         # Modèle urgences
│   ├── News.js              # Modèle actualités
│   └── Service.js           # Modèle services
├── routes/
│   ├── auth.js              # Routes authentification
│   ├── appointments.js      # Routes rendez-vous
│   ├── contacts.js          # Routes contacts
│   ├── emergencies.js       # Routes urgences
│   ├── news.js              # Routes actualités
│   ├── services.js          # Routes services
│   ├── users.js             # Routes utilisateurs
│   ├── admin.js             # Routes admin
│   └── chatbot.js           # Routes chatbot
├── utils/
│   ├── emailService.js      # Service d'envoi d'emails
│   ├── smsService.js        # Service SMS
│   └── helpers.js           # Fonctions utilitaires
├── uploads/                 # Dossier pour les fichiers uploadés
├── .env                     # Variables d'environnement
├── .env.example             # Exemple de configuration
├── package.json             # Dépendances npm
└── server.js                # Point d'entrée de l'application
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur
- `PUT /api/auth/updateprofile` - Mise à jour du profil
- `PUT /api/auth/updatepassword` - Changement de mot de passe
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/forgotpassword` - Mot de passe oublié
- `PUT /api/auth/resetpassword/:token` - Réinitialisation

### Rendez-vous
- `GET /api/appointments` - Liste des rendez-vous
- `POST /api/appointments` - Créer un rendez-vous
- `GET /api/appointments/:id` - Détails d'un rendez-vous
- `PUT /api/appointments/:id` - Modifier un rendez-vous
- `DELETE /api/appointments/:id` - Annuler un rendez-vous
- `GET /api/appointments/available-slots` - Créneaux disponibles

### Contacts
- `POST /api/contacts` - Envoyer un message
- `GET /api/contacts` - Liste des messages (admin)
- `GET /api/contacts/:id` - Détails d'un message
- `PUT /api/contacts/:id/reply` - Répondre à un message

### Urgences
- `POST /api/emergencies` - Signaler une urgence
- `GET /api/emergencies` - Liste des urgences (staff)
- `PUT /api/emergencies/:id/status` - Mettre à jour le statut

### Actualités
- `GET /api/news` - Liste des actualités
- `GET /api/news/:id` - Détails d'une actualité
- `POST /api/news` - Créer une actualité (admin)
- `PUT /api/news/:id` - Modifier une actualité (admin)
- `DELETE /api/news/:id` - Supprimer une actualité (admin)

### Services
- `GET /api/services` - Liste des services
- `GET /api/services/:id` - Détails d'un service
- `POST /api/services` - Créer un service (admin)
- `PUT /api/services/:id` - Modifier un service (admin)

### Health Check
- `GET /health` - Vérifier l'état du serveur

## 🌐 Déploiement

### Déploiement en local (pour tests)

Suivez les étapes d'[Installation locale](#installation-locale).

### Déploiement sur Render.com (gratuit)

1. **Créer un compte sur Render**: https://render.com

2. **Créer un Web Service**:
   - New > Web Service
   - Connectez votre repository GitHub ou uploadez le code
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Configurer les variables d'environnement**:
   Dans l'onglet "Environment", ajoutez toutes les variables de `.env`

4. **Base de données MongoDB Atlas** (gratuit):
   - Créez un compte sur https://www.mongodb.com/cloud/atlas
   - Créez un cluster gratuit
   - Obtenez votre URI de connexion
   - Ajoutez-la dans `MONGO_URI` sur Render

### Déploiement sur Heroku

1. **Installer Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

2. **Créer une application**:
```bash
heroku create chu-yaounde-api
```

3. **Configurer les variables**:
```bash
heroku config:set MONGO_URI=votre_mongodb_atlas_uri
heroku config:set JWT_SECRET=votre_secret
# ... autres variables
```

4. **Déployer**:
```bash
git push heroku main
```

### Déploiement sur VPS (Ubuntu)

```bash
# Se connecter au VPS
ssh user@votre-serveur

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer MongoDB
# (voir https://docs.mongodb.com/manual/installation/)

# Cloner le projet
git clone votre-repo
cd CHU-Backend-Complete

# Installer les dépendances
npm install

# Installer PM2 pour garder l'app en ligne
sudo npm install -g pm2

# Démarrer l'application
pm2 start server.js --name chu-backend

# Configurer PM2 au démarrage
pm2 startup
pm2 save

# Configurer Nginx comme reverse proxy (optionnel)
```

## 🧪 Tests

```bash
# Exécuter les tests
npm test

# Avec couverture
npm run test:coverage
```

## 📝 Notes importantes

### Sécurité en production

- ✅ Changez **absolument** le `JWT_SECRET`
- ✅ Utilisez des mots de passe forts
- ✅ Activez HTTPS
- ✅ Configurez correctement CORS
- ✅ Utilisez MongoDB Atlas avec IP whitelist
- ✅ Activez les sauvegardes automatiques

### Performance

- Le serveur utilise:
  - Compression des réponses
  - Rate limiting
  - Caching (si configuré)
  - Indexes MongoDB optimisés

## 🆘 Support

Pour toute question ou problème:

1. Vérifiez que MongoDB est démarré
2. Vérifiez vos variables d'environnement
3. Consultez les logs: `npm run dev`
4. Vérifiez le port (par défaut 5000)

## 📄 Licence

MIT License - CHU Yaoundé 2024

---

**Développé avec ❤️ pour le CHU de Yaoundé**
