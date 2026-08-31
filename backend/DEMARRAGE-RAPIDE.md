# ⚡ GUIDE DE DÉMARRAGE RAPIDE - CHU Yaoundé

## 🚀 En 5 minutes chrono!

### Pour les débutants complets

#### 1️⃣ Installer Node.js (5 min)
1. Allez sur https://nodejs.org
2. Téléchargez la version LTS (bouton vert)
3. Installez (suivez l'assistant, cliquez sur "Suivant")
4. Ouvrez un terminal/invite de commandes et tapez:
   ```bash
   node --version
   ```
   Si vous voyez un numéro de version, c'est bon! ✅

#### 2️⃣ Installer MongoDB (10 min)
1. Allez sur https://www.mongodb.com/try/download/community
2. Téléchargez MongoDB Community Server
3. Installez en mode "Complete"
4. Cochez "Install MongoDB as a Service"

**Vérification**:
```bash
mongo --version
```

#### 3️⃣ Préparer le projet (2 min)
```bash
# Allez dans le dossier du backend
cd CHU-Backend-Complete

# Installez les dépendances (ça va télécharger des fichiers)
npm install
```

#### 4️⃣ Configuration (1 min)
```bash
# Sur Windows
copy .env.example .env

# Sur Mac/Linux
cp .env.example .env
```

Ouvrez `.env` avec le Bloc-notes et changez juste cette ligne:
```
JWT_SECRET=MonSuperSecretPersonnel2024
```

#### 5️⃣ Démarrer! (1 min)
```bash
npm run dev
```

**✅ Ça marche si vous voyez**:
```
🏥 CHU YAOUNDÉ - BACKEND API 🏥
✅ Statut: OPÉRATIONNEL
```

**🌐 Testez dans votre navigateur**:
http://localhost:5000/health

---

## 🎯 Commandes essentielles

```bash
# Démarrer le serveur
npm run dev

# Arrêter le serveur
Ctrl + C

# Réinstaller les dépendances (si problème)
npm install
```

---

## 🆘 Problèmes fréquents

### ❌ "npm: command not found"
→ Node.js n'est pas installé. Retournez à l'étape 1️⃣

### ❌ "Cannot find module..."
→ Les dépendances ne sont pas installées:
```bash
npm install
```

### ❌ "Port 5000 already in use"
→ Le port est déjà utilisé. Changez-le dans `.env`:
```
PORT=5001
```

### ❌ "MongoNetworkError"
→ MongoDB n'est pas démarré:
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### ❌ Rien ne se passe
→ Vérifiez que vous êtes dans le bon dossier:
```bash
# Vérifiez que vous voyez package.json
ls
# ou sur Windows
dir
```

---

## 📱 Étapes suivantes

1. ✅ Backend qui tourne en local
2. 🌐 Déployer en ligne? → Lisez `GUIDE-DEPLOIEMENT-PRODUCTION.md`
3. 🔧 Configurer le frontend? → Changez l'URL de l'API dans le frontend
4. 📧 Envoyer des emails? → Configurez Gmail dans `.env`

---

## 🎓 Pour aller plus loin

### Tester l'API avec Postman
1. Téléchargez Postman: https://www.postman.com/downloads/
2. Créez une nouvelle requête
3. Testez: `POST http://localhost:5000/api/auth/register`

### Structure de base
```
CHU-Backend-Complete/
├── server.js          ← Point d'entrée
├── routes/            ← Définit les URLs de l'API
├── models/            ← Structure de la base de données
├── middleware/        ← Sécurité et validation
└── .env               ← Configuration (PRIVÉ!)
```

### Principales URLs (à tester dans Postman)
- `GET  /health` - Vérifier l'état
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/appointments` - Créer un rendez-vous
- `POST /api/contacts` - Envoyer un message

---

## ✨ Conseils

1. **Toujours démarrer MongoDB avant le serveur**
2. **Ne jamais partager votre fichier `.env`**
3. **Arrêter le serveur avec Ctrl+C** (pas fermer la fenêtre!)
4. **Vérifier les logs** en cas d'erreur (ils s'affichent dans le terminal)

---

## 🎉 Bravo!

Votre backend CHU Yaoundé fonctionne!

**Besoin d'aide?**
- Consultez `README.md` pour plus de détails
- Vérifiez les logs dans la console
- Testez avec http://localhost:5000/health

**Prochaine étape**: Connecter le frontend!
