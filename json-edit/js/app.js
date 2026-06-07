const SECTION_NAMES = {
  lang: 'Language',
  hero: 'Hero',
  pill: 'Pills',
  info: 'Info Card',
  overview: 'Overview',
  gallery: 'Gallery',
  video: 'Video',
  details: 'Details',
  map: 'Map',
  contact: 'Contact',
  oldtown: 'Old Town',
  footer: 'Footer',
  a11y: 'Accessibility',
};

const LANGS = ['en', 'th', 'sv'];

function sectionOf(key) {
  const prefix = key.split('_')[0];
  return SECTION_NAMES[prefix] || 'Other';
}

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

function formatTime(d) {
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatBackupName(name) {
  const m = name.match(/^lang-(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})\.json$/);
  if (!m) return name;
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
}

function registerEditor() {
  Alpine.store('editor', {
    data: { en: {}, th: {}, sv: {} },
    original: { en: {}, th: {}, sv: {} },
    keys: [],
    sections: {},
    activeLang: 'en',
    viewMode: 'tabs',
    darkMode: false,
    sidebarOpen: false,
    search: '',
    collapsed: {},
    loading: true,
    saving: false,
    lastSaved: null,
    toast: null,
    modal: null,
    backups: [],
    isMobile: false,
    uiScale: null, // null = auto (driven by media queries)

    // Undo/redo: a global, coalesced history. activeEdit holds the
    // in-flight burst (focused textarea being typed into); its focusPrev
    // is the undo target. A burst commits when 600ms elapses with no
    // further input, on blur, or on any external state change (save, lang
    // switch, structural op). Cap of 200 entries.
    history: [],
    historyIdx: -1,
    activeEdit: null, // { key, lang, focusPrev, timer } | null

    // Keys that existed in `original` but the user has marked for deletion.
    // Save payload omits them (already absent from `data`); diff renders
    // them as (removed); dirtyCount includes them; undo of a delete clears
    // the entry from this set.
    deletedKeys: new Set(),

    // Open inline "+ Add key" form keyed by section name.
    addingSec: null,    // section name currently showing the input, or null
    addingValue: '',    // text typed into that input

    // Row controls: which key has its ⋯ menu open, and which key is
    // being inline-renamed (mutually exclusive of menuKey).
    menuKey: null,
    renamingKey: null,
    renamingValue: '',
    dragOver: false,
    previewOpen: false,
    previewIframe: null,   // bound on iframe load
    _previewTimer: null,

    async init() {
      const storedDark = localStorage.getItem('json-edit:dark');
      this.darkMode = storedDark === null
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : storedDark === 'true';
      this.applyDark();

      this.viewMode = localStorage.getItem('json-edit:view') || 'tabs';
      this.activeLang = localStorage.getItem('json-edit:lang') || 'en';

      const storedScale = localStorage.getItem('json-edit:scale');
      if (storedScale !== null) {
        const n = parseFloat(storedScale);
        if (!isNaN(n)) this.uiScale = n;
      }
      this.applyUiScale();

      const mqlMobile = window.matchMedia('(max-width: 1023px)');
      this.isMobile = mqlMobile.matches;
      mqlMobile.addEventListener('change', (e) => {
        this.isMobile = e.matches;
        this.growAll();
      });
      window.matchMedia('(min-width: 1024px)').addEventListener('change', () => this.growAll());
      window.matchMedia('(min-width: 1536px)').addEventListener('change', () => this.growAll());

      await this.load();
      this.tryRestoreDraft();

      window.addEventListener('keydown', (e) => {
        const cmd = e.ctrlKey || e.metaKey;
        if (cmd && (e.key === 's' || e.key === 'Enter')) {
          e.preventDefault();
          if (this.dirtyCount() > 0) this.modal = 'diff';
        }
        if (cmd && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          this.undo();
        }
        if (cmd && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          this.redo();
        }
        if (e.key === 'Escape') {
          if (this.revertField()) { e.preventDefault(); return; }
          this.modal = null;
        }
        if (cmd && e.key === 'k') {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
        }
      });

      window.addEventListener('beforeunload', (e) => {
        if (this.dirtyCount() > 0) {
          e.preventDefault();
          e.returnValue = '';
        }
      });

      window.addEventListener('dragenter', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        this.dragOver = true;
      });
      window.addEventListener('dragover', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
      });
      window.addEventListener('dragleave', (e) => {
        // Only hide when leaving the window entirely (relatedTarget null).
        if (e.relatedTarget === null) this.dragOver = false;
      });
      window.addEventListener('drop', (e) => {
        if (!e.dataTransfer?.files?.length) { this.dragOver = false; return; }
        e.preventDefault();
        this.dragOver = false;
        const file = e.dataTransfer.files[0];
        if (!file.name.toLowerCase().endsWith('.json')) {
          this.toastMsg('Drop a .json file', 'error');
          return;
        }
        this.loadFromFile(file);
      });

      this.autosaveTimer = null;
      Alpine.effect(() => {
        JSON.stringify(this.data);
        clearTimeout(this.autosaveTimer);
        this.autosaveTimer = setTimeout(() => this.saveDraft(), 400);
      });

      Alpine.effect(() => {
        JSON.stringify(this.data); // track
        if (!this.previewOpen) return;
        clearTimeout(this._previewTimer);
        this._previewTimer = setTimeout(() => this.pushPreview(), 200);
      });
    },

    async load() {
      this.loading = true;
      try {
        const res = await fetch('../ot265/lang.json?t=' + Date.now());
        const json = await res.json();
        // Ensure sv exists (for backward compat with backups that predate Swedish)
        if (!json.sv) json.sv = {};
        this.data = deepClone(json);
        this.original = deepClone(json);
        this.deletedKeys = new Set();
        this.history = [];
        this.historyIdx = -1;
        this.rebuildKeys();
        this.growAll();
      } catch (e) {
        this.toastMsg('Failed to load lang.json: ' + e.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    computeSections() {
      const map = {};
      for (const key of this.keys) {
        const sec = sectionOf(key);
        if (!map[sec]) map[sec] = [];
        map[sec].push(key);
      }
      this.sections = map;
    },

    // Recompute this.keys from the union of all language keys,
    // then re-derive sections. Call after any structural change.
    rebuildKeys() {
      const seen = new Set();
      const out = [];
      for (const lang of LANGS) {
        for (const k of Object.keys(this.data[lang] || {})) {
          if (!seen.has(k)) { seen.add(k); out.push(k); }
        }
      }
      this.keys = out;
      this.computeSections();
    },

    // Open the inline add form for a given section. Pre-fills with the
    // section's key prefix when there's a clear one.
    startAdd(sec) {
      this.commitActiveEdit();
      this.addingSec = sec;
      // Reverse-lookup prefix from SECTION_NAMES values
      const prefix = Object.keys(SECTION_NAMES).find(k => SECTION_NAMES[k] === sec);
      this.addingValue = prefix ? prefix + '_' : '';
    },

    cancelAdd() {
      this.addingSec = null;
      this.addingValue = '';
    },

    commitAdd() {
      const key = (this.addingValue || '').trim();
      if (!key) { this.cancelAdd(); return; }
      if (LANGS.some(l => key in (this.data[l] || {}))) {
        this.toastMsg(`Key "${key}" already exists`, 'error');
        return;
      }
      const entry = { type: 'add', key };
      for (const l of LANGS) {
        if (!this.data[l]) this.data[l] = {};
        this.data[l][key] = '';
        entry[l] = '';
      }
      this.rebuildKeys();
      this.pushHistory(entry);
      this.cancelAdd();
      // Focus the new row's first textarea (best-effort).
      requestAnimationFrame(() => {
        const ta = document.querySelector(`[data-key="${CSS.escape(key)}"] textarea`);
        ta?.focus();
      });
    },

    deleteKey(key) {
      if (!confirm(`Delete key "${key}"?\nThis removes the key from all languages.`)) return;
      this.commitActiveEdit();
      const entry = { type: 'delete', key, wasInOriginal: LANGS.some(l => key in (this.original[l] || {})) };
      for (const l of LANGS) {
        entry[l] = this.data[l]?.[key] ?? '';
        delete this.data[l]?.[key];
      }
      if (entry.wasInOriginal) this.deletedKeys.add(key);
      this.rebuildKeys();
      this.pushHistory(entry);
      this.menuKey = null;
    },

    duplicateKey(key) {
      this.commitActiveEdit();
      // Find a free suffix: _copy, _copy2, _copy3, ...
      let i = 1;
      let newKey;
      do {
        newKey = key + (i === 1 ? '_copy' : `_copy${i}`);
        i++;
      } while (LANGS.some(l => newKey in (this.data[l] || {})));
      const entry = { type: 'add', key: newKey };
      for (const l of LANGS) {
        entry[l] = this.data[l]?.[key] ?? '';
        if (!this.data[l]) this.data[l] = {};
        this.data[l][newKey] = entry[l];
      }
      this.rebuildKeys();
      this.pushHistory(entry);
      this.menuKey = null;
    },

    startRename(key) {
      this.menuKey = null;
      this.renamingKey = key;
      this.renamingValue = key;
    },

    cancelRename() {
      this.renamingKey = null;
      this.renamingValue = '';
    },

    commitRename() {
      const oldKey = this.renamingKey;
      const newKey = (this.renamingValue || '').trim();
      if (!oldKey || !newKey || newKey === oldKey) { this.cancelRename(); return; }
      if (LANGS.some(l => newKey in (this.data[l] || {}))) {
        this.toastMsg(`Key "${newKey}" already exists`, 'error');
        return;
      }
      this.commitActiveEdit();
      const entry = { type: 'rename', oldKey, newKey };
      for (const l of LANGS) {
        entry[l] = this.data[l]?.[oldKey] ?? '';
        if (!this.data[l]) this.data[l] = {};
        this.data[l][newKey] = entry[l];
        delete this.data[l][oldKey];
      }
      if (LANGS.some(l => oldKey in (this.original[l] || {}))) {
        this.deletedKeys.add(oldKey);
      }
      this.rebuildKeys();
      this.pushHistory(entry);
      this.cancelRename();
    },

    // Load a lang.json from disk via drag-drop. Replaces `data` but
    // leaves `original` untouched so the existing diff modal shows
    // exactly what's about to change against the on-disk file. The
    // history is snapshotted as a single 'bulk' entry so Cmd+Z reverts
    // the whole load.
    async loadFromFile(file) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (typeof parsed?.en !== 'object' || typeof parsed?.th !== 'object' || !parsed.en || !parsed.th) {
          throw new Error('File must contain "en" and "th" objects');
        }
        // Ensure sv exists (graceful for older backups)
        if (!parsed.sv || typeof parsed.sv !== 'object') parsed.sv = {};
        // Normalize: ensure all langs have the same key set (fill empty strings
        // where one side has a key the others don't). save.php requires symmetric keys.
        const all = new Set([...Object.keys(parsed.en), ...Object.keys(parsed.th), ...Object.keys(parsed.sv)]);
        for (const k of all) {
          for (const l of LANGS) {
            if (typeof parsed[l]?.[k] !== 'string') parsed[l][k] = String(parsed[l]?.[k] ?? '');
          }
        }
        this.commitActiveEdit();
        const prevSnap = { data: deepClone(this.data), deletedKeys: [...this.deletedKeys] };
        this.data = parsed;
        this.deletedKeys = new Set();
        // Any key that was in original but is missing from the loaded file counts as a delete.
        for (const k of Object.keys(this.original.en || {})) {
          if (!(k in this.data.en)) this.deletedKeys.add(k);
        }
        this.rebuildKeys();
        const nextSnap = { data: deepClone(this.data), deletedKeys: [...this.deletedKeys] };
        this.pushHistory({ type: 'bulk', prev: prevSnap, next: nextSnap });
        this.growAll();
        this.toastMsg(`Loaded ${file.name} — review diff and Save to persist`, 'success');
      } catch (e) {
        this.toastMsg(`Drop failed: ${e.message}`, 'error');
      }
    },

    togglePreview() {
      this.previewOpen = !this.previewOpen;
      if (this.previewOpen) {
        // Send the current data once the iframe load handler binds it.
        requestAnimationFrame(() => this.pushPreview());
      }
    },

    refreshPreview() {
      const f = document.getElementById('preview-iframe');
      if (f) f.src = f.src; // re-trigger load
    },

    onPreviewLoad(el) {
      this.previewIframe = el;
      this.pushPreview();
    },

    pushPreview() {
      const win = this.previewIframe?.contentWindow;
      if (!win) return;
      // Plain-object snapshot — Alpine's reactive Proxy isn't structured-cloneable.
      const dataSnap = {};
      for (const l of LANGS) dataSnap[l] = this.data[l];
      const data = JSON.parse(JSON.stringify(dataSnap));
      win.postMessage({ type: 'editor:lang', data }, '*');
    },

    sectionList() {
      return Object.entries(this.sections);
    },

    isDirty(key, lang) {
      return (this.data[lang]?.[key] ?? '') !== (this.original[lang]?.[key] ?? '');
    },

    rowDirty(key) {
      return LANGS.some(lang => this.isDirty(key, lang));
    },

    dirtyCount(lang) {
      let n = 0;
      for (const k of this.keys) {
        if (lang) { if (this.isDirty(k, lang)) n++; }
        else { for (const l of LANGS) { if (this.isDirty(k, l)) n++; } }
      }
      // Deletions of keys that had non-empty values on disk count too.
      for (const k of this.deletedKeys) {
        if (lang) {
          if ((this.original[lang]?.[k] ?? '') !== '') n++;
        } else {
          for (const l of LANGS) {
            if ((this.original[l]?.[k] ?? '') !== '') n++;
          }
        }
      }
      return n;
    },

    sectionDirtyCount(sec) {
      return (this.sections[sec] || []).filter(k => this.rowDirty(k)).length;
    },

    visibleKeys(keys) {
      if (!this.search) return keys;
      const q = this.search.toLowerCase();
      // Match against BOTH original and current values so a row that matched
      // at search time stays visible while the user edits it (otherwise the
      // textarea unmounts mid-keystroke as the typed value diverges from q).
      return keys.filter(k =>
        k.toLowerCase().includes(q) ||
        LANGS.some(l =>
          (this.data[l]?.[k] || '').toLowerCase().includes(q) ||
          (this.original[l]?.[k] || '').toLowerCase().includes(q)
        )
      );
    },

    totalVisible() {
      if (!this.search) return this.keys.length;
      let n = 0;
      for (const sec of Object.keys(this.sections)) {
        n += this.visibleKeys(this.sections[sec]).length;
      }
      return n;
    },

    isCollapsed(sec) {
      return !!this.collapsed[sec];
    },

    toggleSection(sec) {
      this.collapsed[sec] = !this.collapsed[sec];
      this.growAll();
    },

    isMissing(key, lang) {
      const v = this.data[lang]?.[key];
      return !v || v.trim() === '';
    },

    parityWarn(key) {
      const empties = LANGS.filter(l => this.isMissing(key, l));

      // Some langs empty, some not
      if (empties.length > 0 && empties.length < LANGS.length) {
        return empties.map(l => l.toUpperCase() + ' empty').join(' · ');
      }
      if (empties.length === LANGS.length) return null; // all empty is fine

      // Placeholder/HTML token parity: compare each non-EN lang against EN.
      const en = this.data.en[key] || '';
      const patterns = [
        { name: 'HTML tags', re: /<[^>]+>/g },
        { name: '{placeholder}', re: /\{[^}]+\}/g },
        { name: 'printf %', re: /%[sd]/g },
        { name: '\\n / \\t', re: /\\[nt]/g },
      ];
      const mismatches = [];
      for (const l of LANGS.filter(l => l !== 'en')) {
        const other = this.data[l]?.[key] || '';
        for (const p of patterns) {
          const a = (en.match(p.re) || []).length;
          const b = (other.match(p.re) || []).length;
          if (a !== b) mismatches.push(`${l.toUpperCase()} ${p.name} ${a}↔${b}`);
        }
      }
      if (mismatches.length) return mismatches.join(' · ');

      // Length ratio across all langs
      const lengths = LANGS.map(l => (this.data[l]?.[key] || '').length);
      const maxL = Math.max(...lengths);
      const minL = Math.min(...lengths);
      if (maxL < 60) return null;
      if (maxL / Math.max(minL, 1) > 2.2) return 'Length differs';

      return null;
    },

    diff() {
      const changes = [];
      for (const k of this.keys) {
        for (const lang of LANGS) {
          if (this.isDirty(k, lang)) {
            changes.push({
              key: k,
              lang,
              old: this.original[lang]?.[k] ?? '',
              new: this.data[lang]?.[k] ?? '',
            });
          }
        }
      }
      // Deleted keys: render with new: '(removed)' marker.
      for (const k of this.deletedKeys) {
        for (const lang of LANGS) {
          const oldV = this.original[lang]?.[k] ?? '';
          if (oldV !== '') {
            changes.push({ key: k, lang, old: oldV, new: '', removed: true });
          }
        }
      }
      return changes;
    },

    saveDraft() {
      if (this.dirtyCount() > 0) {
        localStorage.setItem('json-edit:draft', JSON.stringify({
          data: this.data,
          ts: Date.now(),
        }));
      } else {
        localStorage.removeItem('json-edit:draft');
      }
    },

    tryRestoreDraft() {
      const raw = localStorage.getItem('json-edit:draft');
      if (!raw) return;
      try {
        const draft = JSON.parse(raw);
        if (!draft.data?.en || !draft.data?.th) return;
        // Ensure sv exists in draft (for older drafts that predate Swedish)
        if (!draft.data.sv) draft.data.sv = {};
        let differs = false;
        for (const lang of LANGS) {
          if (!draft.data[lang]) continue;
          for (const k of this.keys) {
            if ((draft.data[lang][k] ?? '') !== (this.original[lang]?.[k] ?? '')) {
              differs = true; break;
            }
          }
          if (differs) break;
        }
        if (!differs) {
          localStorage.removeItem('json-edit:draft');
          return;
        }
        const ago = Math.round((Date.now() - draft.ts) / 60000);
        if (confirm(`Unsaved draft found from ${ago} min ago. Restore it?`)) {
          this.data = draft.data;
        } else {
          localStorage.removeItem('json-edit:draft');
        }
      } catch {
        localStorage.removeItem('json-edit:draft');
      }
    },

    async save() {
      if (this.dirtyCount() === 0) return;
      this.commitActiveEdit();
      this.saving = true;
      try {
        const res = await fetch('php/save.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Save failed');
        this.original = deepClone(this.data);
        this.lastSaved = new Date();
        localStorage.removeItem('json-edit:draft');
        this.modal = null;
        this.toastMsg('Saved · lang.json updated', 'success');
      } catch (e) {
        this.toastMsg('Save failed: ' + e.message, 'error');
      } finally {
        this.saving = false;
      }
    },

    discard() {
      if (this.dirtyCount() === 0) return;
      if (!confirm(`Discard ${this.dirtyCount()} change(s)?`)) return;
      this.data = deepClone(this.original);
      localStorage.removeItem('json-edit:draft');
      this.toastMsg('Changes discarded', 'info');
    },

    download() {
      const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lang.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },

    async openBackups() {
      this.modal = 'backups';
      try {
        const res = await fetch('php/save.php?list=1');
        const j = await res.json();
        this.backups = j.backups || [];
      } catch (e) {
        this.toastMsg('Could not load backups: ' + e.message, 'error');
      }
    },

    async restoreBackup(name) {
      if (!confirm(`Restore "${formatBackupName(name)}"?\nA backup of the current file will be made first.`)) return;
      try {
        const res = await fetch('php/save.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restore: name }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Restore failed');
        await this.load();
        this.modal = null;
        this.toastMsg('Restored from backup', 'success');
      } catch (e) {
        this.toastMsg('Restore failed: ' + e.message, 'error');
      }
    },

    toastMsg(text, kind = 'info') {
      this.toast = { text, kind, id: Date.now() };
      const id = this.toast.id;
      setTimeout(() => { if (this.toast?.id === id) this.toast = null; }, 3200);
    },

    applyDark() {
      document.documentElement.classList.toggle('dark', this.darkMode);
    },

    toggleDark() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('json-edit:dark', this.darkMode);
      this.applyDark();
    },

    // ── History / undo / redo ───────────────────────────────────────────

    beginEdit(key, lang) {
      this.commitActiveEdit();
      this.activeEdit = {
        key, lang,
        focusPrev: this.data[lang]?.[key] ?? '',
        timer: null,
      };
    },

    touchEdit() {
      const a = this.activeEdit;
      if (!a) return;
      clearTimeout(a.timer);
      a.timer = setTimeout(() => this._commitCurrentBurst(), 600);
    },

    endEdit() {
      this.commitActiveEdit();
    },

    _commitCurrentBurst() {
      const a = this.activeEdit;
      if (!a) return;
      clearTimeout(a.timer);
      a.timer = null;
      const next = this.data[a.lang]?.[a.key] ?? '';
      if (next !== a.focusPrev) {
        this.pushHistory({ type: 'edit', key: a.key, lang: a.lang, prev: a.focusPrev, next });
        a.focusPrev = next; // ready for next burst within same focus
      }
    },

    commitActiveEdit() {
      this._commitCurrentBurst();
      this.activeEdit = null;
    },

    // Revert the focused field to its on-disk original value, and
    // record the revert as a single undo entry so Cmd+Z brings the
    // edited value back.
    revertField() {
      const a = this.activeEdit;
      if (!a) return false;
      if (!this.isDirty(a.key, a.lang)) return false;
      const prev = this.data[a.lang]?.[a.key] ?? '';
      const next = this.original[a.lang]?.[a.key] ?? '';
      clearTimeout(a.timer);
      a.timer = null;
      a.focusPrev = next; // suppress any pending commit of this change
      this.data[a.lang][a.key] = next;
      this.pushHistory({ type: 'edit', key: a.key, lang: a.lang, prev, next });
      return true;
    },

    pushHistory(entry) {
      // Truncate any redo branch first
      if (this.historyIdx < this.history.length - 1) {
        this.history.splice(this.historyIdx + 1);
      }
      this.history.push(entry);
      if (this.history.length > 200) this.history.shift();
      this.historyIdx = this.history.length - 1;
    },

    undo() {
      this.commitActiveEdit();
      if (this.historyIdx < 0) return;
      this.applyEntry(this.history[this.historyIdx], 'undo');
      this.historyIdx--;
    },

    redo() {
      this.commitActiveEdit();
      if (this.historyIdx >= this.history.length - 1) return;
      this.historyIdx++;
      this.applyEntry(this.history[this.historyIdx], 'redo');
    },

    applyEntry(entry, dir) {
      if (entry.type === 'edit') {
        this.data[entry.lang][entry.key] = dir === 'undo' ? entry.prev : entry.next;
      } else if (entry.type === 'add') {
        // entry: { type: 'add', key, en, th, sv }
        if (dir === 'undo') {
          for (const l of LANGS) delete this.data[l]?.[entry.key];
        } else {
          for (const l of LANGS) {
            if (!this.data[l]) this.data[l] = {};
            this.data[l][entry.key] = entry[l] ?? '';
          }
        }
        this.rebuildKeys();
      } else if (entry.type === 'delete') {
        // entry: { type: 'delete', key, en, th, sv, wasInOriginal }
        if (dir === 'undo') {
          for (const l of LANGS) {
            if (!this.data[l]) this.data[l] = {};
            this.data[l][entry.key] = entry[l] ?? '';
          }
          if (entry.wasInOriginal) this.deletedKeys.delete(entry.key);
        } else {
          for (const l of LANGS) delete this.data[l]?.[entry.key];
          if (entry.wasInOriginal) this.deletedKeys.add(entry.key);
        }
        this.rebuildKeys();
      } else if (entry.type === 'rename') {
        // entry: { type: 'rename', oldKey, newKey, en, th, sv }
        const from = dir === 'undo' ? entry.newKey : entry.oldKey;
        const to = dir === 'undo' ? entry.oldKey : entry.newKey;
        for (const l of LANGS) {
          if (!this.data[l]) this.data[l] = {};
          this.data[l][to] = entry[l] ?? '';
          delete this.data[l][from];
        }
        // Maintain deletedKeys: if oldKey was in original, renaming forward
        // "deletes" it (in disk-state terms) and renaming back "restores" it.
        if (LANGS.some(l => entry.oldKey in (this.original[l] || {}))) {
          if (dir === 'undo') this.deletedKeys.delete(entry.oldKey);
          else this.deletedKeys.add(entry.oldKey);
        }
        this.rebuildKeys();
      } else if (entry.type === 'bulk') {
        // entry: { type: 'bulk', prev: { data, deletedKeys[] }, next: same }
        const snap = dir === 'undo' ? entry.prev : entry.next;
        this.data = deepClone(snap.data);
        this.deletedKeys = new Set(snap.deletedKeys);
        this.rebuildKeys();
      }
    },

    setView(v) {
      this.commitActiveEdit();
      this.viewMode = v;
      localStorage.setItem('json-edit:view', v);
      this.growAll();
    },

    effectiveView() {
      // Mobile is too narrow to show multiple languages side-by-side meaningfully —
      // force tabs so the bottom drawer can drive language switching.
      return this.isMobile ? 'tabs' : this.viewMode;
    },

    currentAutoScale() {
      if (window.matchMedia('(min-width: 1536px)').matches) return 2.0;
      if (window.matchMedia('(min-width: 1024px)').matches) return 1.5;
      return 1.0;
    },

    effectiveScale() {
      return this.uiScale ?? this.currentAutoScale();
    },

    applyUiScale() {
      if (this.uiScale === null) {
        document.documentElement.style.removeProperty('--ui-scale');
      } else {
        document.documentElement.style.setProperty('--ui-scale', String(this.uiScale));
      }
      this.growAll();
    },

    setUiScale(v) {
      this.uiScale = v;
      if (v === null) localStorage.removeItem('json-edit:scale');
      else localStorage.setItem('json-edit:scale', String(v));
      this.applyUiScale();
    },

    bumpScale(dir) {
      const cur = this.effectiveScale();
      const next = Math.min(2.5, Math.max(0.8, Math.round((cur + dir * 0.1) * 10) / 10));
      this.setUiScale(next);
    },

    resetScale() {
      this.setUiScale(null);
    },

    // Called from @input on every textarea. Grows the textarea to fit
    // its content; for split-view pairs, equalizes all siblings to the
    // tallest content height (so the row stays visually balanced).
    autoGrow(el) {
      if (!el) return;
      const pair = el.closest?.('[data-split-pair]');
      if (pair && this.effectiveView() === 'split') {
        this._syncPair(pair);
      } else {
        this._grow(el);
      }
    },

    _grow(t) {
      if (!t || t.offsetParent === null) return; // skip hidden (display:none)
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
    },

    _syncPair(pair) {
      const tas = pair.querySelectorAll('textarea');
      if (tas.length < 2) return;
      tas.forEach(t => { t.style.height = 'auto'; });
      let max = 0;
      tas.forEach(t => { if (t.scrollHeight > max) max = t.scrollHeight; });
      tas.forEach(t => { t.style.height = max + 'px'; });
    },

    // Re-fits every visible textarea. Call after data load, lang switch,
    // view switch, scale change, or viewport breakpoint change — anything
    // that changes what content is visible in which textarea.
    growAll() {
      requestAnimationFrame(() => {
        const inSplit = this.effectiveView() === 'split';
        document.querySelectorAll('textarea').forEach(t => {
          const pair = t.closest('[data-split-pair]');
          if (pair && inSplit) return; // handled below
          if (pair && !inSplit) { t.style.height = ''; return; } // hidden, reset
          this._grow(t);
        });
        if (inSplit) {
          document.querySelectorAll('[data-split-pair]').forEach(p => this._syncPair(p));
        }
      });
    },

    setLang(l) {
      this.commitActiveEdit();
      this.activeLang = l;
      localStorage.setItem('json-edit:lang', l);
      this.growAll();
    },

    formatTime,
    formatBackupName,
    sectionOf,
  });
}

if (window.Alpine) registerEditor();
else document.addEventListener('alpine:init', registerEditor);
