/**
 * 🛡️ MASTERCARTE — LOGIQUE ÉTABLISSEMENTS (V14.2 — ENRICHIE)
 * --------------------------------------------------------------------------
 * Discipline : Tour de Contrôle & Synchronisation Parc MasterCarte
 * Focus      : Gestion des statuts, Diagnostics, WiFi & Recherche Universelle
 * --------------------------------------------------------------------------
 */

const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwtd8DX6HT6RaPMV3CoXrkhtMPoITzcg_0Jo2O_u5u37OYOtUMoWQYrj1Ee6hi_SrTR/exec";

/* ============================================================
 * [0] INJECTION DES STYLES (WIFI, UI ACTIONS & ANIMATIONS)
 * ============================================================ */
const injectWifiStyle = () => {
    const style = document.createElement('style');
    style.textContent = `
        .wifi-badge-top {
            position: absolute;
            top: 10px;
            right: 12px;
            font-size: 0.9rem;
            color: #D4AF37;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.2);
            padding: 4px 6px;
            border-radius: 8px;
            line-height: 1;
            z-index: 10;
            cursor: help;
        }
        .card-header { position: relative; }
        .p-identity { padding-right: 30px; }
        .btn-mail { background: #ef4444 !important; color: white !important; }
        .btn-call { background: #10b981 !important; color: white !important; }
        
        .etab-id-badge {
            background: rgba(255,255,255,0.15);
            color: #ffffff;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.6rem;
            font-weight: 900;
            font-family: monospace;
            border: 1px solid rgba(255,255,255,0.2);
        }

        /* 🔄 ANIMATION ROUE MAJ (0.6s Sultan Speed) */
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spinning {
            animation: spin 0.6s linear infinite !important;
            transform-origin: center center !important;
            transform-box: fill-box !important;
            display: inline-block !important;
        }

        /* 🚀 ANIMATION REBOND BOUTON "+" */
        @keyframes sultanPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.4); }
            100% { transform: scale(1); }
        }
        .btn-pop {
            animation: sultanPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* 🍎 STYLE LISTES DÉROULANTES MODALE */
        .input-blueprint-group select option {
            background-color: #ffffff !important;
            color: #000000 !important;
        }
    `;
    document.head.appendChild(style);
};
injectWifiStyle();

/* ============================================================
 * [0.1] PILOTAGE DE LA ROUE MAJ
 * ============================================================ */
function startGlobalSpinner() {
    const btnSync = document.getElementById("btnSync");
    const icon = btnSync ? btnSync.querySelector('svg') : null;
    if (icon) icon.classList.add('spinning');
}

function stopGlobalSpinner() {
    const btnSync = document.getElementById("btnSync");
    const icon = btnSync ? btnSync.querySelector('svg') : null;
    if (icon) icon.classList.remove('spinning');
}

