/* ===========================================================
   MASTERCARTE — MOTEUR DE GÉNÉRATION QR (SULTAN EDITION)
   Logique : Hybride (Unique/Spécifique) + Planche 5 colonnes (40 stickers)
   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const btnQR = document.getElementById('btnQRCode');

    if (btnQR) {
        btnQR.addEventListener('click', () => {
            if (window.currentEtab) {
                preparerEtAfficherPlanche(window.currentEtab);
            } else {
                // EFFET VISUEL AU LIEU DE L'ALERTE
                btnQR.style.backgroundColor = "#ef4444"; // Rouge erreur
                btnQR.textContent = "⌛ Chargement...";
                
                console.error("❌ Données window.currentEtab manquantes");
                
                // On remet le bouton normal après 2 secondes
                setTimeout(() => {
                    btnQR.style.backgroundColor = ""; 
                    btnQR.textContent = "QR Code";
                }, 2000);
            }
        });
    }
});
/**
 * Génère une planche de stickers dans un nouvel onglet pour une impression propre
 */
function preparerEtAfficherPlanche(etab) {
    const printWindow = window.open('', '_blank');
    
    // CONFIGURATION BAR : 4 colonnes x 8 lignes = 32 stickers
    const totalStickers =20; 
    const slug = etab.slug;
    const type = etab.type_qr || 'unique';
    const maxTables = parseInt(etab.emplacements) || 1;

    let html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Planche MasterCarte - ${etab.nom}</title>
        <style>
            body { margin: 0; padding: 0; background: #222; font-family: 'Segoe UI', sans-serif; }
            .no-print { 
                background: #000; padding: 15px; text-align: center; 
                position: sticky; top: 0; z-index: 100; border-bottom: 2px solid #D4AF37;
            }
            .btn-print { 
                background: #D4AF37; color: #000; border: none; padding: 10px 30px; 
                font-weight: 900; border-radius: 50px; cursor: pointer; font-size: 1rem;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
            }
            .a4-page {
                width: 210mm; padding: 10mm; margin: 20px auto; 
                background: white; display: grid; 
                grid-template-columns: repeat(4, 1fr); /* 4 COLONNES */
                gap: 4mm; box-sizing: border-box;
            }
            .qr-sticker {
                background: #000; color: #D4AF37; padding: 12px;
                border-radius: 8px; display: flex; flex-direction: column;
                align-items: center; justify-content: space-between;
                text-align: center; height: 45mm; /* Hauteur augmentée */
                border: 0.5mm solid #1a1a1a;
            }
            .sticker-name { 
                font-size: 8pt; font-weight: 800; text-transform: uppercase; 
                width: 100%; border-bottom: 0.7mm solid #D4AF37; padding-bottom: 5px; 
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .sticker-qr img { 
                background: white; padding: 5px;height: 30 mm; width: 30mm; /* TAILLE SCAN OPTIMALE */
                border-radius: 3px; border: 1mm solid #fff; 
            }
            .sticker-footer { 
                width: 100%; display: flex; justify-content: space-between; 
                font-size: 7pt; font-weight: 700; align-items: center;
            }
            .brand-tag { font-size: 5.5pt; letter-spacing: 0.5px; }
            
            @media print {
                body { background: white; }
                .no-print { display: none; }
                .a4-page { margin: 0; padding: 10mm; width: 210mm; height: 297mm; box-shadow: none; }
                .qr-sticker { border: 0.1mm solid #333; -webkit-print-color-adjust: exact; }
            }
        </style>
    </head>
    <body>
        <div class="no-print">
            <button class="btn-print" onclick="window.print()">🖨️ IMPRIMER LA PLANCHE BAR (20 STICKERS)</button>
        </div>
        <div class="a4-page">`;

    for (let i = 1; i <= totalStickers; i++) {
        let tableID = (type === 'specifique') ? ((i <= maxTables) ? i : (i % maxTables) || maxTables) : 1;
        const urlClient = `https://mc.me/${slug}?t=${tableID}`;
        
        // Taille de l'image QR augmentée pour la netteté
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(urlClient)}&ecc=H`;

        html += `
           <div class="qr-sticker">
                <div class="sticker-name">${etab.nom}</div>
                
                <div class="sticker-qr">
                    <img src="${qrImageUrl}" alt="QR">
                </div>
                
                <div class="sticker-footer">
                    <span class="brand-tag">✨ MASTERCARTE +241 077442256</span>
                </div>
            </div>`;
    }

    html += `</div></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
}