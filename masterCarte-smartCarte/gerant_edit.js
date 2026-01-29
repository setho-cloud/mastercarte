/******************************************************************************
 * 🛡️ MASTERCARTE — LOGIQUE COMPLÈTE GÉRANT (V8.1 — RESTAURATION FILTRES)
 * --------------------------------------------------------------------------
 * @version : Production Finale - FILTRE AUTO-LIBÉRÉ & DESIGN RESPONSIVE
 ******************************************************************************/

const GAS_URL = "https://script.google.com/macros/s/AKfycbyhwUiWxbPbzEsNDNtq7DtCE13Q7zqd-iSqXpdw1VhYk5PoUa_4DSqrhBOkYfdHRl8/exec";

document.addEventListener('DOMContentLoaded', async () => {

    /* ============================================================
     * [0.1] SERVICE WORKER
     * ============================================================ */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log("🛡️ Gardien Sultan activé."))
            .catch(err => console.error("❌ Erreur Gardien", err));
    }

   /* ============================================================
     * [0] RÉCUPÉRATION DES ÉLÉMENTS DU DOM
     * ============================================================ */
    const storedUser = localStorage.getItem("mc_user");
    const urlParams = new URLSearchParams(window.location.search);
    const controlId = urlParams.get('id'); // ID envoyé par l'admin

    if (!storedUser && !controlId) { window.location.href = "login.html"; return; }

    const userData = storedUser ? JSON.parse(storedUser) : { prenom: "ADMIN", nom: "MASTER", id: "ADMIN" };
    const myIdGerant = userData.id;

    const mainCatalogue = document.getElementById('mainCatalogue');
    const categoryLabel = document.getElementById('categoryLabel');
    const categoryPanel = document.getElementById('categoryPanel');
    const btnCategory = document.getElementById('btnCategory');
    const btnSync = document.querySelector('.btn-sync');
    const dynamicFilterList = document.getElementById('dynamicFilterList');
    const searchInput = document.getElementById('searchInput');
    const btnSortPrice = document.getElementById('btnSortPrice');
    const sortLabel = document.getElementById('sortLabel');
    const countDisplay = document.getElementById('resultsCount');
    const syncStatusLabel = document.getElementById('syncStatusLabel');

    const wifiSSID = document.getElementById('wifiSSID');
    const wifiPass = document.getElementById('wifiPass');
    const btnLockWifi = document.getElementById('btnLockWifi');
    const wifiLockIcon = document.getElementById('wifiLockIcon');
    const btnSaveWifi = document.getElementById('btnSaveWifi');

    const btnFilterNew = document.getElementById('btnFilterNew');
    const countNewSpan = document.getElementById('countNew');
    let filterNewActive = false;

    const btnFilterRupture = document.getElementById('btnFilterRupture');
    const countRuptureSpan = document.getElementById('countRupture');
    let filterRuptureActive = false;

    const btnFilterBlocked = document.getElementById('btnFilterBlocked');
    const countBlockedSpan = document.getElementById('countBlocked');
    let filterBlockedActive = false;

    const btnFilterActiveOnly = document.getElementById('btnFilterActiveOnly');
    let filterActiveOnly = false;

    let currentEtabId = null;
    let isAscending = true;
    let rawData = [];

    // --- SOUDURE MASTERCARTE QR ---
    window.currentEtab = null; // Contiendra l'objet complet pour qrcode.js

    /* ============================================================
     * [1] LOGIQUE DE RÉINITIALISATION ET UI WIFI
     * ============================================================ */
    function resetAllFilters() {
        if (searchInput) searchInput.value = "";
        isAscending = true;
        if (sortLabel) sortLabel.textContent = "Prix";
        if (rawData.length > 0) renderCatalogue(rawData);
    }

    function updateHeaderWifiUI(ssid, locked) {
        const titleEl = document.getElementById('mainEtabTitle');
        if (!titleEl) return;
        const currentName = localStorage.getItem("nom_etablissement") || "ÉTABLISSEMENT";
        titleEl.textContent = currentName;

        const hasWifi = ssid && ssid.trim() !== "";
        const isLocked = String(locked).toLowerCase().trim() === "oui";
        const bgColor = isLocked ? "#ef4444" : "#10b981";

        const kebabBtn = document.getElementById('btnToggleSettings');
        if (kebabBtn) {
            let indicator = document.getElementById('kebabWifiIndicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.id = 'kebabWifiIndicator';
                kebabBtn.parentNode.insertBefore(indicator, kebabBtn);
            }
            if (hasWifi) {
                indicator.style.cssText = `background: ${bgColor}; color: white; padding: 3px 5px; border-radius: 6px; font-size: 0.60rem; font-weight: 900; margin-left: 10px; margin-right: 15px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${bgColor}88; vertical-align: middle;`;
                indicator.innerHTML = `📶 ${isLocked ? 'WIFI OFF' : 'WIFI ON'}`;
            } else { indicator.style.display = "none"; }
        }
    }

   /* ============================================================
 * [2] INITIALISATION (ID UNIVERSEL)
 * ============================================================ */