document.addEventListener("DOMContentLoaded", () => {

    /* ============================================================
     * [1] RÉFÉRENCES ÉLÉMENTS DU DOM
     * ============================================================ */
    const etabGrid      = document.getElementById("etabGrid");
    const searchInput   = document.getElementById("searchInput");
    const resultsCount  = document.getElementById("resultsCount");
    const btnSync       = document.getElementById("btnSync");
    const btnBack       = document.getElementById("btnBack");
    
    const btnLoc        = document.getElementById("btnLoc");
    const locPanel      = document.getElementById("locPanel");
    const locLabel      = document.getElementById("locLabel");
    
    const btnType       = document.getElementById("btnType");
    const typePanel     = document.getElementById("typePanel");
    const typeLabel     = document.getElementById("typeLabel");

    const statusBtns    = document.querySelectorAll(".seg-status");
    const timingBtns    = document.querySelectorAll(".seg-timing");
    
   /* ============================================================
     * [1.1] GESTION DES PUCES "SULTAN" (DÉLÉGATION & FORMAT BD)
     * ============================================================ */
    const dayWrapper = document.getElementById('daySelectionWrapper');
    if (dayWrapper) {
        dayWrapper.addEventListener('click', (e) => {
            const chip = e.target.closest('.day-chip');
            if (!chip) return;

            e.stopPropagation();
            // 1. Toggle visuel (Or Sultan)
            chip.classList.toggle('is-selected');
            
            // 2. Récupérer tous les jours cochés
            const selected = Array.from(dayWrapper.querySelectorAll('.day-chip.is-selected'))
                                  .map(c => c.getAttribute('data-day'));
            
            // 3. Mettre à jour le champ caché pour le payload (Séparateur "-" pour la BD)
            const inputFermeture = document.getElementById('newEtabOff');
            if (inputFermeture) {
                // 🚀 On joint par "-" pour correspondre à ton moteur de diagnostic
                inputFermeture.value = selected.length > 0 ? selected.join('-') : "Aucun";
            }
            console.log("📍 Fermetures scellées (Format BD) :", inputFermeture.value);
        });
    }

    /* ============================================================
     * [2] ÉTAT GLOBAL (STATE MANAGEMENT)
     * ============================================================ */
    let DATA_ETABS = [];
    let currentFilters = {
        search: "",
        loc: "all",
        type: "all",
        status: "actif",
        timing: "all"
    };

    /* ============================================================
     * [3] CHARGEMENT DES DONNÉES (FETCH API)
     * ============================================================ */
    async function loadEtablissements() {
        startGlobalSpinner();
        if (etabGrid) {
            etabGrid.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Synchronisation MasterCarte Gabon...</p>
                </div>`;
        }
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${GAS_WEBAPP_URL}?action=get_etablissements&_t=${timestamp}`);
            const result = await response.json();
            if (result.success) {
                DATA_ETABS = result.data;
                generateDynamicFilters();
                applyFilters();
            } else {
                showError("Erreur API : " + result.message);
            }
        } catch (err) {
            showError("Serveur MasterCarte injoignable.");
        } finally {
            setTimeout(stopGlobalSpinner, 600);
        }
    }

    function showError(msg) {
        if (etabGrid) etabGrid.innerHTML = `<div class="error-state">⚠️ ${msg}</div>`;
    }

    /* ============================================================
     * [4] GÉNÉRATION DYNAMIQUE DES FILTRES
     * ============================================================ */
    function generateDynamicFilters() {
        const secteurs = [...new Set(DATA_ETABS.map(e => e.zone).filter(Boolean))].sort();
        const types = [...new Set(DATA_ETABS.map(e => e.categorie).filter(Boolean))].sort();

        locPanel.innerHTML = `<button class="cat-item ${currentFilters.loc === 'all' ? 'is-selected' : ''}" type="button" data-loc="all">Tous</button>`;
        secteurs.forEach(zone => {
            const btn = document.createElement("button");
            btn.className = `cat-item ${currentFilters.loc === zone ? 'is-selected' : ''}`;
            btn.type = "button";
            btn.textContent = zone;
            btn.onclick = (e) => {
                e.stopPropagation();
                currentFilters.loc = zone;
                locLabel.textContent = zone;
                locPanel.hidden = true;
                updateFilterUI(locPanel, btn);
                applyFilters();
            };
            locPanel.appendChild(btn);
        });

        typePanel.innerHTML = `<button class="cat-item ${currentFilters.type === 'all' ? 'is-selected' : ''}" type="button" data-type="all">Tous</button>`;
        types.forEach(cat => {
            const btn = document.createElement("button");
            btn.className = `cat-item ${currentFilters.type === cat ? 'is-selected' : ''}`;
            btn.type = "button";
            btn.textContent = cat;
            btn.onclick = (e) => {
                e.stopPropagation();
                currentFilters.type = cat;
                typeLabel.textContent = cat;
                typePanel.hidden = true;
                updateFilterUI(typePanel, btn);
                applyFilters();
            };
            typePanel.appendChild(btn);
        });

        locPanel.querySelector('[data-loc="all"]').onclick = (e) => {
            e.stopPropagation();
            currentFilters.loc = "all";
            locLabel.textContent = "Tous";
            locPanel.hidden = true;
            updateFilterUI(locPanel, locPanel.querySelector('[data-loc="all"]'));
            applyFilters();
        };

        typePanel.querySelector('[data-type="all"]').onclick = (e) => {
            e.stopPropagation();
            currentFilters.type = "all";
            typeLabel.textContent = "Tous";
            typePanel.hidden = true;
            updateFilterUI(typePanel, typePanel.querySelector('[data-type="all"]'));
            applyFilters();
        };
    }

    function updateFilterUI(panel, selectedBtn) {
        panel.querySelectorAll(".cat-item").forEach(b => b.classList.remove("is-selected"));
        selectedBtn.classList.add("is-selected");
    }

    /* ============================================================
     * [5] GESTION DES ÉVÉNEMENTS & RECHERCHE
     * ============================================================ */
    btnLoc.addEventListener("click", (e) => {
        e.stopPropagation();
        locPanel.hidden = !locPanel.hidden;
        typePanel.hidden = true;
    });

    btnType.addEventListener("click", (e) => {
        e.stopPropagation();
        typePanel.hidden = !typePanel.hidden;
        locPanel.hidden = true;
    });

    document.addEventListener("click", (e) => {
        if (!locPanel.hidden && !locPanel.contains(e.target) && e.target !== btnLoc) locPanel.hidden = true;
        if (!typePanel.hidden && !typePanel.contains(e.target) && e.target !== btnType) typePanel.hidden = true;
    });

    statusBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            statusBtns.forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            currentFilters.status = btn.getAttribute("data-status");
            applyFilters();
        });
    });

    timingBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            timingBtns.forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            currentFilters.timing = btn.getAttribute("data-timing");
            applyFilters();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentFilters.search = e.target.value.toLowerCase().trim();
            applyFilters();
        });
    }

    /* ============================================================
     * [6] MOTEUR DE FILTRAGE GLOBAL
     * ============================================================ */
    function applyFilters() {
        const joursSemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const nomJourActuel = joursSemaine[new Date().getDay()].toLowerCase();

        const filteredData = DATA_ETABS.filter(etab => {
            const searchStr = `${etab.nom} ${etab.nom_gerant} ${etab.zone} ${etab.id}`.toLowerCase();
            const nameMatch = searchStr.includes(currentFilters.search);
            
            const statusMatch = etab.statut.toLowerCase() === currentFilters.status.toLowerCase();
            const locMatch = (currentFilters.loc === "all") || (etab.zone === currentFilters.loc);
            const typeMatch = (currentFilters.type === "all") || (etab.categorie === currentFilters.type);

            let timingMatch = true;
            if (currentFilters.timing === "open") {
                const joursFermes = (etab.jour_fermeture || "").split(/[,_-]/).map(j => j.trim().toLowerCase());
                const estFermeAujourdhui = joursFermes.includes(nomJourActuel);
                timingMatch = (etab.statut.toLowerCase() === "actif" && !estFermeAujourdhui);
            }
            return nameMatch && statusMatch && locMatch && typeMatch && timingMatch;
        });

        renderCards(filteredData);
    }

    /* ============================================================
     * [7] RENDU DES CARTES (UI ÉTABLISSEMENTS)
     * ============================================================ */
    function renderCards(data) {
        if (!etabGrid) return;
        etabGrid.innerHTML = "";

        const joursSemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const nomJourActuel = joursSemaine[new Date().getDay()].toLowerCase();

        data.forEach(item => {
            const isActif = item.statut.toLowerCase() === "actif";
            const joursFermes = (item.jour_fermeture || "").split(/[,_-]/).map(j => j.trim().toLowerCase());
            const estFermeCeJour = joursFermes.includes(nomJourActuel);
            const isOpenNow = isActif && !estFermeCeJour;

            const actionLabel = isActif ? "DÉSACTIVER" : "ACTIVER";
            const actionClass = isActif ? "is-actif" : "is-inactif";

            const hasWifi = item.wifi_name && item.wifi_name.trim() !== "";
            const wifiIcon = hasWifi ? `<div class="wifi-badge-top" title="Configuré: ${item.wifi_name}">📶</div>` : "";

            const mailtoLink = `mailto:${item.contact_email || ''}`;
            const secureSmartUrl = `smartcarte.html?id=${item.id}`;

            const card = document.createElement("div");
            card.className = `product-card etab-card ${!isActif ? 'card-disabled' : ''}`;

            card.innerHTML = `
                <div class="card-header">
                    <span class="status-dot ${item.statut.toLowerCase()}"></span>
                    <div class="p-identity">
                        <div class="p-name">${item.nom}</div>
                        <div class="p-sub-info">${item.zone} • ${item.categorie}</div>
                    </div>
                    ${wifiIcon}
                </div>

                <div class="diagnostic-row-inline">
                    <div class="diag-badge badge-scans hot">
                        <span class="count">${Math.floor(Math.random() * 80) + 10}</span>
                        <span class="label">SCANS</span>
                    </div>
                    <div class="diag-badge ${isOpenNow ? 'badge-open' : 'badge-closed'}">
                        ${isOpenNow ? 'OUVERT' : 'FERMÉ'}
                    </div>
                    <button class="diag-badge btn-toggle-inline ${actionClass}" onclick="toggleEtabStatus('${item.id}')">
                        ${actionLabel}
                    </button>
                </div>

                <div class="gerant-info-box">
                    <div class="gerant-name">👤 ${item.nom_gerant || 'Non assigné'}</div>
                    <div class="gerant-email">✉️ ${item.contact_email || 'Non renseigné'}</div>
                </div>

                <div class="action-grid">
                    <a href="tel:${item.contact_tel}" class="btn-smart btn-call">
                        <span class="btn-label">APPELER</span>
                        <span class="btn-tel-value">${item.contact_tel || 'N/A'}</span>
                    </a>
                    <a href="${mailtoLink}" class="btn-smart btn-mail">MAIL</a>
                </div>

                <div class="status-row-admin">
                    <div class="etab-card-actions" style="display: flex; gap: 8px; align-items: center; flex: 1;">
                        <span class="etab-id-badge">ID:${item.id}</span>
                        <button class="btn-view-carte" onclick="window.open('${secureSmartUrl}', '_blank')">smartcarte</button>
                        <button class="btn-view-carte" style="color: #D4AF37; font-weight:900;" onclick="handleEdit('${item.id}')">assistance</button>
                    </div>
                    <button class="btn-menu-admin" onclick="handleEdit('${item.id}')">•••</button>
                </div>
            `;
            etabGrid.appendChild(card);
        });

        if (resultsCount) resultsCount.innerHTML = data.length;
    }

    /* ============================================================
     * [8] ACTIONS GLOBALES (WINDOW ACCESSIBLE)
     * ============================================================ */
    window.toggleEtabStatus = async function(id) {
        startGlobalSpinner();
        const etab = DATA_ETABS.find(e => String(e.id) === String(id));
        if (!etab) { stopGlobalSpinner(); return; }

        const oldStatus = etab.statut;
        const newStatus = oldStatus.toLowerCase() === "actif" ? "Inactif" : "Actif";
        etab.statut = newStatus;
        applyFilters();

        try {
            await fetch(GAS_WEBAPP_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({ action: "update_etab_status", id: id, newStatus: newStatus })
            });
            stopGlobalSpinner();
        } catch (err) {
            etab.statut = oldStatus;
            applyFilters();
            stopGlobalSpinner();
        }
    };

    if (btnSync) btnSync.addEventListener("click", loadEtablissements);
    if (btnBack) btnBack.addEventListener("click", () => window.location.href = "admin_dashboard.html");

    loadEtablissements();
});

