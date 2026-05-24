// ═══════════════════════════════════════════════════════════════
// GRE Study — App logic
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'gre-study-v1';

const DEFAULT_STATE = {
  selectedGroups: [],
  mastered: {},       // groupNum -> true (a group is "mastered" after one full session)
  groupStats: {},     // groupNum -> { sessions, lastDone (ISO), avgFirstTry }
  shuffle: true,
};

let state = loadState();
let session = null;       // active study session
let currentTab = 'flashcards';

// ─────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────
// Toast helper
// ─────────────────────────────────────────────────────────────

let toastTimer = null;
function toast(message, ms = 2000) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// ─────────────────────────────────────────────────────────────
// Date pill
// ─────────────────────────────────────────────────────────────

function updateDatePill() {
  const now = new Date();
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  document.getElementById('date-pill').textContent =
    `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]}`;
}

// ─────────────────────────────────────────────────────────────
// Tab switching
// ─────────────────────────────────────────────────────────────

function switchTab(name) {
  currentTab = name;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${name}`);
  });
  // Lazy-render heavy tabs
  if (name === 'clusters' && !document.getElementById('clusters-list').children.length) {
    renderClusters('');
  }
  if (name === 'quant' && !document.getElementById('quant-list').children.length) {
    renderQuant('');
  }
}

document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => switchTab(t.dataset.tab));
});

// ═══════════════════════════════════════════════════════════════
// FLASHCARDS — Group picker
// ═══════════════════════════════════════════════════════════════

function renderGroupPicker() {
  const grid = document.getElementById('group-grid');
  grid.innerHTML = '';
  const groups = allGroups();
  groups.forEach(g => {
    const chip = document.createElement('button');
    chip.className = 'group-chip';
    if (state.selectedGroups.includes(g)) chip.classList.add('selected');
    if (state.mastered[g]) chip.classList.add('mastered');

    const num = document.createElement('div');
    num.className = 'group-chip-num';
    num.textContent = `G${g}`;
    chip.appendChild(num);

    const meta = document.createElement('div');
    meta.className = 'group-chip-meta';
    const wordCount = vocabByGroup(g).length;
    meta.textContent = `${wordCount}w`;
    chip.appendChild(meta);

    chip.addEventListener('click', () => toggleGroup(g));
    grid.appendChild(chip);
  });
  updateSelectedCount();
  updateStartBtn();
}

function toggleGroup(g) {
  const idx = state.selectedGroups.indexOf(g);
  if (idx >= 0) state.selectedGroups.splice(idx, 1);
  else state.selectedGroups.push(g);
  state.selectedGroups.sort((a, b) => a - b);
  saveState();
  renderGroupPicker();
}

function updateSelectedCount() {
  const n = state.selectedGroups.length;
  const wordsCount = state.selectedGroups.reduce((sum, g) => sum + vocabByGroup(g).length, 0);
  document.getElementById('selected-count').textContent =
    n === 0 ? '0 selected' : `${n} group${n>1?'s':''} · ${wordsCount} words`;
}

function updateStartBtn() {
  document.getElementById('start-btn').disabled = state.selectedGroups.length === 0;
}

document.getElementById('pick-all').addEventListener('click', () => {
  state.selectedGroups = allGroups();
  saveState();
  renderGroupPicker();
});
document.getElementById('pick-none').addEventListener('click', () => {
  state.selectedGroups = [];
  saveState();
  renderGroupPicker();
});
document.getElementById('pick-unmastered').addEventListener('click', () => {
  state.selectedGroups = allGroups().filter(g => !state.mastered[g]);
  saveState();
  renderGroupPicker();
});
document.getElementById('pick-random5').addEventListener('click', () => {
  const groups = allGroups().slice();
  for (let i = groups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [groups[i], groups[j]] = [groups[j], groups[i]];
  }
  state.selectedGroups = groups.slice(0, 5).sort((a, b) => a - b);
  saveState();
  renderGroupPicker();
});

document.getElementById('shuffle-toggle').addEventListener('change', e => {
  state.shuffle = e.target.checked;
  saveState();
});

// ═══════════════════════════════════════════════════════════════
// FLASHCARDS — Study session
// ═══════════════════════════════════════════════════════════════

function startSession() {
  if (state.selectedGroups.length === 0) return;

  // Collect all words from selected groups
  let words = [];
  state.selectedGroups.forEach(g => {
    words = words.concat(vocabByGroup(g));
  });

  if (state.shuffle) {
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
  }

  session = {
    queue: words.slice(),                 // cards still to master
    total: words.length,                  // initial unique words
    mastered: 0,                          // unique words mastered
    seen: new Set(),                      // words attempted at least once
    correctFirstTry: 0,                   // unique words gotten right on FIRST attempt
    totalFlips: 0,                        // every time a card is shown
    wrongOnce: new Set(),                 // words ever gotten wrong (lose first-try eligibility)
    flipped: false,
    current: null,
  };

  document.getElementById('group-picker').style.display = 'none';
  document.getElementById('session').classList.add('active');
  document.getElementById('session-done').style.display = 'none';

  nextCard();
}

function nextCard() {
  if (!session) return;

  if (session.queue.length === 0) {
    finishSession();
    return;
  }

  session.current = session.queue.shift();
  session.flipped = false;
  session.totalFlips++;

  document.getElementById('flashcard').classList.remove('flipped');
  document.getElementById('card-word').textContent = session.current.w;
  document.getElementById('card-group-label').textContent =
    `Group ${session.current.g}`;

  document.getElementById('card-back-word').textContent = session.current.w;
  document.getElementById('card-back-def').textContent = session.current.d;
  document.getElementById('card-back-ex').textContent = session.current.e
    ? `"${session.current.e}"`
    : '';
  document.getElementById('card-back-meta').textContent = `Group ${session.current.g}`;

  // Disable answer buttons until card is flipped
  document.getElementById('btn-wrong').disabled = true;
  document.getElementById('btn-right').disabled = true;

  updateProgress();
}

function updateProgress() {
  if (!session) return;
  document.getElementById('prog-done').textContent = session.mastered;
  document.getElementById('prog-total').textContent = session.total;
  document.getElementById('prog-remain').textContent =
    session.queue.length + (session.current ? 1 : 0);

  const pct = (session.mastered / session.total) * 100;
  document.getElementById('progress-fill').style.width = `${pct}%`;
}

function flipCard() {
  if (!session || !session.current) return;
  session.flipped = !session.flipped;
  document.getElementById('flashcard').classList.toggle('flipped', session.flipped);
  // Enable answer buttons once flipped to back
  if (session.flipped) {
    document.getElementById('btn-wrong').disabled = false;
    document.getElementById('btn-right').disabled = false;
  }
}

function answerWrong() {
  if (!session || !session.current || !session.flipped) return;
  // Mark this word as having been wrong (loses first-try eligibility)
  session.wrongOnce.add(session.current.w);
  // Push back into queue at a delayed position (so you don't see it immediately)
  const card = session.current;
  // Insert ~4 positions deep, but cap at end if queue is short
  const insertAt = Math.min(4, session.queue.length);
  session.queue.splice(insertAt, 0, card);
  session.seen.add(card.w);
  session.current = null;
  nextCard();
}

function answerRight() {
  if (!session || !session.current || !session.flipped) return;
  // Word is mastered for this session
  session.mastered++;
  if (!session.wrongOnce.has(session.current.w) && !session.seen.has(session.current.w)) {
    session.correctFirstTry++;
  }
  session.seen.add(session.current.w);
  session.current = null;
  nextCard();
}

function finishSession() {
  // Mark all selected groups as mastered (this session at least)
  state.selectedGroups.forEach(g => {
    state.mastered[g] = true;
    const s = state.groupStats[g] || { sessions: 0 };
    s.sessions = (s.sessions || 0) + 1;
    s.lastDone = new Date().toISOString();
    state.groupStats[g] = s;
  });
  saveState();

  document.getElementById('session').classList.remove('active');
  document.getElementById('session-done').style.display = 'block';
  document.getElementById('stat-words').textContent = session.total;
  document.getElementById('stat-correct').textContent = session.correctFirstTry;
  document.getElementById('stat-flips').textContent = session.totalFlips;

  const pct = session.total > 0 ? Math.round((session.correctFirstTry / session.total) * 100) : 0;
  document.getElementById('done-sub').textContent =
    `${pct}% first-try accuracy across ${state.selectedGroups.length} group${state.selectedGroups.length>1?'s':''}.`;

  session = null;
}

function exitSession() {
  if (!session) return;
  if (session.mastered > 0 && !confirm('Exit this session? Progress on this session will be lost.')) return;
  session = null;
  document.getElementById('session').classList.remove('active');
  document.getElementById('group-picker').style.display = 'block';
  document.getElementById('session-done').style.display = 'none';
  renderGroupPicker();
}

// Wire up interactions
document.getElementById('start-btn').addEventListener('click', startSession);
document.getElementById('flashcard').addEventListener('click', flipCard);
document.getElementById('btn-wrong').addEventListener('click', answerWrong);
document.getElementById('btn-right').addEventListener('click', answerRight);
document.getElementById('session-exit').addEventListener('click', exitSession);
document.getElementById('done-back').addEventListener('click', () => {
  document.getElementById('session-done').style.display = 'none';
  document.getElementById('group-picker').style.display = 'block';
  renderGroupPicker();
});

// Keyboard shortcuts (handy on desktop)
document.addEventListener('keydown', e => {
  if (!session || !session.current) return;
  if (currentTab !== 'flashcards') return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    flipCard();
  } else if (session.flipped && (e.key === 'ArrowLeft' || e.key === 'j')) {
    e.preventDefault();
    answerWrong();
  } else if (session.flipped && (e.key === 'ArrowRight' || e.key === 'k')) {
    e.preventDefault();
    answerRight();
  }
});

// Swipe gestures for mobile (on the card itself)
(function setupSwipe() {
  const card = document.getElementById('flashcard-wrap');
  let startX = 0, startY = 0, startTime = 0, swiped = false;
  card.addEventListener('touchstart', e => {
    if (!session || !session.flipped) return;
    const t = e.changedTouches[0];
    startX = t.clientX; startY = t.clientY; startTime = Date.now(); swiped = false;
  }, { passive: true });
  card.addEventListener('touchend', e => {
    if (!session || !session.flipped) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const dt = Date.now() - startTime;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 600) {
      swiped = true;
      if (dx > 0) answerRight(); else answerWrong();
      // Prevent the tap-flip from also firing
      e.preventDefault();
    }
  });
  // If swiped, suppress the click that follows on some browsers
  card.addEventListener('click', e => {
    if (swiped) { swiped = false; e.stopImmediatePropagation(); }
  }, true);
})();

// ═══════════════════════════════════════════════════════════════
// CLUSTERS
// ═══════════════════════════════════════════════════════════════

function defForWord(word) {
  const lower = word.toLowerCase();
  const v = VOCAB.find(x => x.w.toLowerCase() === lower);
  if (v) return v.d;
  // Fall back to cluster-only extension words
  if (typeof EXTRA_DEFS !== 'undefined' && EXTRA_DEFS[lower]) return EXTRA_DEFS[lower];
  return null;
}

function renderClusters(filter = '') {
  const list = document.getElementById('clusters-list');
  list.innerHTML = '';
  const f = filter.trim().toLowerCase();

  CLUSTERS.forEach(c => {
    let matchesTitle = !f
      || c.title.toLowerCase().includes(f)
      || c.gist.toLowerCase().includes(f);
    const matchingWords = c.words.filter(w => !f || w.toLowerCase().includes(f));
    if (!matchesTitle && matchingWords.length === 0) return;

    const wordsToShow = f ? (matchesTitle ? c.words : matchingWords) : c.words;

    const card = document.createElement('div');
    card.className = 'cluster';
    if (f) card.classList.add('open');

    const head = document.createElement('div');
    head.className = 'cluster-head';
    head.innerHTML = `
      <div class="cluster-title-block">
        <div class="cluster-title">${escapeHtml(c.title)}</div>
        <div class="cluster-count">${c.words.length} words</div>
      </div>
      <div class="cluster-chev">▾</div>
    `;
    head.addEventListener('click', () => card.classList.toggle('open'));
    card.appendChild(head);

    const body = document.createElement('div');
    body.className = 'cluster-body';
    body.innerHTML = `<div class="cluster-gist">${escapeHtml(c.gist)}</div>`;
    const wordsWrap = document.createElement('div');
    wordsWrap.className = 'cluster-words';

    wordsToShow.forEach(word => {
      const def = defForWord(word);
      const wEl = document.createElement('div');
      wEl.className = 'cluster-word';
      if (def) {
        wEl.innerHTML = `<div class="cw-word">${escapeHtml(word)}</div><div class="cw-def">${escapeHtml(def)}</div>`;
      } else {
        wEl.innerHTML = `<div class="cw-word">${escapeHtml(word)}</div><div class="cw-missing">(definition not in main list)</div>`;
      }
      wordsWrap.appendChild(wEl);
    });

    body.appendChild(wordsWrap);
    card.appendChild(body);
    list.appendChild(card);
  });

  if (list.children.length === 0) {
    list.innerHTML = `<div class="card" style="text-align:center; color:var(--muted); font-style:italic; font-family:'DM Serif Display', serif;">No clusters or words match "${escapeHtml(filter)}"</div>`;
  }
}

document.getElementById('cluster-search').addEventListener('input', e => {
  renderClusters(e.target.value);
});

// ═══════════════════════════════════════════════════════════════
// QUANT
// ═══════════════════════════════════════════════════════════════

function renderQuant(filter = '') {
  const list = document.getElementById('quant-list');
  list.innerHTML = '';
  const f = filter.trim().toLowerCase();

  QUANT.forEach((sec, idx) => {
    const matchingRows = sec.rows.filter(r => {
      if (!f) return true;
      return (
        r.concept.toLowerCase().includes(f) ||
        r.rule.toLowerCase().includes(f) ||
        (r.note || '').toLowerCase().includes(f)
      );
    });
    const titleMatch = !f || sec.title.toLowerCase().includes(f);

    if (!titleMatch && matchingRows.length === 0) return;

    const showRows = f ? matchingRows : sec.rows;

    const card = document.createElement('div');
    card.className = 'quant-section';
    if (f) card.classList.add('open');

    const head = document.createElement('div');
    head.className = 'quant-head';
    head.innerHTML = `
      <div class="quant-num">${String(idx + 1).padStart(2, '0')}</div>
      <div class="quant-title">${escapeHtml(sec.title)}</div>
      <div class="quant-chev">▾</div>
    `;
    head.addEventListener('click', () => card.classList.toggle('open'));
    card.appendChild(head);

    const body = document.createElement('div');
    body.className = 'quant-body';
    showRows.forEach(r => {
      const row = document.createElement('div');
      row.className = 'quant-row';
      row.innerHTML = `
        <div class="qr-concept">${escapeHtml(r.concept)}</div>
        <div class="qr-rule">${escapeHtml(r.rule)}</div>
        ${r.note ? `<div class="qr-note">${escapeHtml(r.note)}</div>` : ''}
      `;
      body.appendChild(row);
    });
    card.appendChild(body);
    list.appendChild(card);
  });

  if (list.children.length === 0) {
    list.innerHTML = `<div class="card" style="text-align:center; color:var(--muted); font-style:italic; font-family:'DM Serif Display', serif;">No formulas match "${escapeHtml(filter)}"</div>`;
  }
}

document.getElementById('quant-search').addEventListener('input', e => {
  renderQuant(e.target.value);
});

// ═══════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════════════
// Boot
// ═══════════════════════════════════════════════════════════════

function init() {
  updateDatePill();
  setInterval(updateDatePill, 60_000); // refresh every minute
  document.getElementById('shuffle-toggle').checked = state.shuffle !== false;
  renderGroupPicker();
}

init();
