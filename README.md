# GRE Study

A clean, distraction-free PWA for GRE prep. Three tabs:

1. **Flashcards** — All 1,110 GregMat words (37 groups × 30). Tap to flip, swipe right when you got it, swipe left when you didn't. Wrong cards loop back into the queue until every word in your selected groups is mastered for this session.
2. **Clusters** — 60+ thematic synonym clusters for the initial learning phase. Learn 8–12 words that mean roughly the same thing together, then drill individual recall on flashcards.
3. **Quant** — The full quant cheat sheet (number properties, exponents, algebra, geometry, statistics, QC strategy, traps, must-memorize values, data interpretation, test-day strategy) — searchable, collapsible, designed for daily glance-over.

Works offline. Installs as a real app on your phone. All progress saved in localStorage on the device.

---

## Deploy to GitHub Pages

1. Create a new GitHub repo (public is simplest; private works on a paid plan).
2. Push every file in this folder to the repo root:
   ```
   index.html
   app.js
   sw.js
   manifest.webmanifest
   icon-192.png
   icon-512.png
   data/vocab.js
   data/clusters.js
   data/quant.js
   README.md
   ```
3. In the repo: **Settings → Pages → Source → Deploy from a branch**.
4. Pick branch `main` and folder `/ (root)`. Save.
5. Wait ~1 minute. GitHub gives you a URL like `https://<your-username>.github.io/<repo-name>/`.
6. Open that URL on your phone in Safari (iOS) or Chrome (Android).

### Install as a home-screen app

- **iOS Safari**: tap Share → "Add to Home Screen" → Add.
- **Android Chrome**: tap the three-dot menu → "Install app" (or "Add to Home Screen").

Once installed, it runs fullscreen with no browser chrome, works offline, and feels native.

---

## How to use

### Flashcards

- Pick the groups you want to study (or use **All**, **Unmastered**, or **Random 5**).
- Tap **Start Study Session**.
- Tap the card to flip; the back shows the definition and an example.
- Then tap **Got it right** or **Got it wrong** (or swipe right / left on mobile, or use the arrow keys on desktop).
- Wrong cards are re-inserted ~4 positions deep into the queue — you'll see them again after a few others, then again, until they're right.
- A session is complete when every word has been gotten right at least once. The end screen shows your first-try accuracy.
- Groups you complete get a small green dot in the picker. Use the **Unmastered** filter to focus on what's left.

### Clusters

- Tap any cluster to expand and see the words plus their definitions.
- Use the search box to find a topic ("praise", "stubborn") or a specific word ("obdurate").

### Quant

- 14 sections, each collapsible. Daily review: open one section, glance through the rows, close, move on.
- Use the search to jump straight to a concept ("median", "discriminant", "Pythagorean").

---

## Local development

No build step. Just open `index.html` in a browser — though for the service worker and PWA features to actually work, serve over HTTP:

```bash
cd gre-study
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Editing content

- **Vocab words/definitions/examples**: edit `data/vocab.js`. Each entry is `{ g: <group>, w: "word", d: "definition", e: "example" }`.
- **Clusters**: edit `data/clusters.js`. Add a new object to `CLUSTERS` with `id`, `title`, `gist`, and a `words: [...]` list.
- **Quant**: edit `data/quant.js`. Add a section to `QUANT` with `id`, `title`, and a `rows: [{ concept, rule, note }]` array.

After editing, bump the cache name in `sw.js` (e.g., `gre-study-v1` → `gre-study-v2`) so phones pull the new version.

---

## Reset progress

Open browser DevTools console and run:

```js
localStorage.removeItem('gre-study-v1'); location.reload();
```

Or, since progress is per-device, just install on a new phone.