/* ============================================================
 * [9] LOGIQUE MODALE & SYNC (AJOUT PARTENAIRE - V14.6)
 * ============================================================ */
let modalTimer; 

window.openCreateModal = async function() {
    const modal = document.getElementById('createEtabModal');
    const btnPlus = document.getElementById('btnOpenCreate');

    if (modal) {
        // 🚀 Effet Pop Sultan sur le bouton +
        if (btnPlus) {
            btnPlus.classList.add('btn-pop');
            setTimeout(() => btnPlus.classList.remove('btn-pop'), 300);
        }

        // 🔄 Rotation de la roue MAJ pendant la synchro
        startGlobalSpinner(); 

        // 🛰️ SYNC GAS : Chargement des configs (Zones/Catégories)
        const loadPromise = loadModalConfig();
        const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));

        await Promise.all([loadPromise, delayPromise]);

        // ✅ Affichage de la modale
        stopGlobalSpinner();
        modal.classList.add('is-visible');
        resetModalTimer(); 
    }
};

window.closeCreateModal = function() {
    const modal = document.getElementById('createEtabModal');
    if (modal) {
        // 1. Fermeture visuelle
        modal.classList.remove('is-visible');
        clearTimeout(modalTimer);

        // 2. ♻️ RESET DES PUCES SULTAN (Dorées -> Grises)
        if (typeof resetDayChips === "function") {
            resetDayChips();
        } else {
            document.querySelectorAll('.day-chip').forEach(c => c.classList.remove('is-selected'));
            const inputFermeture = document.getElementById('newEtabOff');
            if (inputFermeture) inputFermeture.value = "Aucun";
        }

        // 3. ♻️ NETTOYAGE CHIRURGICAL DES INPUTS
        // On cible tous les inputs (y compris newGerantFirstName et newGerantLastName)
        const inputs = modal.querySelectorAll('input:not([type="button"])');
        inputs.forEach(i => {
            i.value = "";
        });
        
        // 4. ♻️ RESET DES SÉLECTEURS (Catégorie / Zone)
        const selects = modal.querySelectorAll('select');
        selects.forEach(s => s.selectedIndex = 0);

        console.log("♻️ Modale relationnelle (A00 / G-A00) réinitialisée et scellée.");
    }
};

