// FICHIER TEMPORAIRE POUR CORRIGER LES LOGOS
console.log('🔧 Initialisation correcteur de logos...');

function debugLogos() {
    console.log('=== DEBUG LOGOS ===');
    
    // Vérifier tous les logos
    const logos = document.querySelectorAll('img[src*="logo"]');
    console.log('Logos trouvés:', logos.length);
    
    logos.forEach((logo, index) => {
        console.log(`Logo ${index + 1}:`, {
            src: logo.src,
            currentSrc: logo.currentSrc,
            naturalWidth: logo.naturalWidth,
            naturalHeight: logo.naturalHeight,
            complete: logo.complete,
            alt: logo.alt
        });
    });
    
    // Tester les chemins
    const testPaths = [
        '/frontend/assets/logos/chu-logo-fr.jpeg',
        './assets/logos/chu-logo-fr.jpeg',
        'assets/logos/chu-logo-fr.jpeg',
        '../assets/logos/chu-logo-fr.jpeg'
    ];
    
    testPaths.forEach(path => {
        const img = new Image();
        img.onload = () => console.log(`✅ CHEMIN VALIDE: ${path}`);
        img.onerror = () => console.log(`❌ CHEMIN INVALIDE: ${path}`);
        img.src = path;
    });
}

// Exécuter le debug au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM chargé - test des logos...');
    setTimeout(debugLogos, 1000);
});

// Forcer le chargement des logos
function forceLoadLogos() {
    console.log('🔄 Forçage chargement logos...');
    
    const logos = [
        { selector: '.chu-logo', src: '/frontend/assets/logos/chu-logo-fr.jpeg' },
        { selector: '.footer-logo', src: '/frontend/assets/logos/chu-logo-fr-blanc.jpeg' }
    ];
    
    logos.forEach(logo => {
        const img = document.querySelector(logo.selector);
        if (img) {
            console.log(`Chargement logo: ${logo.src}`);
            img.src = logo.src + '?t=' + Date.now(); // Eviter le cache
            img.style.display = 'block';
        }
    });
}

// Exposer les fonctions globalement
window.debugLogos = debugLogos;
window.forceLoadLogos = forceLoadLogos;