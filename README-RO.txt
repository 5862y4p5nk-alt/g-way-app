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

Versiunea 13: interfață mai prietenoasă, secțiune Explorează cu carduri vizuale, căutare simplă, grilă de rezultate și navigare inferioară. Limitările PWA/iOS pentru redare cu ecranul stins rămân; această versiune nu transformă site-ul într-o aplicație iOS nativă.

Versiunea 14: interfață întunecată, fără bara de navigare de jos și fără carduri de categorii; pagina pune în prim-plan căutarea și fluxul de miniaturi video. La pornire încearcă să încarce automat materiale din sursele configurate. Pentru YouTube este necesară cheia API salvată pe telefon. Limitările iOS/PWA și ale playerului YouTube privind redarea cu ecranul stins rămân.

Versiunea 15: tema întunecată este setată și în meta theme-color și în CSS; miniaturile sunt mai mari, fără rame roșii sau cercuri decorative, cu colțuri ușor rotunjite și buton Play discret. Bara de navigare de jos rămâne eliminată.

Versiunea 16: secțiunea «Despre conținut» eliminată; playerul mutat imediat sub bara de căutare, deasupra rezultatelor; eliminată derularea automată către player când se selectează un material. Ajustări pentru ecrane iPhone.

Versiunea 17 corectată: playerul este imediat sub antet, înaintea titlului, căutării și rezultatelor; secțiunea «Despre conținut» este eliminată din HTML și ascunsă defensiv în CSS; eliminată derularea automată la selectarea unui material. Pentru a publica această versiune, înlocuiește toate fișierele din rădăcina repository-ului și fă Commit changes.

Versiunea 18: playerul este plasat direct după formularul de căutare, în interiorul zonei principale, înaintea setărilor și rezultatelor. Secțiunea «Despre conținut» este eliminată din HTML. Derularea automată către player este dezactivată. Cache-ul PWA a fost actualizat la v18.


Versiunea 20 – redare automată în lanț:
- Lista de redare include numai materiale audio și video; imaginile nu blochează redarea.
- La terminarea unui material, pornește următorul din listă.
- Dacă un material nu poate fi redat sau nu este disponibil, aplicația încearcă următorul.
- După ultimul material, lista se oprește.
- Interfața existentă este păstrată.


Versiunea 21 – numai media redabilă:
- Rezultatele de căutare includ doar videoclipuri și materiale audio.
- Fotografiile și imaginile statice (JPEG, PNG, GIF, SVG, WebP, TIFF etc.) sunt excluse.
- Miniaturile rămân doar ca previzualizări pentru videoclipuri.
- Interfața și redarea automată din versiunea 20 sunt păstrate.


Versiunea 22 – corecție redare YouTube consecutivă:
- Playerul YouTube este reutilizat între videoclipuri YouTube consecutive, în loc să fie distrus și recreat la fiecare trecere.
- Următorul videoclip este încărcat în același player prin loadVideoById, pentru a evita blocarea pornirii automate cauzată de recrearea iframe-ului pe iPhone.
- Se păstrează filtrarea doar audio/video și interfața existentă.


Versiunea 23 – playlist YouTube nativ:
- Videoclipurile YouTube consecutive sunt transmise playerului YouTube ca o listă nativă.
- YouTube gestionează trecerea automată între videoclipurile din acea listă.
- G-Way actualizează contorul și titlul după identificarea videoclipului curent.
- La finalul grupului YouTube, redarea revine la următorul material din lista mixtă.
- Dacă YouTube blochează autoplay, aplicația afișează un mesaj explicit; nu poate ocoli politica browserului.
- Interfața și filtrarea doar audio/video sunt păstrate.
