#!/bin/bash

# ==========================================
# SCRIPT DE CORRECTION - BOUTON ESPACE PATIENT
# ==========================================

echo "╔═══════════════════════════════════════════╗"
echo "║  Correction Bouton Espace Patient        ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Correction 1: index.html (racine)
echo -e "${YELLOW}1️⃣ Correction frontend/index.html...${NC}"
sed -i 's/onclick="homePage\.handleAppointmentClick()"/onclick="window.location.href='\''pages\/espace-patient.html'\''"/g' frontend/index.html
echo -e "${GREEN}✅ index.html corrigé${NC}"
echo ""

# Correction 2: Tous les fichiers dans pages/
echo -e "${YELLOW}2️⃣ Correction pages/*.html...${NC}"
for file in frontend/pages/*.html; do
    filename=$(basename "$file")
    # Ne pas modifier espace-patient.html lui-même
    if [ "$filename" != "espace-patient.html" ]; then
        sed -i 's/onclick="homePage\.handleAppointmentClick()"/onclick="window.location.href='\''espace-patient.html'\''"/g' "$file"
        echo -e "${GREEN}   ✅ $filename corrigé${NC}"
    fi
done

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  ✅ Corrections appliquées avec succès!   ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Actualiser le navigateur (Ctrl+F5)"
echo "2. Tester le bouton 'Espace Patient'"
echo "3. Vérifier la redirection vers espace-patient.html"
echo ""
