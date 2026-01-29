/**
 * 🛡️ MASTERCARTE — SMARTCARTE CLIENT (V7.8)
 * --------------------------------------------------------------------------
 * Discipline : Global Local Search & Fixation Publicitaire
 * Focus      : Moteur transversal & Synchronisation complète de l'entête
 * Inclus     : Module Wi-Fi Sultan (Badge Noir & Or)
 * CORRECTIF  : Détection dynamique de l'ID & Anti-écran blanc
 * --------------------------------------------------------------------------
 */

// Configuration API Backend
const GAS_URL = "https://script.google.com/macros/s/AKfycbw_Tuv0b7u-VKtQy9E8HhlmHTpzxPT5trc1Qe_h69xd5yrG-EvwZ-7VMc_6vGSYGprM/exec";

document.addEventListener('DOMContentLoaded', () => {

    /* ============================================================
     * [0] RÉFÉRENCES ÉLÉMENTS DU DOM & CACHE
     * ============================================================ */
    const mainCatalogue = document.getElementById('mainCatalogue');
    const categoryNav = document.getElementById('categoryNav');
    const searchInput = document.getElementById('searchInput');
    let fullDataCache = null;

    /* ============================================================
     * [1] SYNC IDENTITÉ (NOM + SOUS-TITRE)
     * ============================================================ */
    function syncHeader(nomEtab) {
        const titleEl = document.getElementById('mainEtabTitle');
        const subEl = document.getElementById('subGerantName');

        if (nomEtab && titleEl) titleEl.textContent = nomEtab.toUpperCase();
        if (subEl) subEl.textContent = "Menu Digital Officiel";
    }

    /* ============================================================
     * [2] RÉCUPÉRATION INITIALE (DIAGNOSTIC INTÉGRÉ)
     * ============================================================ */
    async function fetchSnapshot() {
        // 1. Priorité Sultan : On cherche l'ID dans l'URL (?id=xxx), sinon on prend le LocalStorage
        const urlParams = new URLSearchParams(window.location.search);
        const etabIdFromUrl = urlParams.get('id');
        const etabIdLocal = localStorage.getItem("etablissement_id");

        const etabId = etabIdFromUrl || etabIdLocal;

        // --- SÉCURITÉ : ID MANQUANT ---
        if (!etabId) {
            console.error("Aucun établissement détecté.");
            if (mainCatalogue) {
                mainCatalogue.innerHTML = `
                    <div style="color:white; text-align:center; margin-top:50px; padding:20px; font-family:sans-serif;">
                        <h2 style="color:#D4AF37;">ID Établissement introuvable</h2>
                        <p>Veuillez scanner un QR Code officiel ou passer par le Dashboard.</p>
                    </div>`;
            }
            return;
        }

        try {
            // A. Chargement de l'identité & WiFi
            const respEtab = await fetch(`${GAS_URL}?action=get_etablissements`);
            const resEtab = await respEtab.json();

            if (resEtab.success && resEtab.data) {
                const monEtab = resEtab.data.find(e => String(e.id).trim() === String(etabId).trim());
                if (monEtab) {
                    syncHeader(monEtab.nom);
                    initWifiSmartCarte(monEtab);
                }
            }

            // B. Chargement du catalogue (Snapshot)
            const resp = await fetch(`${GAS_URL}?action=get_snapshot&etabId=${etabId}`);
            const res = await resp.json();

            if (res.success && res.data) {
                fullDataCache = res.data;

                // --- SÉCURITÉ : CATALOGUE VIDE ---
                if (Object.keys(fullDataCache).length === 0) {
                    mainCatalogue.innerHTML = `
                        <div style="color:white; text-align:center; margin-top:50px; font-family:sans-serif;">
                            <p>Aucun produit disponible pour le moment.</p>
                        </div>`;
                } else {
                    renderSnapshotMenu(fullDataCache);
                }
            } else {
                mainCatalogue.innerHTML = `<p style="color:white; text-align:center; margin-top:50px;">Erreur serveur : ${res.message}</p>`;
            }

        } catch (e) {
            console.error("Erreur Sync", e);
            mainCatalogue.innerHTML = `
                <div style="color:white; text-align:center; margin-top:50px; font-family:sans-serif;">
                    <h2 style="color:#ef4444;">⚠️ Connexion impossible</h2>
                    <p>Le serveur MasterCarte ne répond pas. Vérifiez votre connexion.</p>
                </div>`;
        }
    }

    /* ============================================================
     * [3] LE MOTEUR "SANS FRONTIÈRES" (SEARCH)
     * ============================================================ */
    if (searchInput) {
        searchInput.oninput = () => {
            if (!fullDataCache) return;
            const term = searchInput.value.toLowerCase().trim();
            if (term === "") {
                const activeBtn = document.querySelector('.menu-item.is-active') || document.querySelector('.menu-item');
                if (activeBtn) {
                    const catName = activeBtn.textContent;
                    displaySnapshotCategory(catName, fullDataCache[catName]);
                }
                return;
            }
            let crossResults = [];
            Object.keys(fullDataCache).forEach(cat => {
                const matches = fullDataCache[cat].filter(p => p.nom.toLowerCase().includes(term));
                crossResults = [...crossResults, ...matches];
            });
            renderGlobalResults(crossResults, term);
        };
    }

    /* ============================================================
     * [4] RENDU DES RÉSULTATS GLOBAUX
     * ============================================================ */
    function renderGlobalResults(produits, term) {
        mainCatalogue.innerHTML = `
            <div class="promo-banner-wrap">
                <div class="promo-banner-inner" style="height:80px; background: linear-gradient(90deg, #d4af37, #f1c40f); border: none;">
                    <span style="color:#000; font-weight:900; font-size:0.85rem;">✨ PARTENAIRES SULTAN</span>
                </div>
            </div>
            <h2 class="cat-title-divider" style="color:#D4AF37;">🔍 RÉSULTATS : ${term.toUpperCase()}</h2>
            <div class="products-grid">
                ${produits.map(p => renderCard(p)).join('')}
            </div>
            ${produits.length === 0 ? '<p style="color:white; text-align:center; margin-top:30px;">Aucun produit trouvé...</p>' : ''}
            <div class="promo-banner-wrap" style="margin-top:30px;"><div class="promo-banner-inner"><span>✨ PARTENAIRES SULTAN</span></div></div>
        `;
    }

  /* ============================================================
     * [5] CRÉATION DE CARTE UNIQUE (CORRECTIF IMAGES INCLUS)
     * ============================================================ */
    function renderCard(p) {
        const fullNom = p.nom.toUpperCase();
        const volMatch = fullNom.match(/(\d+\s?(CL|L|ML|BTLE|CAN))$/i);
        const nomSansVol = volMatch ? fullNom.replace(volMatch[0], '').trim() : fullNom;
        const volumeLabel = volMatch ? volMatch[0] : '';

        // --- CORRECTIF : GESTION DU SOUS-DOSSIER IMAGES ---
        const imagePath = (p.image && !p.image.startsWith('http')) 
            ? `images/${p.image}` 
            : (p.image || 'images/placeholder.png');

        return `
            <article class="product-card">
                <div class="p-name">${nomSansVol} ${volumeLabel ? `<span class="p-volume">${volumeLabel}</span>` : ''}</div>
                <div class="p-img">
                    <img src="${imagePath}" loading="lazy" onerror="this.src='images/placeholder.png';">
                </div>
                <div class="price-tag-smart">
                    <span class="price-val">${Number(p.prix_vente).toLocaleString('fr-FR')}</span>
                    <span class="price-unit">FCFA</span>
                </div>
            </article>`;
    }

    /* ============================================================
     * [6] AFFICHAGE PAR CATÉGORIE
     * ============================================================ */
    function displaySnapshotCategory(name, produits) {
        if (!produits) return;
        mainCatalogue.innerHTML = `
            <div class="promo-banner-wrap">
                <div class="promo-banner-inner" style="height:80px; background: linear-gradient(90deg, #d4af37, #f1c40f);">
                    <span style="color:#000; font-weight:900;">✨ PARTENAIRES SULTAN</span>
                </div>
            </div>
            <h2 class="cat-title-divider">${name}</h2>
            <div class="products-grid">${produits.map(p => renderCard(p)).join('')}</div>
            <div class="promo-banner-wrap" style="margin-top:20px;">
                <div class="promo-banner-inner"><span>✨ PARTENAIRES SULTAN</span></div>
            </div>
        `;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /* ============================================================
     * [7] GÉNÉRATION DU MENU DE NAVIGATION
     * ============================================================ */
    function renderSnapshotMenu(snapshot) {
        const categories = Object.keys(snapshot).sort();
        categoryNav.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = "menu-item";
            btn.textContent = cat;
            btn.onclick = () => {
                document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                displaySnapshotCategory(cat, snapshot[cat]);
                if (searchInput) searchInput.value = "";
            };
            categoryNav.appendChild(btn);
        });
        const defaultBtn = Array.from(document.querySelectorAll('.menu-item')).find(b => b.textContent === "BIERES") || document.querySelector('.menu-item');
        if (defaultBtn) defaultBtn.click();
    }

    /* ============================================================
     * [8] REFRESH AUTO (VISIBILITY CHANGE)
     * ============================================================ */
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") fetchSnapshot();
    });

    /* ============================================================
     * [9] MODULE WIFI SULTAN (BADGE NOIR ÉPURÉ)
     * ============================================================ */
    function initWifiSmartCarte(monEtab) {
        const wifiSection = document.getElementById('wifiSection');
        const btnGetWifi = document.getElementById('btnGetWifi');
        const wifiNetName = document.getElementById('wifiNetName');
        const wifiPassVal = document.getElementById('wifiPassVal');

        if (!wifiSection || !btnGetWifi) return;

        const isAvailable = monEtab.wifi_name && String(monEtab.locked).toLowerCase().trim() !== "oui";

        if (isAvailable) {
            wifiSection.style.display = 'flex';
            if (wifiNetName) wifiNetName.textContent = monEtab.wifi_name.toUpperCase();
            if (wifiPassVal) wifiPassVal.textContent = monEtab.wifi_pass || "1234";

            btnGetWifi.onclick = () => {
                const pass = monEtab.wifi_pass || "";
                navigator.clipboard.writeText(pass).then(() => {
                    const originalPass = wifiPassVal.textContent;
                    wifiPassVal.textContent = "COPIÉ";
                    wifiPassVal.style.color = "#D4AF37";
                    setTimeout(() => {
                        wifiPassVal.textContent = originalPass;
                        wifiPassVal.style.color = "";
                    }, 2000);
                });
            };
        } else {
            wifiSection.style.display = 'none';
        }
    }

    /* ============================================================
     * [10] UTILITAIRE TOAST SULTAN
     * ============================================================ */
    function showSultanToast(text) {
        const toast = document.createElement('div');
        toast.className = "wifi-toast";
        toast.textContent = text;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    // Lancement de la récupération des données
    fetchSnapshot();
});