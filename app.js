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
  if (name === 'sort' && typeof showGameSetup === 'function') {
    // If no game is in progress, show the setup screen
    if (typeof gameState === 'undefined' || !gameState) showGameSetup();
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

// ═══════════════════════════════════════════════════════════════
// SORT GAME
// ═══════════════════════════════════════════════════════════════

const GAME_CONFIGS = [
  { label: 'Easy',   clusters: 3, wordsEach: 3 },
  { label: 'Medium', clusters: 4, wordsEach: 4 },
  { label: 'Hard',   clusters: 5, wordsEach: 5 },
];
let gameCfgIdx = 0;
let gameState  = null;   // active game
let dragObj    = null;   // active drag { wordIdx, ghost, chip }
const GAME_HISTORY_KEY = 'gre-sort-history-v1';

// ─── Difficulty selection ────────────────────────────────────

document.getElementById('diff-row').addEventListener('click', e => {
  const btn = e.target.closest('.diff-btn');
  if (!btn) return;
  gameCfgIdx = parseInt(btn.dataset.idx);
  document.querySelectorAll('.diff-btn').forEach((b, i) => {
    b.classList.toggle('active', i === gameCfgIdx);
  });
});

// ─── Build a round ───────────────────────────────────────────

function pickGameRound(nClusters, nEach) {
  const shuffled = [...CLUSTERS].sort(() => Math.random() - 0.5);
  const chosen = [];
  const usedWords = new Set();

  for (const cluster of shuffled) {
    if (chosen.length >= nClusters) break;
    const available = cluster.words.filter(w => !usedWords.has(w.toLowerCase()));
    if (available.length < nEach) continue;
    const sample = [...available].sort(() => Math.random() - 0.5).slice(0, nEach);
    sample.forEach(w => usedWords.add(w.toLowerCase()));
    chosen.push({ cluster, words: sample });
  }
  return chosen;
}

// ─── Start / render ──────────────────────────────────────────

document.getElementById('game-start-btn').addEventListener('click', startSortGame);
document.getElementById('game-again-btn').addEventListener('click', startSortGame);
document.getElementById('game-back-btn').addEventListener('click', showGameSetup);
document.getElementById('game-exit-btn').addEventListener('click', () => {
  if (gameState && !confirm('Exit this game? Progress will be lost.')) return;
  gameState = null;
  showGameSetup();
});

function showGameSetup() {
  document.getElementById('game-setup').style.display = 'block';
  document.getElementById('game-active').style.display = 'none';
  document.getElementById('game-done').style.display = 'none';
  renderGameHistory();
}

function startSortGame() {
  const cfg = GAME_CONFIGS[gameCfgIdx];
  const rounds = pickGameRound(cfg.clusters, cfg.wordsEach);
  if (rounds.length < cfg.clusters) {
    toast('Not enough distinct words — try an easier difficulty.', 2500);
    return;
  }

  // Flatten all words into a pool
  const pool = [];
  rounds.forEach(({ cluster, words }) => {
    words.forEach(w => pool.push({ word: w, clusterId: cluster.id, placed: false }));
  });
  pool.sort(() => Math.random() - 0.5);

  gameState = {
    rounds,
    pool,
    total:         pool.length,
    placed:        0,
    firstTry:      0,
    mistakes:      0,
    wrongAttempts: {}, // wordIdx -> count before correct
  };

  document.getElementById('game-setup').style.display = 'none';
  document.getElementById('game-done').style.display = 'none';
  document.getElementById('game-active').style.display = 'block';
  renderSortGame();
}

function renderSortGame() {
  if (!gameState) return;

  // Progress
  document.getElementById('game-progress').textContent =
    `${gameState.placed} / ${gameState.total} sorted`;
  document.getElementById('game-prog-bar').style.width =
    `${(gameState.placed / gameState.total) * 100}%`;

  // Word pool
  const poolEl = document.getElementById('word-pool');
  poolEl.innerHTML = '';
  const remaining = gameState.pool.filter(e => !e.placed);
  if (remaining.length === 0) {
    poolEl.innerHTML = '<div class="word-pool-empty">All sorted!</div>';
  } else {
    gameState.pool.forEach((entry, idx) => {
      if (entry.placed) return;
      const chip = document.createElement('div');
      chip.className = 'word-chip';
      chip.textContent = entry.word;
      chip.dataset.wordIdx = idx;
      chip.addEventListener('mousedown',  onChipMouseDown,  { passive: false });
      chip.addEventListener('touchstart', onChipTouchStart, { passive: false });
      poolEl.appendChild(chip);
    });
  }

  // Cluster drop-zones
  const zonesEl = document.getElementById('cluster-zones');
  zonesEl.innerHTML = '';
  gameState.rounds.forEach(({ cluster }) => {
    const zone = document.createElement('div');
    zone.className = 'drop-zone';
    zone.dataset.clusterId = cluster.id;

    const title = document.createElement('div');
    title.className = 'drop-zone-title';
    title.textContent = cluster.title;

    const gist = document.createElement('div');
    gist.className = 'drop-zone-gist';
    gist.textContent = cluster.gist;

    const words = document.createElement('div');
    words.className = 'drop-zone-words';
    words.id = `zone-words-${cluster.id}`;

    // Re-render already-placed words
    gameState.pool
      .filter(e => e.placed && e.clusterId === cluster.id)
      .forEach(e => {
        const pw = document.createElement('div');
        pw.className = 'placed-word';
        pw.textContent = e.word;
        words.appendChild(pw);
      });

    zone.appendChild(title);
    zone.appendChild(gist);
    zone.appendChild(words);
    zonesEl.appendChild(zone);
  });
}

// ─── Drop handling ───────────────────────────────────────────

function handleDrop(wordIdx, zoneEl) {
  if (!gameState) return;
  const entry = gameState.pool[wordIdx];
  const targetId = zoneEl.dataset.clusterId;

  if (entry.clusterId === targetId) {
    // ✓ Correct
    entry.placed = true;
    gameState.placed++;
    if (!gameState.wrongAttempts[wordIdx]) gameState.firstTry++;

    // Remove chip from pool
    const chip = document.querySelector(`.word-chip[data-word-idx="${wordIdx}"]`);
    if (chip) chip.remove();

    // Add placed-word tag to zone
    const wordsEl = document.getElementById(`zone-words-${targetId}`);
    if (wordsEl) {
      const pw = document.createElement('div');
      pw.className = 'placed-word';
      pw.textContent = entry.word;
      wordsEl.appendChild(pw);
    }

    // Flash zone green
    zoneEl.classList.add('drop-correct');
    setTimeout(() => zoneEl.classList.remove('drop-correct'), 600);

    // Update progress
    document.getElementById('game-progress').textContent =
      `${gameState.placed} / ${gameState.total} sorted`;
    document.getElementById('game-prog-bar').style.width =
      `${(gameState.placed / gameState.total) * 100}%`;

    // Pool empty label
    const poolEl = document.getElementById('word-pool');
    if (poolEl && !poolEl.children.length) {
      poolEl.innerHTML = '<div class="word-pool-empty">All sorted!</div>';
    }

    if (gameState.placed === gameState.total) {
      setTimeout(finishSortGame, 450);
    }

  } else {
    // ✗ Wrong
    gameState.mistakes++;
    gameState.wrongAttempts[wordIdx] = (gameState.wrongAttempts[wordIdx] || 0) + 1;

    // Flash zone red + shake
    zoneEl.classList.add('drop-wrong', 'shake');
    setTimeout(() => zoneEl.classList.remove('drop-wrong', 'shake'), 420);

    toast(`Not quite — try another cluster.`, 1400);
  }
}

// ─── Game over ───────────────────────────────────────────────

function finishSortGame() {
  if (!gameState) return;
  const pct = Math.round((gameState.firstTry / gameState.total) * 100);
  const title = pct === 100 ? 'Perfect! 🎉' : pct >= 80 ? 'Great work!' : pct >= 60 ? 'Nice try!' : 'Keep at it!';

  document.getElementById('game-done-icon').textContent = pct === 100 ? '★' : '✓';
  document.getElementById('game-done-title').textContent = title;
  document.getElementById('game-done-sub').textContent =
    `${gameState.firstTry} of ${gameState.total} words placed correctly on the first try (${pct}%).`;
  document.getElementById('game-stat-correct').textContent = gameState.firstTry;
  document.getElementById('game-stat-total').textContent = gameState.total;
  document.getElementById('game-stat-mistakes').textContent = gameState.mistakes;

  // Save history
  saveGameHistory({ pct, firstTry: gameState.firstTry, total: gameState.total,
                    config: GAME_CONFIGS[gameCfgIdx].label, ts: Date.now() });

  document.getElementById('game-active').style.display = 'none';
  document.getElementById('game-done').style.display = 'block';
  gameState = null;
}

// ─── History ─────────────────────────────────────────────────

function saveGameHistory(entry) {
  try {
    const raw = localStorage.getItem(GAME_HISTORY_KEY);
    const hist = raw ? JSON.parse(raw) : [];
    hist.unshift(entry);
    if (hist.length > 8) hist.length = 8;
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(hist));
  } catch (e) { /* ignore */ }
}