if (btnSync) btnSync.classList.add('is-spinning');

try {
    const response = await fetch(`${GAS_URL}?action=get_etablissements`);
    const result = await response.json();
    if (result.success && result.data) {
        let monEtab;
        if (controlId) {
            monEtab = result.data.find(etab => String(etab.id).trim() === String(controlId).trim());
        } else {
            monEtab = result.data.find(etab => String(etab.id_gerant).trim() === String(myIdGerant).trim());
        }

        if (monEtab) {
            // --- SOUDURE MASTERCARTE ---
            currentEtabId = monEtab.id;
            window.currentEtab = monEtab; // 👈 LA MAGIE EST ICI
            
            localStorage.setItem("nom_etablissement", monEtab.nom.toUpperCase());
            localStorage.setItem("etablissement_id", monEtab.id);
            document.getElementById('mainEtabTitle').textContent = monEtab.nom.toUpperCase();
            
            const subTitleEl = document.getElementById('subGerantName');
            if (subTitleEl) {
                if (controlId) {
                    subTitleEl.textContent = "ASSISTANCE ADMIN";
                    subTitleEl.style.color = "#D4AF37"; subTitleEl.style.fontWeight = "900";
                } else { subTitleEl.textContent = `Gérant : ${userData.prenom} ${userData.nom}`; }
            }

            if (wifiSSID) wifiSSID.value = monEtab.wifi_name || "";
            if (wifiPass) wifiPass.value = monEtab.wifi_pass || "";
            if (wifiLockIcon) wifiLockIcon.textContent = String(monEtab.locked).toLowerCase().trim() === "oui" ? '🔒' : '🔓';

            updateHeaderWifiUI(monEtab.wifi_name, monEtab.locked);
            await fetchCarte();
            processOfflineQueue();
        } else { if (btnSync) btnSync.classList.remove('is-spinning'); }
    }
} catch (e) { console.error("Erreur Init", e); if (btnSync) btnSync.classList.remove('is-spinning'); }
    /* ============================================================
     * [3] RÉCUPÉRATION DES BOISSONS
     * ============================================================ */
    async function fetchCarte() {
        if (!currentEtabId) return;
        if (btnSync && !btnSync.classList.contains('is-spinning')) btnSync.classList.add('is-spinning');
        try {
            const resp = await fetch(`${GAS_URL}?action=get_carte_complete&etabId=${currentEtabId}`);
            const res = await resp.json();
            if (res.success && res.data) {
                rawData = res.data;
                localStorage.setItem("ids_ma_carte", JSON.stringify(res.data.map(p => String(p.produit_id))));
                renderCatalogue(res.data);
                checkAndFocusLastAdded();
            }
        } finally { if (btnSync) setTimeout(() => btnSync.classList.remove('is-spinning'), 500); }
    }

    /* ============================================================
     * [4] SYNCHRONISATION & MODE HORS-LIGNE
     * ============================================================ */
    async function updateSheets(productId, field, value) {
        if (!currentEtabId) return;
        const actionData = { productId, field, value, timestamp: Date.now() };
        if (!navigator.onLine) { saveToOfflineQueue(actionData); return; }
        if (btnSync) btnSync.classList.add('is-spinning');
        try {
            await fetch(GAS_URL, {
                method: "POST", mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "update_produit_gerant", etabId: currentEtabId, ...actionData })
            });
        } catch (e) { saveToOfflineQueue(actionData); } 
        finally { if (btnSync) setTimeout(() => btnSync.classList.remove('is-spinning'), 800); }
    }

    async function updateWifiSheet(field, value) {
        if (!currentEtabId) return;
        const wifiData = { action: "update_wifi", etabId: currentEtabId, field: field, value: value, timestamp: Date.now() };
        if (!navigator.onLine) { saveToOfflineQueue({ productId: "WIFI", ...wifiData }); return; }
        try { await fetch(GAS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(wifiData) }); } 
        catch (e) { saveToOfflineQueue({ productId: "WIFI", ...wifiData }); }
    }

    function saveToOfflineQueue(data) {
        let queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
        queue.push(data);
        localStorage.setItem("offline_queue", JSON.stringify(queue));
        updateOnlineStatus();
    }

    async function processOfflineQueue() {
        if (!navigator.onLine) return;
        let queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
        if (queue.length === 0) return;
        syncStatusLabel.style.color = "#3498db";
        syncStatusLabel.innerHTML = `● Synchronisation de ${queue.length} actions...`;
        for (const item of queue) {
            try {
                const actionType = item.productId === "WIFI" ? "update_wifi" : "update_produit_gerant";
                await fetch(GAS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: actionType, etabId: currentEtabId, ...item }) });
            } catch (e) { console.error("Sync Error", e); }
        }
        localStorage.removeItem("offline_queue"); updateOnlineStatus(); fetchCarte();
    }

 /* ============================================================
 * [5] RENDU DYNAMIQUE DU CATALOGUE (SULTAN 90% EDITION)
 * ============================================================ */