function resetModalTimer() {
    clearTimeout(modalTimer);
    modalTimer = setTimeout(() => {
        const inputs = document.querySelectorAll('#createEtabModal input, #createEtabModal select');
        let isEmpty = true;
        for (let input of inputs) {
            if (input.tagName === "SELECT") {
                if (input.selectedIndex > 0) { isEmpty = false; break; }
            } else {
                if (input.value.trim() !== "" && input.id !== "newEtabOff") { 
                    isEmpty = false; break; 
                }
            }
        }
        if (isEmpty) {
            console.log("💤 Inactivité : Fermeture de la tour de contrôle.");
            closeCreateModal();
        } else {
            resetModalTimer(); // Relance si l'utilisateur a commencé à saisir
        }
    }, 45000); // 45 secondes de réflexion Sultan
}

/**
 * 🛰️ CHARGEMENT DES CONFIGS DEPUIS GOOGLE APPS SCRIPT
 */
async function loadModalConfig() {
    const catSelect = document.getElementById('newEtabCat');
    const zoneSelect = document.getElementById('newEtabZone');
    if (!catSelect || !zoneSelect) return;

    // État d'attente visuel
    catSelect.innerHTML = '<option>Sync...</option>';
    zoneSelect.innerHTML = '<option>Sync...</option>';

    try {
        // Appel au backend GAS
        const response = await fetch(`${GAS_WEBAPP_URL}?action=get_config`);
        const result = await response.json();

        if (result.success) {
            // Remplissage Catégories
            catSelect.innerHTML = '<option value="" disabled selected>Choisir une catégorie...</option>';
            result.categories.forEach(cat => {
                catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
            });

            // Remplissage Secteurs (Zones)
            zoneSelect.innerHTML = '<option value="" disabled selected>Choisir un secteur...</option>';
            result.secteurs.forEach(zone => {
                zoneSelect.innerHTML += `<option value="${zone}">${zone}</option>`;
            });
            console.log("🛰️ Config modale chargée.");
        }
    } catch (err) {
        console.error("❌ Erreur Sync GAS :", err);
        catSelect.innerHTML = '<option>Erreur</option>';
        zoneSelect.innerHTML = '<option>Erreur</option>';
    }
}

