# 🌐 GUIDE DE DÉPLOIEMENT EN PRODUCTION - CHU Yaoundé

Guide complet pour déployer votre application en ligne.

## 📋 Options de déploiement

1. **Render.com** (Gratuit, recommandé pour débuter) ⭐
2. **Heroku** (Gratuit avec limitations)
3. **Railway** (Gratuit avec limitations)
4. **VPS** (DigitalOcean, Linode, etc.)

---

## 🎯 Option 1: Déploiement sur Render.com (GRATUIT - RECOMMANDÉ)

### Avantages
- ✅ 100% gratuit
- ✅ Facile à configurer
- ✅ Base de données MongoDB intégrée possible
- ✅ HTTPS automatique
- ✅ Déploiement automatique depuis Git

### Étape 1: Préparer le code

1. **Créer un compte GitHub** (si vous n'en avez pas):
   - https://github.com

2. **Créer un nouveau repository**:
   - Nom: `chu-yaounde-backend`
   - Visibilité: Public ou Private

3. **Pusher votre code**:
```bash
cd CHU-Backend-Complete

git init
git add .
git commit -m "Initial commit - CHU Yaounde Backend"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/chu-yaounde-backend.git
git push -u origin main
```

### Étape 2: Créer une base de données MongoDB Atlas (GRATUIT)

1. **Créer un compte**: https://www.mongodb.com/cloud/atlas/register

2. **Créer un cluster gratuit**:
   - Choisir le tier "FREE" (M0)
   - Région: Choisir la plus proche (ex: Europe)
   - Nom du cluster: `chu-yaounde`

3. **Configurer la sécurité**:
   - Database Access > Add New Database User
     - Username: `chu_admin`
     - Password: Générer un mot de passe fort (NOTEZ-LE!)
     - Rôle: Atlas Admin
   
   - Network Access > Add IP Address
     - Choisir: "Allow Access from Anywhere" (0.0.0.0/0)
     - Confirmer

4. **Obtenir l'URI de connexion**:
   - Databases > Connect > Connect your application
   - Copier l'URI: 
   ```
   mongodb+srv://chu_admin:<password>@chu-yaounde.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Remplacer `<password>` par votre mot de passe

### Étape 3: Déployer sur Render

1. **Créer un compte**: https://render.com

2. **Nouveau Web Service**:
   - Dashboard > New > Web Service
   - Connecter votre compte GitHub
   - Sélectionner le repository `chu-yaounde-backend`

3. **Configuration**:
   - **Name**: `chu-yaounde-api`
   - **Region**: Choisir la plus proche
   - **Branch**: `main`
   - **Root Directory**: (laisser vide)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Variables d'environnement** (très important!):
   
   Cliquez sur "Advanced" > "Add Environment Variable":

   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://chu_admin:VOTRE_MOT_DE_PASSE@chu-yaounde.xxxxx.mongodb.net/chu_yaounde?retryWrites=true&w=majority
   JWT_SECRET=VotreCleSuperSecreteComplexeEtLongue2024ChangezMoi
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   ALLOWED_ORIGINS=https://votre-frontend.com,https://www.votre-frontend.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=votre-email@gmail.com
   EMAIL_PASSWORD=votre_mot_de_passe_app
   EMAIL_FROM=noreply@chuy.cm
   EMAIL_FROM_NAME=CHU Yaoundé
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   BCRYPT_ROUNDS=10
   EMERGENCY_PHONE=119
   ADMIN_EMAIL=admin@chuy.cm
   ```

5. **Créer le Web Service**:
   - Cliquez sur "Create Web Service"
   - Attendez quelques minutes pendant le déploiement

6. **Récupérer l'URL**:
   - Une fois déployé, vous aurez une URL comme:
   ```
   https://chu-yaounde-api.onrender.com
   ```

### Étape 4: Tester le déploiement

Testez dans votre navigateur:
```
https://chu-yaounde-api.onrender.com/health
```

Vous devriez voir:
```json
{
  "success": true,
  "message": "API CHU Yaoundé opérationnelle",
  ...
}
```

---

## 🚀 Option 2: Déploiement sur Railway.app (GRATUIT)

### Étape 1: Préparer le code (même que Render)

### Étape 2: Déployer

1. **Créer un compte**: https://railway.app

2. **Nouveau projet**:
   - New Project > Deploy from GitHub repo
   - Sélectionner votre repository

3. **Ajouter MongoDB**:
   - Add > Database > MongoDB
   - Railway créera automatiquement une base de données

4. **Variables d'environnement**:
   - Settings > Variables
   - Ajouter toutes les variables comme pour Render
   - `MONGO_URI` sera automatiquement fourni par Railway

5. **Déployer**:
   - Railway déploie automatiquement
   - Récupérer l'URL dans Settings > Domains

---

## 🔧 Option 3: Déploiement sur VPS (DigitalOcean, Linode, etc.)

### Prérequis
- Un VPS Ubuntu (à partir de 5$/mois)
- Accès SSH

### Étape 1: Connexion au serveur

```bash
ssh root@VOTRE_IP_SERVEUR
```

### Étape 2: Installation des dépendances

```bash
# Mise à jour du système
apt update && apt upgrade -y

# Installation de Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Installation de MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Démarrer MongoDB
systemctl start mongod
systemctl enable mongod

# Installation de Git
apt install -y git

# Installation de PM2 (gestionnaire de processus)
npm install -g pm2
```

### Étape 3: Déployer l'application

```bash
# Créer un utilisateur
adduser chu
usermod -aG sudo chu
su - chu

# Cloner le projet
git clone https://github.com/VOTRE-USERNAME/chu-yaounde-backend.git
cd chu-yaounde-backend

# Installer les dépendances
npm install --production

# Créer le fichier .env
nano .env
# Coller votre configuration et sauvegarder (Ctrl+X, Y, Enter)

# Démarrer avec PM2
pm2 start server.js --name chu-backend

# Configurer PM2 au démarrage
pm2 startup
pm2 save
```

### Étape 4: Configurer Nginx (reverse proxy)

```bash
# Installation de Nginx
sudo apt install -y nginx

# Configuration
sudo nano /etc/nginx/sites-available/chu-yaounde
```

Coller:
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/chu-yaounde /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 5: Configurer HTTPS avec Let's Encrypt

```bash
# Installation de Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

---

## 🔐 Configuration Gmail pour les emails

### Pour tous les types de déploiement

1. **Activer la validation en 2 étapes**:
   - https://myaccount.google.com/security
   - 2-Step Verification > Activer

2. **Créer un mot de passe d'application**:
   - https://myaccount.google.com/apppasswords
   - Sélectionner: App > Mail, Device > Other (Node.js)
   - Générer et copier le mot de passe (16 caractères)

3. **Utiliser dans .env**:
```env
EMAIL_USERNAME=votre-email@gmail.com
EMAIL_PASSWORD=le_mot_de_passe_genere
```

---

## 🌍 Configuration du Frontend

Une fois le backend déployé:

1. **Mettre à jour l'URL de l'API** dans le frontend:
```javascript
// config.js ou dans vos fichiers JS
const API_URL = "https://chu-yaounde-api.onrender.com/api";
```

2. **Mettre à jour CORS** dans le backend (.env):
```env
ALLOWED_ORIGINS=https://votre-frontend-deploye.com,https://www.votre-frontend-deploye.com
```

3. **Déployer le frontend**:
   - **Netlify** (gratuit): https://www.netlify.com
   - **Vercel** (gratuit): https://vercel.com
   - **GitHub Pages** (gratuit)

---

## ✅ Checklist de sécurité production

- [ ] `JWT_SECRET` changé (utilisez un générateur)
- [ ] `NODE_ENV=production`
- [ ] CORS configuré correctement
- [ ] MongoDB Atlas avec IP whitelist (ou VPS sécurisé)
- [ ] HTTPS activé
- [ ] Variables d'environnement sécurisées (pas dans le code!)
- [ ] Mots de passe forts partout
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring activé (Render Dashboard, PM2, etc.)

---

## 📊 Monitoring et Maintenance

### Sur Render
- Dashboard > Logs (voir les logs en temps réel)
- Metrics (CPU, RAM, requêtes)

### Sur VPS avec PM2
```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs chu-backend

# Redémarrer
pm2 restart chu-backend

# Monitoring en temps réel
pm2 monit
```

### Sauvegardes MongoDB Atlas
- Automatic Backup activé par défaut (Free tier: 1 jour de rétention)
- Atlas > Backup > Configure

---

## 🐛 Résolution de problèmes production

### Erreur 502 Bad Gateway
- Vérifier que le backend est démarré
- Vérifier les logs: `pm2 logs` ou Render Dashboard

### Base de données non accessible
- Vérifier l'URI MongoDB
- Vérifier les IP autorisées (0.0.0.0/0 sur Atlas)
- Tester la connexion: `mongosh "votre-uri"`

### CORS errors
- Vérifier `ALLOWED_ORIGINS` dans .env
- Inclure http ET https
- Inclure avec et sans www

---

## 💰 Coûts estimés

### Option Gratuite (Render + MongoDB Atlas)
- Backend: GRATUIT
- Base de données: GRATUIT (512 MB)
- **Total: 0€/mois** ✅

### Option VPS
- VPS: 5-10€/mois
- Domaine: 10€/an
- **Total: ~6€/mois**

### Option Premium (pour production sérieuse)
- Render Pro: 7$/mois
- MongoDB Atlas Dedicated: à partir de 57$/mois
- **Total: ~64$/mois**

---

## 🎓 Commandes utiles

```bash
# Render: voir les logs
Render Dashboard > Service > Logs

# Railway: redéployer
git push origin main

# VPS: mise à jour
cd chu-yaounde-backend
git pull origin main
npm install
pm2 restart chu-backend

# Tester l'API en production
curl https://votre-api.com/health
```

---

## 🎉 Félicitations!

Votre application CHU Yaoundé est maintenant en ligne!

**URLs à tester**:
- Backend: https://votre-backend.com/health
- API Docs: https://votre-backend.com/api/...

---

## 📞 Support

En cas de problème:
1. Vérifier les logs
2. Vérifier les variables d'environnement
3. Tester avec Postman
4. Vérifier la base de données (Atlas Dashboard)

**Ressources**:
- Documentation Render: https://render.com/docs
- Documentation MongoDB Atlas: https://docs.atlas.mongodb.com
- Support PM2: https://pm2.keymetrics.io/docs
