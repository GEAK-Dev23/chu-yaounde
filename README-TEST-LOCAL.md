# 🏥 CHU Yaoundé - Guide de test en local

## Prérequis
- **Node.js >= 18** : [nodejs.org](https://nodejs.org)
- **npm** (inclus avec Node.js)
- Connexion internet (pour MongoDB Atlas)

## Démarrage rapide

### Option 1 : Script automatique (recommandé)
```bash
chmod +x DEMARRER-LOCAL.sh
./DEMARRER-LOCAL.sh
```

### Option 2 : Démarrage manuel
**Terminal 1 - Backend :**
```bash
cd backend
npm install
npm run dev
```
**Terminal 2 - Frontend :**
```bash
cd frontend
npx serve -p 8080 .
# OU
python3 -m http.server 8080
```

## URLs
| Service | URL |
|---------|-----|
| 🌐 Site | http://localhost:8080 |
| 🔌 API | http://localhost:5000 |
| ❤️ Health | http://localhost:5000/health |

## Configuration MongoDB Atlas
Le fichier `backend/.env` contient déjà l'URI MongoDB Atlas.  
Vérifiez que votre IP est autorisée dans Atlas : **Network Access > Add IP Address > Allow from Anywhere** (pour les tests) ou ajoutez votre IP spécifique.

## Problèmes fréquents

**Erreur CORS :** Vérifiez que `ALLOWED_ORIGINS` dans `.env` inclut `http://localhost:8080`

**MongoDB timeout :** Vérifiez votre connexion internet et que votre IP est autorisée dans Atlas.

**Port déjà utilisé :** 
```bash
# Libérer le port 5000
kill $(lsof -ti:5000)
# Libérer le port 8080
kill $(lsof -ti:8080)
```