/* ============================================================
 * [14] AUTO-REFRESH & UTILS
 * ============================================================ */
window.handleEdit = function(id) { 
    window.open(`gerant_edit.html?id=${id}`, '_blank');
};

// Rafraîchissement automatique au retour sur l'onglet
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        const etabGrid = document.getElementById("etabGrid");
        // On vérifie qu'on n'est pas déjà en train de charger pour éviter les boucles
        if (etabGrid && !etabGrid.querySelector('.loading-state')) {
            console.log("♻️ Retour : Refresh total.");
            location.reload(); 
        }
    }
});


/* ============================================================
 * GESTION DES PUCES "SULTAN" (MULTI-SÉLECTION JOURS)
 * ============================================================ */
document.querySelectorAll('.day-chip').forEach(chip => {
    chip.onclick = function(e) {
        e.stopPropagation();
        
        // 1. Toggle la classe visuelle
        this.classList.toggle('is-selected');
        
        // 2. Récupérer tous les jours cochés
        const selected = Array.from(document.querySelectorAll('.day-chip.is-selected'))
                              .map(c => c.getAttribute('data-day'));
        
        // 3. Mettre à jour le champ caché pour le payload
        const inputFermeture = document.getElementById('newEtabOff');
        if (inputFermeture) {
            inputFermeture.value = selected.length > 0 ? selected.join(', ') : "Aucun";
        }
        
        console.log("📍 Fermetures sélectionnées :", inputFermeture.value);
    };
});

