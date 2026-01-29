/******************************************************************************
 * MASTERCARTE — LOGIQUE DU DASHBOARD ADMIN
 * --------------------------------------------
 * Version     : 1.4.2 (Sync Catalogue + Navigation + Mobile Pager + SmartCarte)
 * Description : Gestion de la sécurité, menu interactif et navigation mobile.
 * ******************************************************************************/

// URL DU BACKEND (Point d'entrée principal API)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_Tuv0b7u-VKtQy9E8HhlmHTpzxPT5trc1Qe_h69xd5yrG-EvwZ-7VMc_6vGSYGprM/exec";

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================================
       [01] CONFIGURATION ET RÉFÉRENCES
       ======================================================================== */
    const LOGIN_PAGE      = "login.html";
    const btnCatalogue    = document.getElementById("btnCatalogue");
    const btnEtab          = document.getElementById("btnEtab");
    const btnSmartCarte   = document.getElementById("btnSmartCarte"); // Référence ajoutée
    const userNameEl      = document.getElementById("userName");
    const userMenuBtn      = document.getElementById("userMenuBtn");
    const userMenu         = document.getElementById("userMenu");

    /* ========================================================================
       [02] SÉCURITÉ ET CONTRÔLE D'ACCÈS
       ======================================================================== */
    const rawUser = localStorage.getItem("mc_user");

    if (!rawUser) { 
        window.location.replace(LOGIN_PAGE); 
        return; 
    }

    const userData = JSON.parse(rawUser);
    
    // Affichage dynamique du nom de l'admin
    if (userNameEl && userData.prenom) {
        userNameEl.textContent = `${userData.prenom} ${userData.nom || ""}`;
    }

    // ✅ AJOUT : Préparation de l'identité Admin pour le catalogue
    if (userData.role === 'admin') {
        localStorage.setItem("mode_admin", "true");
        localStorage.setItem("nom_etablissement", "Administration");
    }


    /* ========================================================================
       [03] GESTION DU MENU DROPDOWN (3 POINTS)
       ======================================================================== */
    if (userMenuBtn && userMenu) {
        userMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isHidden = userMenu.hidden;
            userMenu.hidden = !isHidden;
            userMenuBtn.setAttribute("aria-expanded", isHidden);
        });

        document.addEventListener("click", (e) => {
            if (!userMenu.contains(e.target)) {
                userMenu.hidden = true;
                userMenuBtn.setAttribute("aria-expanded", "false");
            }
        });

        const menuItems = userMenu.querySelectorAll(".user-menu-item");
        menuItems.forEach(item => {
            item.addEventListener("click", () => {
                const action = item.getAttribute("data-action");
                
                if (action === "logout") {
                    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
                        localStorage.removeItem("mc_user");
                        localStorage.removeItem("mode_admin"); // Nettoyage
                        localStorage.removeItem("nom_etablissement");
                        window.location.replace(LOGIN_PAGE);
                    }
                } else if (action === "profile") {
                    console.log("Accès au profil...");
                }
                userMenu.hidden = true;
            });
        });
    }


    /* ========================================================================
       [04] GESTION DE L'ACCÈS AU CATALOGUE (SYNC ACTIVE)
       ======================================================================== */
    if (btnCatalogue) {
        btnCatalogue.addEventListener("click", (e) => {
            e.preventDefault();
            btnCatalogue.disabled = true;
            btnCatalogue.innerHTML = `⏳ Chargement...`;

            // ✅ AJOUT : Confirmation de l'identité avant redirection
            localStorage.setItem("mode_admin", "true");
            localStorage.setItem("nom_etablissement", "Administration");

            fetch(`${SCRIPT_URL}?action=get_produits`)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        localStorage.setItem("mastercarte_cache_catalogue", JSON.stringify(result.data));
                        window.location.href = "catalogue.html";
                    } else {
                        throw new Error("Erreur serveur");
                    }
                })
                .catch(error => {
                    console.error("Erreur Sync Catalogue:", error);
                    alert("Erreur réseau : Impossible de charger le catalogue.");
                    btnCatalogue.disabled = false;
                    btnCatalogue.innerHTML = "Catalogue";
                });
        });
    }

    /* ========================================================================
       [05] TEST D'OUVERTURE ÉTABLISSEMENTS (SANS CHARGEMENT API)
       ======================================================================== */
    if (btnEtab) {
        btnEtab.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Effet visuel immédiat pour confirmer le clic
            btnEtab.disabled = true;
            btnEtab.innerHTML = `⏳ Ouverture...`;

            // On redirige simplement pour vérifier que le fichier s'ouvre
            setTimeout(() => {
                window.location.href = "etab_dashboard.html";
            }, 300);
        });
    }

    /* ========================================================================
       [06] GESTION DU PAGER MOBILE (SYNC POINTS + SCROLL)
       ======================================================================== */
    const container = document.querySelector('.dash-sections');
    const dots = document.querySelectorAll('.dot-btn');

    if (container && dots.length > 0) {
        container.addEventListener('scroll', () => {
            const index = Math.round(container.scrollLeft / container.offsetWidth);
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === index);
            });
        }, { passive: true });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                container.scrollTo({
                    left: container.offsetWidth * i,
                    behavior: 'smooth'
                });
            });
        });
    }

    /* ========================================================================
       [07] OUVERTURE SMARTCARTE EDIT
       ======================================================================== */
    if (btnSmartCarte) {
        btnSmartCarte.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Animation légère avant redirection
            btnSmartCarte.style.opacity = "0.7";
            btnSmartCarte.innerHTML = "⏳ Analyse...";
            
            window.location.href = "smartcarte_edit.html";
        });
    }

});