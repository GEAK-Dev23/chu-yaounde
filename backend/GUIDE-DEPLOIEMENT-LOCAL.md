# 🖥️ GUIDE DE DÉPLOIEMENT LOCAL - CHU Yaoundé

Guide complet pour déployer le projet sur votre ordinateur local.

## 📋 Prérequis

Avant de commencer, vous devez installer:

### 1. Node.js
- **Windows**: Téléchargez depuis https://nodejs.org (version LTS recommandée)
- **macOS**: `brew install node` ou téléchargez depuis nodejs.org
- **Linux**: 
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Vérifiez l'installation:
```bash
node --version  # Doit afficher v18.x.x ou plus
npm --version   # Doit afficher 9.x.x ou plus
```

### 2. MongoDB

#### Windows
1. Téléchargez MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Installez avec l'option "Complete"
3. Cochez "Install MongoDB as a Service"

Vérifiez:
```bash
mongo --version
```

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Git (optionnel mais recommandé)
- **Windows**: https://git-scm.com/download/win
- **macOS**: `brew install git`
- **Linux**: `sudo apt-get install git`

## 🚀 Installation du Backend

### Étape 1: Préparation du projet

1. **Extraire les fichiers** ou cloner le repository:
```bash
cd CHU-Backend-Complete
```

2. **Installer les dépendances** (cela peut prendre quelques minutes):
```bash
npm install
```

Vous devriez voir quelque chose comme:
```
added 245 packages in 45s
```

### Étape 2: Configuration

1. **Copier le fichier de configuration**:
```bash
# Sur Windows (PowerShell)
copy .env.example .env

# Sur macOS/Linux
cp .env.example .env
```

2. **Modifier le fichier .env**:

Ouvrez `.env` avec un éditeur de texte (Notepad++, VS Code, etc.) et modifiez:

```env
# Base de données - Si MongoDB est en local, gardez cette ligne
MONGO_URI=mongodb://localhost:27017/chu_yaounde

# Secret JWT - CHANGEZ CETTE VALEUR!
JWT_SECRET=VotreCleSuperSecretePersonnelle2024

# Email (optionnel pour commencer)
EMAIL_USERNAME=
EMAIL_PASSWORD=

# Gardez le reste par défaut pour commencer
```

### Étape 3: Vérifier MongoDB

**Windows**:
```bash
net start MongoDB
# ou
mongod --version
```

**macOS**:
```bash
brew services list
# MongoDB devrait être "started"
```

**Linux**:
```bash
sudo systemctl status mongod
# Devrait afficher "active (running)"
```

Si MongoDB n'est pas démarré:
- **Windows**: `net start MongoDB`
- **macOS**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

### Étape 4: Démarrer le serveur

```bash
npm run dev
```

Vous devriez voir:
```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║         🏥 CHU YAOUNDÉ - BACKEND API 🏥          ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║   📍 Environnement: development                   ║
║   🔌 Port:          5000                          ║
║   ✅ Statut:        OPÉRATIONNEL                  ║
╚═══════════════════════════════════════════════════╝

🌐 API accessible sur: http://localhost:5000
```

### Étape 5: Tester l'API

Ouvrez votre navigateur et allez sur:
- http://localhost:5000/health

Vous devriez voir:
```json
{
  "success": true,
  "message": "API CHU Yaoundé opérationnelle",
  "timestamp": "2024-02-04T...",
  "environment": "development",
  "database": "Connected"
}
```

## 🔧 Configuration du Frontend

### Étape 1: Préparer le frontend

Si vous avez un dossier frontend séparé:

```bash
cd ../frontend
# ou selon votre structure
```

### Étape 2: Configurer l'URL de l'API

Dans le frontend, trouvez le fichier de configuration (souvent `config.js` ou dans les fichiers JS):

```javascript
// Exemple dans config.js ou au début des fichiers JS
const API_URL = "http://localhost:5000/api";
```

### Étape 3: Démarrer le frontend

#### Option A: Serveur de développement simple (Python)
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Accédez à: http://localhost:8080