function renderCatalogue(produits) {
    if (!mainCatalogue) return;
    mainCatalogue.innerHTML = "";
    const familles = [...new Set(produits.map(p => p.famille))].sort();
    localStorage.setItem("categories_smartcarte", JSON.stringify(familles));

    if (dynamicFilterList) {
        dynamicFilterList.innerHTML = '<button class="cat-item is-selected">Tous</button>';
        familles.forEach(f => {
            const b = document.createElement('button'); 
            b.className = "cat-item"; 
            b.textContent = f;
            dynamicFilterList.appendChild(b);
        });
        attachCategoryListeners();
    }

    familles.forEach((famille, index) => {
        const section = document.createElement('section');
        section.className = "category-group-wrapper";
        section.setAttribute('data-category', famille.toLowerCase());
        section.style.marginTop = (index === 0) ? "10px" : "130px";
        section.innerHTML = `
            <h2 class="cat-title-divider" style="margin-bottom: 20px; text-transform: uppercase;">${famille}</h2>
            <div class="products" style="display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));"></div>
        `;
        const grid = section.querySelector('.products');

        produits.filter(p => p.famille === famille).forEach(prod => {
            const isRupture = String(prod.rupture).toLowerCase().trim() === "oui";
            const isMkt = String(prod.rupture).toLowerCase().trim() === "ouimarket";
            const isBlocked = String(prod.bloquer).toLowerCase().trim() === "oui";
            
            // --- LOGIQUE PRIX SULTAN ---
            const uniqueId = prod.produit_id;
            
            // On utilise le prix calculé par le Backend (Zone + Type)
            const prixAfficheRec = (prod.prix_recommande && prod.prix_recommande > 0) 
                                   ? prod.prix_recommande 
                                   : Number(prod.prix_vente);

            let btnText = "EN STOCK", btnClass = "status-green";
            if (isBlocked) { btnText = "🚫 PRODUIT BLOQUÉ"; btnClass = "status-red"; }
            else if (isRupture) { btnText = "RUPTURE RÉELLE"; btnClass = "status-red"; }
            else if (isMkt) { btnText = "RUPTURE MARKETING"; btnClass = "status-orange"; }

            // --- CORRECTIF : GESTION DU SOUS-DOSSIER IMAGES ---
            const imagePath = (prod.image && !prod.image.startsWith('http')) 
                ? `images/${prod.image}` 
                : (prod.image || 'images/placeholder.png');

            const card = document.createElement('article');
            card.className = `product-card ${(isRupture || isBlocked) ? 'is-rupture-total' : ''} ${isBlocked ? 'is-blocked' : ''}`;
            card.setAttribute('data-id', uniqueId);
            
            // ✅ RÉTABLISSEMENT DU MOTEUR DE RECHERCHE : Ajout de data-name
            card.setAttribute('data-name', prod.nom.toLowerCase().trim());
            
            card.innerHTML = `
                <button class="btn-lock-trigger" type="button"><span class="lock-icon">${isBlocked ? '🔒' : '🔓'}</span></button>
                <div class="p-name">${prod.nom}</div>
                <div class="p-img"><img src="${imagePath}" onerror="this.src='images/placeholder.png';"></div>
                
                <div class="price-edit-wrap">
                    <span style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: rgba(255,255,255,1); font-weight: 900; font-size: 1rem; padding: 5px 8px; border-radius: 4px; position: absolute; left: 0px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                        ${prixAfficheRec.toLocaleString('fr-FR')}
                    </span>

                    <span id="display-${uniqueId}" class="price-display">
                        ${Number(prod.prix_vente).toLocaleString('fr-FR')}
                    </span>
                    <input type="number" id="input-${uniqueId}" class="price-input" value="${prod.prix_vente}" style="display:none;">
                    
                    <span class="currency-label">FCFA</span>

                    <button class="btn-edit-price" type="button" onclick="toggleEditPrice('${uniqueId}')">✏️</button>
                </div>

                <div class="status-action-row">
                    <button class="main-status-btn ${btnClass}">${btnText}</button>
                    <button class="btn-mkt-toggle ${(isRupture || isMkt) ? 'is-plus' : 'is-minus'}">${(isRupture || isMkt) ? '+' : '-'}</button>
                </div>`;
            
            grid.appendChild(card);
        });
        mainCatalogue.appendChild(section);
    });
    filterBoissons();
}

