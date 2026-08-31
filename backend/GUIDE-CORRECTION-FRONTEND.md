# 🔧 GUIDE DE CORRECTION DU FRONTEND

## ❌ Erreurs identifiées et corrections

### 1. URL de l'API incorrecte

**Problème**: Le frontend pointe vers `http://localhost:3000/api` au lieu de `http://localhost:5000/api`

**Fichier**: `frontend/js/main.js` ligne 5

**❌ Code incorrect**:
```javascript
apiBaseUrl: "http://localhost:3000/api",
```

**✅ Correction**:
```javascript
apiBaseUrl: "http://localhost:5000/api",
```

### 2. Comment corriger

#### Option A: Modification manuelle

1. **Ouvrez** `frontend/js/main.js`

2. **Trouvez** la ligne 5 (dans la classe CHUApp):
```javascript
this.config = {
  apiBaseUrl: "http://localhost:3000/api",  // ← LIGNE À MODIFIER
  appName: "CHU Yaoundé",
  version: "1.0.0",
};
```

3. **Changez** en:
```javascript
this.config = {
  apiBaseUrl: "http://localhost:5000/api",  // ← CORRIGÉ
  appName: "CHU Yaoundé",
  version: "2.0.0",
};
```

4. **Sauvegardez** le fichier

#### Option B: Utiliser le fichier de configuration

1. **Copiez** le fichier `FRONTEND-CONFIG.js` dans `frontend/js/`

2. **Ajoutez** dans `frontend/index.html` AVANT main.js:
```html
<script src="js/FRONTEND-CONFIG.js"></script>
<script src="js/main.js"></script>
```

3. **Modifiez** `main.js` ligne 4-8:
```javascript
constructor() {
  this.config = window.CHU_CONFIG || {
    apiBaseUrl: "http://localhost:5000/api",
    appName: "CHU Yaoundé",
    version: "2.0.0",
  };
  // ...
}
```

### 3. Autres corrections recommandées

#### Dans tous les fichiers JS du frontend

Cherchez et remplacez:
- `http://localhost:3000` → `http://localhost:5000`
- `PORT 3000` → `PORT 5000`

**Fichiers à vérifier**:
- `frontend/js/rendezvous.js`
- `frontend/js/contact.js`
- `frontend/js/urgences.js`
- `frontend/js/actualites.js`
- `frontend/js/chatbot.js`
- `frontend/js/admin.js`

#### Exemple de correction dans rendezvous.js:

**❌ Avant**:
```javascript
const API_URL = "http://localhost:3000/api";
```

**✅ Après**:
```javascript
const API_URL = "http://localhost:5000/api";
// ou mieux:
const API_URL = window.CHU_CONFIG?.apiBaseUrl || "http://localhost:5000/api";
```

### 4. Vérification de la correction

Après correction, testez:

1. **Ouvrez la console du navigateur** (F12)

2. **Rechargez la page**

3. **Vous devriez voir**:
```
📡 Configuration chargée. API URL: http://localhost:5000/api
✅ Backend accessible: {success: true, message: "..."}
```

4. **Si vous voyez**:
```
❌ Backend non accessible
```
Vérifiez que le backend est démarré sur le port 5000.

### 5. Script de correction automatique

**Pour Linux/Mac**:
```bash
cd frontend/js
# Remplacer toutes les occurrences
sed -i 's/localhost:3000/localhost:5000/g' *.js
echo "✅ URLs corrigées!"
```

**Pour Windows (PowerShell)**:
```powershell
cd frontend\js
Get-ChildItem *.js | ForEach-Object {
  (Get-Content $_.FullName) -replace 'localhost:3000', 'localhost:5000' | 
  Set-Content $_.FullName
}
Write-Host "✅ URLs corrigées!"
```

### 6. Configuration pour la production

Quand vous déployez en ligne, changez:

**En local**:
```javascript
apiBaseUrl: "http://localhost:5000/api"
```

**En production**:
```javascript
apiBaseUrl: "https://chu-yaounde-api.onrender.com/api"
```

**Astuce**: Utilisez une variable d'environnement:
```javascript
apiBaseUrl: window.location.hostname === 'localhost' 
  ? "http://localhost:5000/api"
  : "https://chu-yaounde-api.onrender.com/api"
```

## ✅ Checklist finale

Avant de tester:

- [ ] Backend démarré (`npm run dev` dans le dossier backend)
- [ ] Port 5000 visible dans les logs du backend
- [ ] Frontend: URL API corrigée dans main.js
- [ ] Tous les fichiers JS vérifiés
- [ ] Browser console ouverte pour voir les erreurs
- [ ] Test: http://localhost:5000/health affiche du JSON

## 🧪 Tests à effectuer

### Test 1: Connexion API
1. Ouvrir le frontend
2. Ouvrir la console (F12)
3. Taper: `window.checkBackendHealth()`
4. Doit afficher: `✅ Backend accessible`

### Test 2: Inscription
1. Aller sur la page d'inscription
2. Remplir le formulaire
3. Soumettre
4. Vérifier dans la console qu'il n'y a pas d'erreur CORS

### Test 3: Création de rendez-vous
1. Aller sur la page rendez-vous
2. Remplir le formulaire
3. Soumettre
4. Vérifier qu'un message de succès s'affiche

## 🐛 Problèmes courants après correction

### Erreur CORS
**Symptôme**: `Access to fetch has been blocked by CORS policy`

**Solution**: Vérifiez `.env` du backend:
```env
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:5500
```
Ajoutez l'URL de votre frontend.

### Erreur 404
**Symptôme**: `404 Not Found` sur les appels API

**Solution**: Vérifiez que le backend est sur le bon port:
```bash
# Dans le backend
npm run dev
# Doit afficher: Port: 5000
```

### Token invalide
**Symptôme**: `401 Unauthorized`

**Solution**: Supprimez le token du localStorage:
```javascript
// Dans la console du navigateur
localStorage.removeItem('chu_token');
```

## 📞 Besoin d'aide?

Si après ces corrections ça ne fonctionne toujours pas:

1. **Vérifiez les logs du backend** (terminal où vous avez lancé `npm run dev`)
2. **Vérifiez la console du navigateur** (F12)
3. **Testez l'API avec Postman** pour isoler le problème
4. **Vérifiez que MongoDB est démarré**

---

## 🎉 Voilà!

Une fois ces corrections effectuées, votre frontend devrait communiquer correctement avec le backend!

**Rappel**: 
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:8080` (ou votre port)
- Les deux doivent tourner en même temps!
