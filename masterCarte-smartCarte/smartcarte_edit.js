/* ==========================================================================
    🛡️ MASTERCARTE — LOGIQUE D'INTERACTION (V2.1.0)
    Gestion : Navigation, Rendu Boissons (15 produits), Filtrage & Recherche
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURATION DES DONNÉES (Boissons réalistes) ---
    const getProductsByCategory = (category = 'all') => {
        const volumes = ['25cl', '33cl', '50cl', '12.5cl', '75cl'];
        
        // Mots-clés pour des images réalistes via Unsplash
        const keywords = {
            'bières': 'beer,glass',
            'vins': 'wine,glass',
            'softs': 'soda,juice',
            'cocktails': 'cocktail,drink',
            'spiritueux': 'whiskey,glass',
            'all': 'drink,glass'
        };

        const currentKeyword = keywords[category] || keywords['all'];

        return Array.from({ length: 15 }, (_, i) => {
            const id = i + 1;
            const name = category === 'all' ? `Boisson Master ${id}` : `${category.charAt(0).toUpperCase() + category.slice(1)} Spéciale ${id}`;
            
            return {
                id: id,
                name: name,
                volume: volumes[Math.floor(Math.random() * volumes.length)],
                price: (Math.random() * (12 - 4) + 4).toFixed(2) + "€",
                // Source d'images réelles de boissons
                img: `https://loremflickr.com/400/400/${currentKeyword}?lock=${id + (Math.random() * 100)}`
            };
        });
    };

    // État initial
    let currentProducts = getProductsByCategory('all');

    const gridTop = document.getElementById('productGridTop');
    const gridBottom = document.getElementById('productGridBottom');

    // --- 2. FONCTION DE RENDU (Nouvelle structure demandée) ---
    const renderCatalogue = (data) => {
        const createCardHTML = (p) => `
            <article class="product-card">
                <div class="product-header">
                    <h3 class="product-name">${p.name}</h3>
                    <span class="product-vol">${p.volume}</span>
                </div>
                
                <div class="product-image">
                    <img src="${p.img}" alt="${p.name}" loading="lazy">
                </div>
                
                <div class="product-footer">
                    <span class="product-cost">Prix unitaire</span>
                    <span class="product-price">${p.price}</span>
                </div>
            </article>
        `;

        if (gridTop && gridBottom) {
            gridTop.innerHTML = data.slice(0, 6).map(createCardHTML).join('');
            gridBottom.innerHTML = data.slice(6, 15).map(createCardHTML).join('');
        }
    };

    // Initialisation
    renderCatalogue(currentProducts);

    // --- 3. GESTION DU BOUTON RETOUR ---
    const btnBack = document.getElementById('btnBack');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            btnBack.style.transform = "scale(0.9)";
            setTimeout(() => {
                window.location.href = 'admin_dashboard.html';
            }, 100);
        });
    }

    // --- 4. GESTION DES CATÉGORIES (Filtrage + Images adaptées) ---
    const catButtons = document.querySelectorAll('.cat-btn');

    catButtons.forEach(button => {
        button.addEventListener('click', () => {
            catButtons.forEach(btn => btn.classList.remove('is-active'));
            button.classList.add('is-active');

            const category = button.getAttribute('data-cat');
            
            // On recharge 15 produits avec les bonnes images
            currentProducts = getProductsByCategory(category);
            renderCatalogue(currentProducts);
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // --- 5. MOTEUR DE RECHERCHE ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = currentProducts.filter(p => 
                p.name.toLowerCase().includes(term)
            );
            renderCatalogue(filtered);
        });
    }

    // --- 6. MENU (TROIS POINTS) ---
    const btnMenu = document.getElementById('btnMenu');
    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            console.log("Menu Options MasterCarte ouvert");
        });
    }

});