/* Fonction pour réinitialiser les puces (à appeler à la fermeture/ouverture) */
function resetDayChips() {
    document.querySelectorAll('.day-chip').forEach(c => c.classList.remove('is-selected'));
    const inputFermeture = document.getElementById('newEtabOff');
    if (inputFermeture) inputFermeture.value = "Aucun";
}

/* ============================================================
 * [15] VALIDATION FINALE & ENVOI AU SERVEUR (SULTAN SPEED)
 * ============================================================ */
window.submitNewPartner = async function() {
    const btn = document.getElementById('btnValidateCreate');
    
    // 🚀 PAYLOAD RELATIONNEL : Prénom et Nom séparés
    const payload = {
        action: "create_partner",
        nom: document.getElementById('newEtabName').value.trim(),
        image: document.getElementById('newEtabImg').value.trim(),
        categorie: document.getElementById('newEtabCat').value,
        zone: document.getElementById('newEtabZone').value,
        
        // Nouveaux champs pour la base UTILISATEURS
        gerant_prenom: document.getElementById('newGerantFirstName').value.trim(),
        gerant_nom: document.getElementById('newGerantLastName').value.trim(),
        
        // 🛡️ SUBTILITÉ SULTAN : Séparation Email Perso (Login) et Email Pro
        email_perso: document.getElementById('newGerantEmailPerso').value.trim(),
        
        tel: document.getElementById('newGerantTel').value.trim(),
        email: document.getElementById('newEtabEmail').value.trim(), // Email Pro public
        fermeture: document.getElementById('newEtabOff').value
    };

    // --- GESTION DES ERREURS DANS LE BOUTON (SANS ALERT) ---
    // Vérification stricte du Nom ET du Prénom du gérant + Email de connexion
    if (!payload.nom || !payload.zone || !payload.categorie || !payload.gerant_nom || !payload.gerant_prenom || !payload.email_perso) {
        if (btn) {
            const originalText = btn.innerHTML;
            btn.style.background = "#ef4444"; // Rouge Sultan Erreur
            btn.innerHTML = "INFOS & EMAIL PERSO REQUIS ⚠️";
            setTimeout(() => {
                btn.style.background = ""; 
                btn.innerHTML = originalText;
            }, 2500);
        }
        return;
    }

    // ⏳ ÉTAT : CHARGEMENT (VISUEL SULTAN)
    startGlobalSpinner();
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>SÉCURISATION DES DONNÉES... <span class="spinning" style="display:inline-block;">⌛</span></span>`;
        btn.style.opacity = "0.7";
        btn.style.letterSpacing = "2px";
    }

    try {
        const response = await fetch(GAS_WEBAPP_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            // --- SUCCÈS DANS LE BOUTON (Affiche G-A00) ---
            if (btn) {
                btn.style.background = "#10b981"; // Vert Sultan Succès
                btn.innerHTML = `<span>GÉRANT ${result.gerantId} ACTIVÉ ! ✅</span>`;
            }
            
            setTimeout(() => {
                stopGlobalSpinner();
                closeCreateModal();
                location.reload(); 
            }, 3000);
        } else {
            throw new Error(result.message);
        }

    } catch (err) {
        stopGlobalSpinner();
        if (btn) {
            btn.disabled = false;
            btn.style.background = "#ef4444";
            btn.innerHTML = "ERREUR RÉSEAU ❌";
            setTimeout(() => {
                btn.innerHTML = "ACTIVER LE PARTENAIRE";
                btn.style.background = "";
                btn.style.opacity = "1";
            }, 3000);
        }
        console.error("Détails Erreur:", err);
    }
};