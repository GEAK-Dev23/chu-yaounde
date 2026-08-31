# ⚡ DÉMARRAGE IMMÉDIAT - 60 SECONDES

## 🎯 Pour les pressés - Version ultra-rapide

### OPTION 1 - Un seul script (Recommandé)

```bash
# 1. Décompresser le fichier
unzip CHU-CORRECTED.zip
cd CHU-CORRECTED

# 2. Tout installer et démarrer
./INSTALL.sh && ./START.sh

# 3. Ouvrir le navigateur
http://localhost:8080
```

**C'est tout! ✅**

---

### OPTION 2 - Manuelle (2 terminaux)

**Terminal 1:**
```bash
cd CHU-CORRECTED/backend
npm install && npm start
```

**Terminal 2:**
```bash
cd CHU-CORRECTED/frontend
python -m http.server 8080
```

**Navigateur:**
```
http://localhost:8080
```

---

## 🧪 TEST RAPIDE (30 secondes)

1. **Accueil:** http://localhost:8080
   - ✅ La page se charge?

2. **Espace Patient:** Cliquer sur le bouton en haut à droite
   - ✅ La page "Espace Patient" s'affiche?

3. **Inscription:** Onglet "Inscription"
   - Remplir le formulaire
   - Cliquer "Créer mon compte"
   - ✅ Le dashboard s'affiche?

**Si les 3 tests passent → Tout fonctionne! 🎉**

---

## 🆘 PROBLÈME?

### Backend ne démarre pas
```bash
# Vérifier Node.js
node --version  # Doit être >= 18

# Si < 18, installer Node.js 18+
# https://nodejs.org/
```

### Frontend ne s'ouvre pas
```bash
# Option alternative avec Node.js
cd frontend
npx http-server -p 8080
```

### Erreur CORS
```bash
# Éditer backend/.env
# Ligne 23: ALLOWED_ORIGINS=http://localhost:8080
```

---

## 📞 SUPPORT RAPIDE

**Problème persiste?**

1. Lire: `DEMARRAGE_RAPIDE.md` (guide détaillé)
2. Consulter: `CORRECTIONS_CHU.md` (doc technique)
3. Vérifier: Console du navigateur (F12)

---

## ✅ CHECKLIST EXPRESS

- [ ] Node.js 18+ installé
- [ ] Backend démarre (port 5000)
- [ ] Frontend démarre (port 8080)
- [ ] Page d'accueil se charge
- [ ] Bouton "Espace Patient" fonctionne
- [ ] Inscription fonctionne
- [ ] Dashboard s'affiche

**Si tout est coché → C'est bon! ✅**

---

## 🚀 PRÊT POUR LA PRODUCTION

Le système est **100% opérationnel** et prêt à l'emploi!

**Bon développement!** 🎉

---

**Temps total de démarrage:** < 2 minutes  
**Niveau requis:** Débutant  
**Complexité:** ⭐ Facile