/**
 * ⚡ FONCTION TOGGLE SULTAN
 */
window.toggleEditPrice = function(id) {
    const display = document.getElementById(`display-${id}`);
    const input = document.getElementById(`input-${id}`);
    if (display && input) {
        if (input.style.display === "none") {
            display.style.display = "none";
            input.style.display = "inline-block";
            input.focus();
            input.select();
        } else {
            display.style.display = "inline-block";
            input.style.display = "none";
            display.innerText = Number(input.value).toLocaleString('fr-FR');
        }
    }
};
    /* ============================================================
     * [6] ÉVÉNEMENTS CLICS ET ACTIONS PRODUITS
     * ============================================================ */
    document.addEventListener("click", (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
        const productId = card.getAttribute('data-id');
        const mainBtn = card.querySelector('.main-status-btn');
        const toggleBtn = card.querySelector('.btn-mkt-toggle');
        const product = rawData.find(p => String(p.produit_id) === productId);

        if (e.target.closest('.btn-lock-trigger')) {
            const isNowBlocked = !card.classList.contains('is-blocked');
            card.classList.toggle('is-blocked'); card.classList.toggle('is-rupture-total', isNowBlocked);
            card.querySelector('.lock-icon').textContent = isNowBlocked ? '🔒' : '🔓';
            mainBtn.textContent = isNowBlocked ? "🚫 PRODUIT BLOQUÉ" : "EN STOCK";
            mainBtn.className = isNowBlocked ? "main-status-btn status-red" : "main-status-btn status-green";
            if (product) product.bloquer = isNowBlocked ? "oui" : "non";
            updateSheets(productId, "bloquer", isNowBlocked ? "oui" : "non");
            filterBoissons(); return;
        }

        if (e.target.classList.contains('main-status-btn')) {
            if (card.classList.contains('is-blocked')) return;
            const isNowRupture = !card.classList.contains('is-rupture-total');
            card.classList.toggle('is-rupture-total');
            if (isNowRupture) {
                mainBtn.textContent = "RUPTURE RÉELLE"; mainBtn.className = "main-status-btn status-red";
                toggleBtn.textContent = "+"; if (product) product.rupture = "oui";
                updateSheets(productId, "rupture", "oui");
            } else {
                mainBtn.textContent = "EN STOCK"; mainBtn.className = "main-status-btn status-green";
                toggleBtn.textContent = "-"; if (product) product.rupture = "non";
                updateSheets(productId, "rupture", "non");
            }
            filterBoissons();
        }

        if (e.target.classList.contains('btn-mkt-toggle')) {
            if (card.classList.contains('is-blocked')) return;
            const isNowMkt = mainBtn.textContent !== "RUPTURE MARKETING";
            if (isNowMkt) {
                mainBtn.textContent = "RUPTURE MARKETING"; mainBtn.className = "main-status-btn status-orange";
                toggleBtn.textContent = "+"; if (product) product.rupture = "ouimarket";
                updateSheets(productId, "rupture", "ouimarket");
            } else {
                mainBtn.textContent = "EN STOCK"; mainBtn.className = "main-status-btn status-green";
                toggleBtn.textContent = "-"; if (product) product.rupture = "non";
                updateSheets(productId, "rupture", "non");
            }
            filterBoissons();
        }

        if (e.target.classList.contains('btn-edit-price')) openPriceEdit(e.target.closest('.price-edit-wrap'));
    });

    function openPriceEdit(wrap) {
        const input = wrap.querySelector('.price-input');
        wrap.querySelector('.price-display').style.display = 'none';
        wrap.querySelector('.currency-label').style.display = 'none';
        wrap.querySelector('.btn-edit-price').style.display = 'none';
        input.style.display = 'block'; input.focus();
        const val = input.value; input.value = ''; input.value = val;
    }

    document.addEventListener("focusout", (e) => {
        if (e.target.classList.contains('price-input')) {
            const wrap = e.target.closest('.price-edit-wrap');
            const val = e.target.value || "0";
            wrap.querySelector('.price-display').textContent = Number(val).toLocaleString('fr-FR');
            wrap.querySelector('.price-display').style.display = 'inline';
            wrap.querySelector('.currency-label').style.display = 'inline';
            e.target.style.display = 'none'; wrap.querySelector('.btn-edit-price').style.display = 'flex';
            const productId = e.target.closest('.product-card').getAttribute('data-id');
            const product = rawData.find(p => String(p.produit_id) === productId);
            if (product) product.prix_vente = val;
            updateSheets(productId, "prix_vente", val); filterBoissons();
        }
    });

    /* ============================================================
     * [7] FILTRE (LOGIQUE SULTAN RESTAURÉE)
     * ============================================================ */
    function filterBoissons() {
        if (!rawData || rawData.length === 0) return;
        const query = (searchInput.value || "").toLowerCase().trim();
        const activeCat = (categoryLabel.textContent || "Tous").toLowerCase().trim();
        let countVisible = 0, totalNew = 0, totalRupture = 0, totalBlocked = 0;

        rawData.forEach(prod => {
            const matchesCat = (activeCat === 'tous' || prod.famille.toLowerCase().trim() === activeCat);
            if (matchesCat) {
                const isRup = String(prod.rupture).toLowerCase().trim() === "oui" || String(prod.rupture).toLowerCase().trim() === "ouimarket";
                const isBlk = String(prod.bloquer).toLowerCase().trim() === "oui";
                if (parseFloat(prod.prix_vente) === 0) totalNew++;
                if (isRup) totalRupture++;
                if (isBlk) totalBlocked++;
            }
        });

        document.querySelectorAll('.category-group-wrapper').forEach((section, index) => {
            const sectionCat = section.getAttribute('data-category').toLowerCase();
            let hasVisible = false;
            const matchesCat = (activeCat === 'tous' || sectionCat === activeCat);

            section.querySelectorAll('.product-card').forEach(card => {
                const name = card.getAttribute('data-name') || "";
                const pId = card.getAttribute('data-id');
                const priceValue = parseFloat(card.querySelector('.price-input').value) || 0;
                const prod = rawData.find(p => String(p.produit_id) === pId);
                const isRup = String(prod.rupture).toLowerCase().trim() === "oui" || String(prod.rupture).toLowerCase().trim() === "ouimarket";
                const isBlk = String(prod.bloquer).toLowerCase().trim() === "oui";

                const matchesSearch = name.includes(query);
                const matchesNew = (filterNewActive && totalNew > 0) ? (priceValue === 0) : true;
                const matchesRupture = (filterRuptureActive && totalRupture > 0) ? isRup : true;
                const matchesBlocked = (filterBlockedActive && totalBlocked > 0) ? isBlk : true;
                const matchesActiveOnly = filterActiveOnly ? (!isRup && !isBlk) : true;

                if (matchesSearch && matchesCat && matchesNew && matchesRupture && matchesBlocked && matchesActiveOnly) {
                    card.style.display = ''; countVisible++; hasVisible = true;
                } else { card.style.display = 'none'; }
            });

            if (hasVisible) {
                section.style.display = 'block';
                section.style.marginTop = (activeCat !== 'tous') ? "0" : (index === 0 ? "10px" : "130px");
            } else { section.style.display = 'none'; }
        });

        const handleBadge = (btn, span, total, filterType) => {
            if (btn) {
                if (total > 0) {
                    btn.style.setProperty('display', 'inline-flex', 'important');
                    if (span) span.textContent = total;
                } else {
                    btn.style.setProperty('display', 'none', 'important');
                    btn.classList.remove('is-active');
                    if (filterType === 'new') filterNewActive = false;
                    if (filterType === 'rup') filterRuptureActive = false;
                    if (filterType === 'blk') filterBlockedActive = false;
                }
            }
        };
        handleBadge(btnFilterNew, countNewSpan, totalNew, 'new');
        handleBadge(btnFilterRupture, countRuptureSpan, totalRupture, 'rup');
        handleBadge(btnFilterBlocked, countBlockedSpan, totalBlocked, 'blk');
        if (countDisplay) countDisplay.innerHTML = `${countVisible}<span class="count-text"> élément(s)</span>`;
    }

    function attachCategoryListeners() {
        document.querySelectorAll('.cat-item').forEach(item => {
            item.onclick = () => {
                resetAllFilters(); categoryLabel.textContent = item.textContent;
                categoryPanel.hidden = true;
                document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('is-selected'));
                item.classList.add('is-selected'); window.scrollTo({ top: 0, behavior: 'instant' });
                filterBoissons();
            };
        });
    }

    /* ============================================================
     * [8] NAVIGATION ET TRI
     * ============================================================ */
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.tagName === 'A') return;
            if (this.textContent.trim() === 'SmartCarte') {
                const etabId = localStorage.getItem("etablissement_id");
                if (etabId) window.open(`smartcarte.html?id=${etabId}`, '_blank');
                return;
            }
            resetAllFilters();
            document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('is-active'));
            this.classList.add('is-active');
            if (this.textContent.trim() === 'Catalogue') {
                localStorage.setItem("mode_admin", "false");
                window.open('catalogue.html', '_blank');
            }
        });
    });

    if (btnSortPrice) {
        btnSortPrice.addEventListener('click', () => {
            const grids = document.querySelectorAll('.products');
            grids.forEach(grid => {
                const cards = Array.from(grid.querySelectorAll('.product-card'));
                cards.sort((a, b) => {
                    const priceA = parseFloat(a.querySelector('.price-input').value) || 0;
                    const priceB = parseFloat(b.querySelector('.price-input').value) || 0;
                    return isAscending ? priceA - priceB : priceB - priceA;
                });
                cards.forEach(card => grid.appendChild(card));
            });
            isAscending = !isAscending; if (sortLabel) sortLabel.textContent = isAscending ? "Prix ↑" : "Prix ↓";
        });
    }

    /* ============================================================
     * [9] ÉCOUTEURS STANDARDS
     * ============================================================ */
    if (btnSync) btnSync.addEventListener('click', fetchCarte);
    if (searchInput) searchInput.addEventListener('input', filterBoissons);

    const setupFilterBtn = (btn, type) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (type === 'new') filterNewActive = !filterNewActive;
            if (type === 'rup') filterRuptureActive = !filterRuptureActive;
            if (type === 'blk') filterBlockedActive = !filterBlockedActive;
            if (type === 'act') filterActiveOnly = !filterActiveOnly;
            btn.classList.toggle('is-active');
            // Reset des flags croisés pour ne pas empiler les filtres
            if (type !== 'new') { filterNewActive = false; if(btnFilterNew) btnFilterNew.classList.remove('is-active'); }
            if (type !== 'rup') { filterRuptureActive = false; if(btnFilterRupture) btnFilterRupture.classList.remove('is-active'); }
            if (type !== 'blk') { filterBlockedActive = false; if(btnFilterBlocked) btnFilterBlocked.classList.remove('is-active'); }
            if (type !== 'act') { filterActiveOnly = false; if(btnFilterActiveOnly) btnFilterActiveOnly.classList.remove('is-active'); }
            filterBoissons();
        });
    };
    setupFilterBtn(btnFilterNew, 'new'); setupFilterBtn(btnFilterRupture, 'rup');
    setupFilterBtn(btnFilterBlocked, 'blk'); setupFilterBtn(btnFilterActiveOnly, 'act');

    if (btnCategory) btnCategory.addEventListener('click', (e) => { e.stopPropagation(); categoryPanel.hidden = !categoryPanel.hidden; });
    window.addEventListener('click', (e) => { if (!categoryPanel.hidden && !categoryPanel.contains(e.target)) categoryPanel.hidden = true; });
    window.addEventListener('online', () => { updateOnlineStatus(); processOfflineQueue(); });
    window.addEventListener('offline', updateOnlineStatus);

    function updateOnlineStatus() {
        const queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
        syncStatusLabel.style.color = navigator.onLine ? "#4ade80" : "#ef4444";
        syncStatusLabel.innerHTML = navigator.onLine ? `● Système synchronisé ${queue.length > 0 ? '(Sync...)' : ''}` : `● Mode hors-ligne (${queue.length} en attente)`;
    }

    /* ============================================================
     * [10] DISCIPLINE AUTO
     * ============================================================ */
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && currentEtabId) { fetchCarte(); processOfflineQueue(); } });

    function checkAndFocusLastAdded() {
        const lastId = localStorage.getItem("last_added_id");
        if (!lastId) return;
        setTimeout(() => {
            const targetCard = document.querySelector(`.product-card[data-id="${lastId}"]`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetCard.style.boxShadow = "0 0 20px #D4AF37"; targetCard.style.border = "2px solid #D4AF37";
                openPriceEdit(targetCard.querySelector('.price-edit-wrap'));
                localStorage.removeItem("last_added_id");
                setTimeout(() => { targetCard.style.boxShadow = ""; targetCard.style.border = ""; }, 3000);
            }
        }, 600);
    }

    /* ============================================================
     * [11] WIFI SULTAN
     * ============================================================ */
    const btnToggleSettings = document.getElementById('btnToggleSettings');
    const settingsDropdown = document.getElementById('settingsDropdown');
    if (btnToggleSettings) btnToggleSettings.addEventListener('click', (e) => { e.stopPropagation(); settingsDropdown.hidden = !settingsDropdown.hidden; });
    
    if (btnSaveWifi) {
        btnSaveWifi.addEventListener('click', async () => {
            const ssid = wifiSSID.value, pass = wifiPass.value;
            btnSaveWifi.textContent = "⌛ Synchronisation..."; btnSaveWifi.disabled = true;
            try {
                await updateWifiSheet("wifi_name", ssid); await updateWifiSheet("wifi_pass", pass);
                const isLocked = wifiLockIcon.textContent === '🔒' ? 'oui' : 'non';
                updateHeaderWifiUI(ssid, isLocked);
                btnSaveWifi.textContent = "✅ Système à jour"; btnSaveWifi.style.background = "#10b981";
                setTimeout(() => { btnSaveWifi.textContent = "ENREGISTRER LE WIFI"; btnSaveWifi.style.background = ""; btnSaveWifi.disabled = false; settingsDropdown.hidden = true; }, 2000);
            } catch (error) { btnSaveWifi.textContent = "❌ Erreur"; }
        });
    }

    if (btnLockWifi) {
        btnLockWifi.addEventListener('click', async (e) => {
            e.stopPropagation();
            const actuellementOuvert = (wifiLockIcon.textContent === '🔓');
            const statusValue = actuellementOuvert ? "oui" : "non";
            wifiLockIcon.textContent = actuellementOuvert ? '🔒' : '🔓';
            updateHeaderWifiUI(wifiSSID.value, statusValue);
            try { await updateWifiSheet("wifi_status", statusValue); } catch (err) { console.error(err); }
        });
    }
});

