'use strict';

const form = document.getElementById('searchForm');
const queryInput = document.getElementById('q');
const results = document.getElementById('items');
const message = document.getElementById('message');
const count = document.getElementById('count');
let playerArea = document.getElementById('player');
const playerStatus = document.getElementById('playStatus');
const nowPlaying = document.getElementById('nowPlaying');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

async function searchMaterials(term) {
  const q = String(term || '').trim();
  if (!q) {
    message.textContent = 'Scrie un cuvânt în căsuța de căutare.';
    queryInput.focus();
    return;
  }

  message.textContent = 'Caut în Internet Archive…';
  count.textContent = 'Se caută…';
  results.replaceChildren();

  const params = new URLSearchParams({
    q: `(${q}) AND mediatype:(movies OR audio)`,
    'fl[]': 'identifier,title,description,year,mediatype',
    rows: '24',
    page: '1',
    output: 'json',
    'sort[]': 'downloads desc'
  });

  try {
    const response = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`);
    if (!response.ok) throw new Error(`Serverul a răspuns cu codul ${response.status}.`);
    const data = await response.json();
    const docs = data?.response?.docs || [];

    count.textContent = `${docs.length} rezultate`;
    if (docs.length === 0) {
      message.textContent = 'Nu am găsit rezultate. Încearcă un termen mai general sau o categorie.';
      return;
    }

    message.textContent = 'Am găsit materiale. Alege unul pentru a verifica dacă poate fi redat aici.';
    for (const item of docs) {
      const card = document.createElement('article');
      card.className = 'item';

      const title = document.createElement('h3');
      title.textContent = item.title || item.identifier || 'Material fără titlu';

      const info = document.createElement('p');
      info.textContent = [item.year, item.mediatype].filter(Boolean).join(' · ');

      const description = document.createElement('p');
      const desc = Array.isArray(item.description) ? item.description[0] : (item.description || '');
      description.textContent = String(desc).slice(0, 150);

      const playButton = document.createElement('button');
      playButton.type = 'button';
      playButton.textContent = 'Verifică redarea';
      playButton.addEventListener('click', () => playMaterial(item));

      const sourceButton = document.createElement('button');
      sourceButton.type = 'button';
      sourceButton.className = 'secondary';
      sourceButton.textContent = 'Detalii sursă';
      sourceButton.addEventListener('click', () => {
        window.open(`https://archive.org/details/${encodeURIComponent(item.identifier)}`, '_blank', 'noopener');
      });

      card.append(title, info, description, playButton, sourceButton);
      results.appendChild(card);
    }
  } catch (error) {
    count.textContent = '—';
    message.textContent = `Căutarea nu a reușit: ${error.message} Verifică conexiunea și încearcă din nou.`;
  }
}

async function playMaterial(item) {
  playerStatus.textContent = 'Se verifică fișierele…';
  nowPlaying.textContent = item.title || item.identifier || '';
  playerArea.pause(); playerArea.removeAttribute('src'); playerArea.load();

  try {
    const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(item.identifier)}`);
    if (!response.ok) throw new Error('Metadatele materialului nu sunt disponibile.');
    const metadata = await response.json();
    const files = metadata.files || [];

    const candidates = files
      .filter(file => file.name && !file.name.includes('_thumb'))
      .map(file => ({ ...file, ext: (file.name.split('.').pop() || '').toLowerCase() }))
      .filter(file => ['mp3', 'm4a', 'ogg', 'oga', 'wav', 'mp4', 'm4v', 'webm'].includes(file.ext));

    if (!candidates.length) {
      throw new Error('Materialul nu are un fișier compatibil pentru redare directă.');
    }

    candidates.sort((a, b) => {
      const rank = ext => ({ mp4: 0, mp3: 1, m4a: 2, webm: 3, ogg: 4, oga: 5, wav: 6, m4v: 7 }[ext] ?? 99);
      return rank(a.ext) - rank(b.ext);
    });

    const file = candidates[0];
    const encodedPath = file.name.split('/').map(encodeURIComponent).join('/');
    const media = document.createElement(['mp3', 'm4a', 'ogg', 'oga', 'wav'].includes(file.ext) ? 'audio' : 'video');
    media.controls = true;
    media.playsInline = true;
    media.preload = 'metadata';
    media.src = `https://archive.org/download/${encodeURIComponent(item.identifier)}/${encodedPath}`;

    playerArea.replaceWith(media); media.id = 'player'; playerArea = media;
    playerStatus.textContent = 'Fișier găsit';
    media.play().catch(() => {
      playerStatus.textContent = 'Apasă butonul Play din player.';
    });
  } catch (error) {
    playerArea.pause(); playerArea.removeAttribute('src'); playerArea.load(); message.textContent = error.message;
    playerStatus.textContent = 'Indisponibil';
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  searchMaterials(queryInput.value);
});

document.querySelectorAll('[data-q]').forEach(button => {
  button.addEventListener('click', () => searchMaterials(button.dataset.q));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.warn('Service worker nu a putut fi înregistrat:', error);
    });
  });
}
