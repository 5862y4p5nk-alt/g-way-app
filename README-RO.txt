G-WAY UNIVERSAL v10
====================
1. Înlocuiește fișierele vechi din repository cu toate fișierele din acest ZIP.
2. Păstrează cheia YouTube existentă pe telefon; cheia rămâne în localStorage și nu este inclusă în ZIP.
3. Surse:
   - YouTube Data API + player oficial încorporat
   - Internet Archive Advanced Search + fișiere media compatibile
   - Wikimedia Commons API + fișiere audio/video compatibile
4. Caută, apoi apasă direct pe imaginea rezultatului. „Încarcă mai multe rezultate” paginează YouTube/Internet Archive. „Extinde biblioteca” caută termeni suplimentari în toate cele trei surse.
5. Unele rezultate nu pot fi redate încorporat din cauza formatului, licenței sau restricțiilor sursei.
6. Aplicația nu descarcă media protejată și nu ocolește restricții.
7. Pentru YouTube este necesară cheia API proprie; cotele și regulile Google se aplică.
8. Este o aplicație web statică; nu necesită server propriu sau abonament de găzduire în afara GitHub Pages.

Versiunea 11: interfață inspirată de YouTube, două miniaturi pe rând, fără link extern de deschidere în card; atingerea miniaturii pornește redarea în playerul G-Way și derulează la player. YouTube rămâne în playerul oficial încorporat.

Versiunea 12:
- Pagina principală nu mai afișează categorii sub căutare; încarcă automat un flux mixt de miniaturi.
- Căutarea manuală rămâne disponibilă.
- Pentru audio HTML5 compatibil se setează Media Session și comenzile Play/Pause/Next/Previous pe ecranul blocat, dacă iOS le permite.
- Limitare importantă: GitHub Pages PWA nu poate garanta rularea în fundal după blocarea ecranului pe iPhone. YouTube embedded nu oferă redare garantată cu ecranul stins; aceasta depinde de regulile YouTube și iOS. Pentru suport robust este necesară o aplicație iOS nativă cu background audio entitlement.
