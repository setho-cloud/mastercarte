/**
 * ==============================================================================
 * MASTERCARTE — SYSTEME GHOST (ACTIONS SECONDAIRES) + MODULE GPS SULTAN
 * ==============================================================================
 * Ce module gère l'interface latérale intelligente (Radar/Dispatch/Admin).
 * * REGLES DE NAVIGATION :
 * 1. APPARITION : Déclenchée au survol du bord droit (trigger-ghost).
 * 2. FERMETURE MANUELLE : Déclenchée par un clic n'importe où hors du menu.
 * 3. FERMETURE AUTOMATIQUE : Déclenchée après 10 secondes d'inactivité.
 * ==============================================================================
 */

// Variable globale pour la gestion du compte à rebours
let ghostInactivityTimer; 

document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des éléments clés
    const ghostMenu = document.getElementById('menu-ghost-sultan');
    const triggerZone = document.getElementById('trigger-ghost');
    
    // Eléments du module GPS
    const btnFixerGPS = document.getElementById('btn-fixer-gps');
    const gpsDisplay = document.getElementById('gps-display');
    const statusLabel = document.getElementById('radar-status');

    // Sécurité : on vérifie que les éléments existent dans le DOM
    if (!ghostMenu || !triggerZone) {
        console.warn("⚠️ MasterCarte : Éléments du Système Ghost introuvables.");
        return;
    }

    /**
     * 1. LOGIQUE D'APPARITION (SURVOL)
     */
    triggerZone.addEventListener('mouseenter', () => {
        ghostMenu.classList.add('is-open');
        resetInactivityTimer(); // Démarre le chrono dès l'ouverture
    });

    /**
     * 2. LOGIQUE DE FERMETURE (CLIC EXTERIEUR)
     */
    document.addEventListener('click', (event) => {
        const isClickInsideMenu = ghostMenu.contains(event.target);
        const isClickOnTrigger = (event.target === triggerZone);

        if (!isClickInsideMenu && !isClickOnTrigger) {
            closeGhostMenu();
        }
    });

    /**
     * 3. LOGIQUE D'INTERACTION (RESET TIMER)
     */
    ghostMenu.addEventListener('mousemove', () => {
        resetInactivityTimer();
    });

    /**
     * 4. MODULE CALIBRAGE GPS SULTAN
     * Connecté à l'établissement chargé par gerant_edit.js
     */
    if (btnFixerGPS) {
        btnFixerGPS.addEventListener('click', () => {
            resetInactivityTimer(); // On reset le timer car le gérant interagit
            
            // Récupération de l'ID et de la Zone depuis window.currentEtab
            const etab = window.currentEtab;

            if (!etab || !etab.id) {
                alert("⚠️ Erreur : Aucun établissement n'est actuellement chargé.");
                return;
            }

            // Interface en mode recherche
            btnFixerGPS.textContent = "⌛ CAPTURE GPS...";
            btnFixerGPS.disabled = true;
            if(statusLabel) statusLabel.textContent = "COMMUNICATION SATELLITE...";

            // --- 🛰️ CAPTURE GPS RÉELLE (CONFIANCE ADMIN/GÉRANT) ---
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;

                    console.log("🚀 Position capturée pour :", etab.nom, lat, lon);

                    // Appel direct au Backend GAS pour enregistrement définitif
                    google.script.run
                        .withSuccessHandler((res) => {
                            if (res.success) {
                                // SUCCÈS : Validation visuelle
                                btnFixerGPS.textContent = "✅ POSITION ENREGISTRÉE";
                                btnFixerGPS.classList.add('success-gps'); 
                                btnFixerGPS.style.background = "#10b981"; // Vert Sultan
                                
                                if(document.getElementById('lat-val')) document.getElementById('lat-val').textContent = lat.toFixed(5);
                                if(document.getElementById('lon-val')) document.getElementById('lon-val').textContent = lon.toFixed(5);
                                if(gpsDisplay) gpsDisplay.style.display = "block";
                                if(statusLabel) statusLabel.textContent = "COORDONNÉES SCELLÉES DANS LA SHEET";
                                
                                // Vibration de succès si mobile
                                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
                                console.log("💎 Signal envoyé aux colonnes S et T !");
                            } else {
                                // ÉCHEC : Problème côté serveur
                                btnFixerGPS.textContent = "❌ ERREUR SERVEUR";
                                btnFixerGPS.style.background = "#ef4444";
                                if(statusLabel) statusLabel.textContent = "SCELLAGE IMPOSSIBLE";
                                alert("Réponse du Sultan : " + res.msg); 
                                btnFixerGPS.disabled = false;
                            }
                        })
                        .verifierEtSauvegarderGPS(etab.id, etab.zone, lat, lon);
                },
                (err) => {
                    // Erreur si le GPS est désactivé sur l'appareil
                    btnFixerGPS.textContent = "❌ ERREUR SIGNAL";
                    btnFixerGPS.disabled = false;
                    alert("Merci d'activer la localisation sur votre appareil.");
                    if(statusLabel) statusLabel.textContent = "ÉCHEC DU CAPTEUR";
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }
});


/**
 * Gère le compte à rebours de 10 secondes.
 */
function resetInactivityTimer() {
    clearTimeout(ghostInactivityTimer); 
    ghostInactivityTimer = setTimeout(() => {
        closeGhostMenu();
    }, 10000); 
}


/**
 * Fermeture sécurisée du panneau Ghost.
 */
function closeGhostMenu() {
    const ghostMenu = document.getElementById('menu-ghost-sultan');
    if (ghostMenu) {
        ghostMenu.classList.remove('is-open');
    }
    clearTimeout(ghostInactivityTimer); 
}

/**
 * ==============================================================================
 * FIN DU MODULE GHOST - CALIBRAGE GPS INTÉGRÉ
 * ==============================================================================
 */