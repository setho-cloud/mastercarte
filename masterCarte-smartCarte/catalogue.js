/******************************************************************************
 * 🛡️ MASTERCARTE — LOGIQUE DU CATALOGUE DYNAMIQUE (V 5.5.0)
 * --------------------------------------------------------------------------
 * @version : Production Finale - AUTO-CLOSE CAT + MODALE BLANCHE + ANTI-DOUBLON
 ******************************************************************************/

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_Tuv0b7u-VKtQy9E8HhlmHTpzxPT5trc1Qe_h69xd5yrG-EvwZ-7VMc_6vGSYGprM/exec?action=get_produits"; 

document.addEventListener("DOMContentLoaded", () => {

    /* --- [0] ÉLÉMENTS DU DOM --- */
    const mainContent    = document.querySelector(".catalogue-content");
    const resultsCount    = document.getElementById("resultsCount");
    const searchInput    = document.getElementById("searchInput");
    const btnClearSearch = document.getElementById("btnClearSearch");
    const btnCategory    = document.getElementById("btnCategory");
    const categoryPanel  = document.getElementById("categoryPanel");
    const categoryLabel  = document.getElementById("categoryLabel");
    const btnSortPrice   = document.getElementById("btnSortPrice");
    const sortLabel      = document.getElementById("sortLabel");
    const btnBack        = document.getElementById("btnBack");
    const btnSync        = document.getElementById("btnSync"); 
    const catalogueTitle = document.querySelector(".catalogue-title");
    const spanIdentite   = document.getElementById("nom-etab-display");
    const syncStatusLabel = document.getElementById("syncStatusLabel"); 

    /* --- [1] ÉTAT & AUTHENTIFICATION --- */
    let allProducts      = [];  
    let currentCategory = "all";   
    let currentStatus   = "actif"; 
    let sortOrder       = "none";  

    const storedUser = localStorage.getItem("mc_user");
    const userData = storedUser ? JSON.parse(storedUser) : { role: 'gerant' };
    const modeAdmin = localStorage.getItem("mode_admin") === "true";
    const nomEtab   = localStorage.getItem("nom_etablissement");
    const monEtabId = userData.id_etablissement || userData.id;

    if (spanIdentite) spanIdentite.textContent = modeAdmin ? "Administration" : (nomEtab || "");
    if (btnBack) btnBack.onclick = () => { window.location.href = modeAdmin ? "admin_dashboard.html" : "gerant_edit.html"; };

    const cachedData = localStorage.getItem("mastercarte_cache_catalogue");
    if (cachedData) { 
        allProducts = JSON.parse(cachedData); 
        render(); 
        updateOnlineStatus();
    }

    /* ========================================================================
        [01] GESTION DU MODE HORS-LIGNE (HL) & RÉCONCILIATION RÉELLE
       ======================================================================== */
    function updateOnlineStatus() {
        if (!syncStatusLabel) return;
        
        const queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
        const pendingCount = queue.length;

        if (resultsCount) {
            const currentTotal = document.querySelectorAll('.product-card').length;
            resultsCount.innerHTML = pendingCount > 0 ? 
                `${currentTotal} <span style="color:#ef4444; font-size:0.65rem; font-weight:900;">(+${pendingCount} HL)</span>` : 
                `${currentTotal}`;
        }

        if (navigator.onLine) {
            syncStatusLabel.style.color = "#4ade80";
            syncStatusLabel.innerHTML = `<span style="display: inline-block; width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span> Système synchronisé ${pendingCount > 0 ? '(Sync...)' : ''}`;
            if (pendingCount > 0) processOfflineQueue();
        } else {
            syncStatusLabel.style.color = "#ef4444";
            syncStatusLabel.innerHTML = `<span style="display: inline-block; width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span> Mode hors-ligne (${pendingCount} en attente)`;
        }
    }

    async function processOfflineQueue() {
        if (!navigator.onLine) return;
        let queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
        if (queue.length === 0) return;

        for (const item of queue) {
            try {
                let actionType = (item.action === "ajouter") ? "ajouter_produit_gerant" : item.action;
                await fetch(SCRIPT_URL.split('?')[0], {
                    method: "POST", mode: "no-cors",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ 
                        action: actionType, 
                        etabId: monEtabId, 
                        productId: item.productId 
                    })
                });
            } catch (e) { console.error("❌ Erreur Sync", e); return; }
        }
        
        localStorage.removeItem("offline_queue");
        updateOnlineStatus();
        performSync();
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    /* ========================================================================
        [02] RENDU ORIGINAL (STRICTEMENT INTACT + CORRECTIF IMAGES)
       ======================================================================== */
    function render() {
        if (!mainContent) return;
        mainContent.style.display = "block";
        mainContent.innerHTML = "";

        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const idsPossedes = JSON.parse(localStorage.getItem("ids_ma_carte") || "[]");

        let filtered = allProducts.filter(p => {
            const matchSearch = p.nom.toLowerCase().includes(query);
            const familleSheet = (p.famille || "").toLowerCase().trim();
            const matchCat = (currentCategory === "all") || (familleSheet === currentCategory);
            const statusSheet = (p.statut || "").toLowerCase().trim();
            const matchStatus = (statusSheet === currentStatus);
            return matchSearch && matchCat && matchStatus;
        });

        if (sortOrder !== "none") {
            filtered.sort((a, b) => {
                const minA = Math.min(...[a.ckdo, a.prix_import].map(v => parseFloat(v)).filter(v => v > 0)) || Infinity;
                const minB = Math.min(...[b.bc_ckdo, b.prix_import].map(v => parseFloat(v)).filter(v => v > 0)) || Infinity;
                return (sortOrder === "asc") ? minA - minB : minB - minA;
            });
        }

        // ✅ TITRE CATALOGUE SCELLÉ
        if (catalogueTitle) catalogueTitle.textContent = "CATALOGUE";
        if (resultsCount) resultsCount.textContent = `${filtered.length}`;

        const familles = [...new Set(filtered.map(p => p.famille || "AUTRES"))].sort();

        familles.forEach(famille => {
            const section = document.createElement('section');
            section.style.marginBottom = "20px";
            section.style.clear = "both";
            section.innerHTML = `
                <div class="section-header" style="margin-bottom: 20px; border-bottom: 2px solid #2563eb; display: inline-block; padding-right: 30px;">
                    <h2 style="color: #2563eb; font-size: 1.4rem; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 1px;">${famille}</h2>
                </div>
                <div class="products-grid" style="display: grid; gap: 25px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); width: 100%;"></div>
            `;
            const grid = section.querySelector('.products-grid');

            filtered.filter(p => (p.famille || "AUTRES") === famille).forEach(p => {
                
                // --- CORRECTIF : GESTION DU SOUS-DOSSIER IMAGES ---
                const rawImg = p.image ? p.image.trim() : "placeholder.png";
                const imgPath = (rawImg && !rawImg.startsWith('http')) 
                    ? `images/${rawImg}` 
                    : rawImg;

                const isBlocked = String(p.bloquer).toLowerCase().trim() === "oui";
                const dejaPresent = idsPossedes.includes(String(p.id));

                let shops = [{ name: "CKDO", price: parseFloat(p.ckdo) || 0 }, { name: "PRIX IMPORT", price: parseFloat(p.prix_import) || 0 }].filter(s => s.price > 0).sort((a, b) => a.price - b.price);
                let comparisonHtml = `<div class="comparison-area">`;
                shops.forEach((shop, index) => {
                    const isBest = (index === 0 && shops.length > 1);
                    comparisonHtml += `<div class="price-badge ${isBest ? 'best-price' : 'standard-price'}"><span class="shop-name">${isBest ? '✅ ' : ''}${shop.name}</span><span class="shop-val">${shop.price.toLocaleString('fr-FR')} F</span></div>`;
                });
                comparisonHtml += `</div>`;

                let boutonHtml = isBlocked ? `<span style="color: #ef4444; font-size: 0.65rem; font-weight: 800;">🚫 PRODUIT BLOQUÉ</span>` : 
                                (!dejaPresent || modeAdmin ? `<button class="btn-add-item" style="background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 800; font-size: 0.7rem; cursor: pointer;">＋ AJOUTER</button>` : `<span style="color:#4ade80; font-weight:800; font-size:0.7rem;">DÉJÀ AJOUTÉ</span>`);

                const card = document.createElement('div');
                card.className = `product-card ${isBlocked ? 'is-blocked' : ''}`;
                card.setAttribute('data-id', p.id); 
                card.setAttribute('data-name', p.nom); 
                card.setAttribute('data-img', imgPath);

                // On utilise images/placeholder.png pour le repli professionnel
                card.innerHTML = `
                    <div class="p-name">${p.nom}</div>
                    <div class="p-img">
                        <img src="${imgPath}" onerror="this.src='images/placeholder.png';">
                    </div>
                    ${comparisonHtml}
                    <div class="card-footer-action" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #222; min-height: 40px;">
                        <span class="pill" style="margin:0; font-size: 0.7rem;">${p.famille || 'SANS CAT.'}</span>
                        ${boutonHtml}
                    </div>`;
                
                grid.appendChild(card);
            });
            mainContent.appendChild(section);
        });
        attachAddEvents();
    }

    /* ========================================================================
        [03] ACTIONS D'AJOUT & MODALE SCELLÉE (ANTI-DOUBLON)
       ======================================================================== */
    function attachAddEvents() {
        document.querySelectorAll(".btn-add-item").forEach(btn => {
            btn.onclick = (e) => {
                const card = e.target.closest(".product-card");
                const prodId = card.getAttribute("data-id");
                const prodName = card.getAttribute("data-name");
                const prodImg = card.getAttribute("data-img");
                
                // ✅ MODALE SCELLÉE AVEC CONTENEUR IMAGE BLANC
                const overlay = document.createElement("div");
                overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;";
                overlay.innerHTML = `
                    <div style="background:#0a0a0a; border:1px solid #333; padding:25px; border-radius:20px; width:100%; max-width:300px; text-align:center;">
                        <div style="color:#ef4444; font-size:0.8rem; font-weight:900; letter-spacing:2px; margin-bottom:4px; text-transform:uppercase;">AJOUT</div>
                        <div style="color:#888; font-size:0.65rem; font-weight:700; text-transform:uppercase; margin-bottom:15px;">${nomEtab || "MA CARTE"}</div>
                        <div style="background:#fff; border-radius:15px; padding:10px; margin-bottom:15px; display:inline-block; width:100%; max-width:120px;">
                            <img src="${prodImg}" style="width:100%; height:120px; object-fit:contain;" onerror="this.src='🍺';">
                        </div>
                        <h2 style="color:#fff; margin-bottom:25px; font-size:1.1rem; font-weight:900; line-height:1.2;">${prodName}</h2>
                        <div style="display:flex; gap:10px;">
                            <button id="modalCancel" style="flex:1; padding:12px; border-radius:10px; border:none; background:#222; color:#fff; cursor:pointer; font-weight:700; font-size:0.7rem;">ANNULER</button>
                            <button id="modalConfirm" style="flex:1; padding:12px; border-radius:10px; border:none; background:#ef4444; color:#fff; cursor:pointer; font-weight:900; font-size:0.7rem;">CONFIRMER</button>
                        </div>
                    </div>`;
                document.body.appendChild(overlay);

                overlay.querySelector("#modalCancel").onclick = () => overlay.remove();
                
                overlay.querySelector("#modalConfirm").onclick = async () => {
                    overlay.remove(); 
                    btn.disabled = true; 
                    btn.innerHTML = "⏳";
                    
                    const actionData = { action: "ajouter", productId: prodId };
                    
                    const ids = JSON.parse(localStorage.getItem("ids_ma_carte") || "[]");
                    if(!ids.includes(String(prodId))) {
                        ids.push(String(prodId)); 
                        localStorage.setItem("ids_ma_carte", JSON.stringify(ids));
                    }
                    btn.parentElement.innerHTML = '<span style="color:#4ade80; font-weight:800; font-size:0.7rem;">DÉJÀ AJOUTÉ</span>';

                    if (!navigator.onLine) {
                        let queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
                        queue.push(actionData);
                        localStorage.setItem("offline_queue", JSON.stringify(queue));
                        updateOnlineStatus();
                    } else {
                        try { 
                            await fetch(SCRIPT_URL.split('?')[0], { 
                                method: "POST", mode: "no-cors", 
                                body: JSON.stringify({ action: "ajouter_produit_gerant", etabId: monEtabId, productId: prodId }) 
                            }); 
                            updateOnlineStatus(); 
                        } 
                        catch (err) {
                            let queue = JSON.parse(localStorage.getItem("offline_queue") || "[]");
                            queue.push(actionData);
                            localStorage.setItem("offline_queue", JSON.stringify(queue));
                        }
                    }
                };
            };
        });
    }

    /* ========================================================================
        [04] LOGIQUE DE FERMETURE AUTO & ÉVÉNEMENTS
       ======================================================================== */
    const performSync = async () => {
        if (!navigator.onLine) { updateOnlineStatus(); return; }
        if (btnSync) btnSync.classList.add("is-spinning");
        try {
            const res = await fetch(SCRIPT_URL);
            const json = await res.json();
            if (json.success) { allProducts = json.data; localStorage.setItem("mastercarte_cache_catalogue", JSON.stringify(allProducts)); render(); }
        } finally { if (btnSync) btnSync.classList.remove("is-spinning"); updateOnlineStatus(); }
    };

    if (btnSync) btnSync.onclick = performSync;
    if (searchInput) searchInput.oninput = () => render();
    if (btnSortPrice) btnSortPrice.onclick = () => { sortOrder = (sortOrder === "asc") ? "desc" : (sortOrder === "desc" ? "none" : "asc"); sortLabel.textContent = sortOrder === "asc" ? "Prix ↑" : (sortOrder === "desc" ? "Prix ↓" : "Prix ↕"); render(); };
    
    // ✅ GESTION DES CATÉGORIES ET FERMETURE AU CLIC EXTÉRIEUR
    if (btnCategory) { 
        btnCategory.onclick = (e) => { 
            e.stopPropagation(); 
            categoryPanel.hidden = !categoryPanel.hidden; 
        }; 
    }

    document.querySelectorAll(".cat-item").forEach(item => { 
        item.onclick = () => { 
            currentCategory = item.getAttribute("data-cat").toLowerCase(); 
            categoryLabel.textContent = item.textContent; 
            render(); 
            if (categoryPanel) categoryPanel.hidden = true; 
        }; 
    });

    document.addEventListener("click", (e) => {
        if (categoryPanel && !categoryPanel.hidden) {
            if (!categoryPanel.contains(e.target) && e.target !== btnCategory) {
                categoryPanel.hidden = true;
            }
        }
    });

    updateOnlineStatus();
    performSync(); 
});