function renderGameHistory() {
  try {
    const raw = localStorage.getItem(GAME_HISTORY_KEY);
    const hist = raw ? JSON.parse(raw) : [];
    const card = document.getElementById('game-history-card');
    const list = document.getElementById('game-history-list');
    if (!hist.length) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    list.innerHTML = '';
    hist.forEach(h => {
      const row = document.createElement('div');
      row.className = 'hist-row';
      const when = new Date(h.ts);
      const label = `${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      row.innerHTML = `
        <div>
          <span style="font-weight:500">${h.config}</span>
          <span style="color:var(--hint); font-size:11px; margin-left:6px;">${label}</span>
        </div>
        <div class="hist-acc">${h.pct}%</div>`;
      list.appendChild(row);
    });
  } catch (e) { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════════
// DRAG ENGINE — works on both mouse and touch
// ═══════════════════════════════════════════════════════════════

function createGhost(chip, clientX, clientY) {
  const rect = chip.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.textContent = chip.textContent;
  ghost.style.width  = rect.width  + 'px';
  ghost.style.height = rect.height + 'px';
  ghost.style.left   = (clientX - rect.width  / 2) + 'px';
  ghost.style.top    = (clientY - rect.height / 2) + 'px';
  document.body.appendChild(ghost);
  return ghost;
}

function moveGhost(clientX, clientY) {
  if (!dragObj) return;
  const g = dragObj.ghost;
  g.style.left = (clientX - g.offsetWidth  / 2) + 'px';
  g.style.top  = (clientY - g.offsetHeight / 2) + 'px';

  // Highlight zone under finger — hide ghost momentarily so hit-test sees through it
  g.style.visibility = 'hidden';
  const el = document.elementFromPoint(clientX, clientY);
  g.style.visibility = 'visible';

  document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
  const zone = el ? el.closest('.drop-zone') : null;
  if (zone) zone.classList.add('drag-over');
}

function endDragAt(clientX, clientY) {
  if (!dragObj) return;
  const g = dragObj.ghost;
  g.style.visibility = 'hidden';
  const el = document.elementFromPoint(clientX, clientY);
  g.remove();

  document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
  if (dragObj.chip) dragObj.chip.classList.remove('dragging-source');

  const zone = el ? el.closest('.drop-zone') : null;
  const idx  = dragObj.wordIdx;
  dragObj    = null;

  if (zone) handleDrop(idx, zone);
}

// Touch
function onChipTouchStart(e) {
  e.preventDefault();
  const chip = e.currentTarget;
  const t    = e.touches[0];
  dragObj    = { wordIdx: parseInt(chip.dataset.wordIdx),
                 ghost:   createGhost(chip, t.clientX, t.clientY),
                 chip };
  chip.classList.add('dragging-source');
}

document.addEventListener('touchmove', e => {
  if (!dragObj) return;
  e.preventDefault();
  const t = e.touches[0];
  moveGhost(t.clientX, t.clientY);
}, { passive: false });

document.addEventListener('touchend', e => {
  if (!dragObj) return;
  const t = e.changedTouches[0];
  endDragAt(t.clientX, t.clientY);
});

document.addEventListener('touchcancel', () => {
  if (!dragObj) return;
  dragObj.ghost.remove();
  if (dragObj.chip) dragObj.chip.classList.remove('dragging-source');
  document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
  dragObj = null;
});

// Mouse (desktop)
function onChipMouseDown(e) {
  e.preventDefault();
  const chip = e.currentTarget;
  dragObj    = { wordIdx: parseInt(chip.dataset.wordIdx),
                 ghost:   createGhost(chip, e.clientX, e.clientY),
                 chip };
  chip.classList.add('dragging-source');
}

document.addEventListener('mousemove', e => {
  if (!dragObj) return;
  moveGhost(e.clientX, e.clientY);
});

document.addEventListener('mouseup', e => {
  if (!dragObj) return;
  endDragAt(e.clientX, e.clientY);
});
