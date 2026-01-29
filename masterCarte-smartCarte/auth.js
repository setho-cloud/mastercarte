/******************************************************************************
 * MASTERCARTE — AUTHENTIFICATION (AUTH.JS)
 * --------------------------------------------------------------------------
 * @version  : 2.6.0 (Redirection Gérant vers gerant_edit.html)
 ******************************************************************************/

const GAS_LOGIN_URL = "https://script.google.com/macros/s/AKfycbw_Tuv0b7u-VKtQy9E8HhlmHTpzxPT5trc1Qe_h69xd5yrG-EvwZ-7VMc_6vGSYGprM/exec";

/* ==========================================================================
   [01] RÉCUPÉRATION DES ÉLÉMENTS DU DOM
   ========================================================================== */
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");
const passwordInput = document.getElementById("password");
const togglePwdBtn = document.getElementById("togglePwd");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = submitBtn.textContent;
const errorBox = document.getElementById("errorBox");
const forgotPwdBtn = document.getElementById("forgotLink"); 

/* ==========================================================================
   [02] VARIABLES DE CONTRÔLE
   ========================================================================== */
let hasSubmitted = false;

/* ==========================================================================
   [03] FONCTIONS UTILITAIRES
   ========================================================================== */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showEmailError(message) {
  emailError.textContent = message;
  emailError.hidden = false;
}

function hideEmailError() {
  emailError.textContent = "";
  emailError.hidden = true;
}

function showMessage(message, type = "error") {
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.hidden = false;
  errorBox.classList.remove("success", "info");
  if (type !== "error") {
    errorBox.classList.add(type); 
  }
}

function hideMessage() {
  if (!errorBox) return;
  errorBox.hidden = true;
  errorBox.textContent = "";
  errorBox.classList.remove("success", "info");
}

function resetSubmitBtn() {
  submitBtn.disabled = false;
  submitBtn.textContent = submitBtnText;
}

/* ==========================================================================
   [04] INITIALISATION
   ========================================================================== */
hideEmailError();
hideMessage();
resetSubmitBtn();

/* ==========================================================================
   [05] LOGIQUE MOT DE PASSE OUBLIÉ (GET)
   ========================================================================== */
if (forgotPwdBtn) {
  forgotPwdBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email || !isValidEmail(email)) {
      showEmailError("Saisissez un email valide pour la récupération.");
      emailInput.focus();
      return;
    }

    showMessage("Demande de récupération en cours...", "info");
    
    try {
      const resp = await fetch(`${GAS_LOGIN_URL}?action=forgot_password&email=${encodeURIComponent(email)}`);
      const data = await resp.json();
      
      if (data.success) {
        showMessage(data.message, "success");
      } else {
        showMessage(data.message, "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Erreur lors de la récupération. Réessayez.", "error");
    }
  });
}

/* ==========================================================================
   [06] VALIDATION ET ENVOI (POST)
   ========================================================================== */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hasSubmitted = true;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  hideMessage();
  submitBtn.disabled = true;
  submitBtn.textContent = "Connexion…";

  if (email === "") {
    showEmailError("Veuillez saisir votre adresse email.");
    emailInput.focus();
    resetSubmitBtn();
    return;
  }

  if (!isValidEmail(email)) {
    showEmailError("Email invalide (ex : nom@domaine.com)");
    emailInput.focus();
    resetSubmitBtn();
    return;
  }

  hideEmailError();

  if (password.trim() === "") {
    showMessage("Veuillez saisir votre mot de passe.", "error");
    passwordInput.focus();
    resetSubmitBtn();
    return;
  }

  try {
    const response = await fetch(GAS_LOGIN_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "login",
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (!data || data.success !== true) {
      showMessage(data?.message || "Identifiants ou mot de passe incorrects.", "error");
      resetSubmitBtn();
      return;
    }

    // ✅ SUCCÈS : STOCKAGE & REDIRECTION
    if (data.user) {
      localStorage.setItem("mc_user", JSON.stringify(data.user));
      
      if (data.message === "Accès Sultan.") {
        showMessage("Accès Maître activé. Redirection...", "success");
      } else {
        showMessage("Connexion réussie ! Préparation de votre carte...", "success");
      }

      setTimeout(() => {
        const role = data.user?.role;
        // Redirection intelligente selon le rôle
        if (role === "admin") {
          window.location.href = "admin_dashboard.html";
        } else {
          // Vers ton interface d'édition gérant
          window.location.href = "gerant_edit.html";
        }
      }, 800);
    }

  } catch (err) {
    console.error(err);
    showMessage("Erreur réseau/serveur. Réessayez.", "error");
    resetSubmitBtn();
  }
});

/* ==========================================================================
   [07] RÉACTIVITÉ DES CHAMPS
   ========================================================================== */

emailInput.addEventListener("input", () => {
  if (hasSubmitted) {
    const email = emailInput.value.trim();
    if (email === "" || isValidEmail(email)) {
      hideEmailError();
    }
  }
  hideMessage();
  if (submitBtn.disabled) resetSubmitBtn();
});

passwordInput.addEventListener("input", () => {
  hideMessage();
  if (submitBtn.disabled) resetSubmitBtn();
});

/* ==========================================================================
   [08] UI - MOT DE PASSE
   ========================================================================== */
togglePwdBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePwdBtn.textContent = isHidden ? "Masquer" : "Afficher";
  togglePwdBtn.setAttribute("aria-pressed", String(isHidden));
  passwordInput.focus();
});