#### Option B: Live Server (VS Code)
1. Installez l'extension "Live Server" dans VS Code
2. Clic droit sur `index.html` > "Open with Live Server"

#### Option C: Serveur Node.js simple
```bash
npx http-server -p 8080
```

## 🎯 Test complet du système

### 1. Tester l'inscription

Utilisez Postman, Insomnia ou curl:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123",
    "phone": "+237600000000"
  }'
```

### 2. Tester la connexion

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

Copiez le `token` retourné.

### 3. Créer un rendez-vous

```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "patient": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "phone": "+237600000000",
      "birthDate": "1990-01-01"
    },
    "service": "general",
    "doctor": {
      "id": "doc1",
      "name": "Dr. Martin"
    },
    "appointmentDate": "2024-12-25",
    "appointmentTime": "10:00",
    "reason": "Consultation générale"
  }'
```

## 🐛 Résolution des problèmes courants

### ❌ Erreur: "Cannot find module"
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erreur: "EADDRINUSE: address already in use"
**Solution**: Le port 5000 est déjà utilisé.

**Windows**:
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**macOS/Linux**:
```bash
lsof -ti:5000 | xargs kill -9
```

Ou changez le port dans `.env`:
```env
PORT=5001
```

### ❌ Erreur: "MongoNetworkError: failed to connect"
**Solutions**:

1. Vérifiez que MongoDB est démarré:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

2. Vérifiez l'URI dans `.env`:
```env
MONGO_URI=mongodb://localhost:27017/chu_yaounde
```

3. Testez la connexion MongoDB:
```bash
mongosh
# ou
mongo
```

### ❌ Erreur: "JWT must be provided"
**Solution**: Vérifiez que `JWT_SECRET` est défini dans `.env`

### ❌ Les emails ne sont pas envoyés
**Solution**: C'est normal si vous n'avez pas configuré Gmail. Pour tester sans email:
```env
EMAIL_USERNAME=
EMAIL_PASSWORD=
```

Les emails seront simulés dans les logs.

## 📱 Accéder depuis un autre appareil (même réseau)

1. Trouvez votre IP locale:

**Windows**:
```bash
ipconfig
# Cherchez "IPv4 Address"
```

**macOS/Linux**:
```bash
ifconfig | grep inet
# ou
ip addr show
```

2. Exemple: Si votre IP est `192.168.1.100`, accédez depuis un autre appareil:
- Backend: `http://192.168.1.100:5000`
- Frontend: `http://192.168.1.100:8080`

3. Mettez à jour le frontend pour utiliser cette IP:
```javascript
const API_URL = "http://192.168.1.100:5000/api";
```

4. Mettez à jour CORS dans `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:8080
```

## 🎓 Commandes utiles

```bash
# Démarrer en mode développement (auto-reload)
npm run dev

# Démarrer en mode production
npm start

# Voir les logs MongoDB
# Windows: %ProgramData%\MongoDB\log\mongod.log
# Linux: /var/log/mongodb/mongod.log

# Arrêter le serveur
Ctrl + C

# Vider la base de données (ATTENTION!)
mongosh chu_yaounde --eval "db.dropDatabase()"
```

## ✅ Checklist finale

- [ ] Node.js installé (v18+)
- [ ] MongoDB installé et démarré
- [ ] Dépendances npm installées (`npm install`)
- [ ] Fichier `.env` configuré
- [ ] Backend démarré (`npm run dev`)
- [ ] Test `/health` réussi
- [ ] Frontend configuré avec la bonne URL API
- [ ] Frontend accessible

## 🎉 Félicitations!

Votre backend CHU Yaoundé est maintenant opérationnel en local!

Pour le déploiement en ligne, consultez: `GUIDE-DEPLOIEMENT-PRODUCTION.md`

## 📞 Besoin d'aide?

- Vérifiez les logs dans la console
- Consultez le README.md
- Vérifiez que tous les services sont démarrés
- Testez avec Postman pour identifier les problèmes
