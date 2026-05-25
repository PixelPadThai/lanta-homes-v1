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

function sectionOf(key) {
  const prefix = key.split('_')[0];
  return SECTION_NAMES[prefix] || 'Other';
}

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatBackupName(name) {
  const m = name.match(/^lang-(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})\.json$/);
  if (!m) return name;
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
}

function registerEditor() {
  Alpine.store('editor', {
    data: { en: {}, th: {} },
    original: { en: {}, th: {} },
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
        if (cmd && e.key === 's') {
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
        if (e.key === 'Escape') this.modal = null;
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

      this.autosaveTimer = null;
      Alpine.effect(() => {
        JSON.stringify(this.data);
        clearTimeout(this.autosaveTimer);
        this.autosaveTimer = setTimeout(() => this.saveDraft(), 400);
      });
    },

    async load() {
      this.loading = true;
      try {
        const res = await fetch('../ot265/lang.json?t=' + Date.now());
        const json = await res.json();
        this.data = deepClone(json);
        this.original = deepClone(json);
        this.keys = Object.keys(json.en);
        this.computeSections();
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

    sectionList() {
      return Object.entries(this.sections);
    },

    isDirty(key, lang) {
      return (this.data[lang][key] ?? '') !== (this.original[lang][key] ?? '');
    },

    rowDirty(key) {
      return this.isDirty(key, 'en') || this.isDirty(key, 'th');
    },

    dirtyCount(lang) {
      let n = 0;
      for (const k of this.keys) {
        if (lang) { if (this.isDirty(k, lang)) n++; }
        else { if (this.isDirty(k, 'en')) n++; if (this.isDirty(k, 'th')) n++; }
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
        (this.data.en[k] || '').toLowerCase().includes(q) ||
        (this.data.th[k] || '').toLowerCase().includes(q) ||
        (this.original.en[k] || '').toLowerCase().includes(q) ||
        (this.original.th[k] || '').toLowerCase().includes(q)
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
      const v = this.data[lang][key];
      return !v || v.trim() === '';
    },

    parityWarn(key) {
      const enEmpty = this.isMissing(key, 'en');
      const thEmpty = this.isMissing(key, 'th');
      if (enEmpty && !thEmpty) return 'EN empty';
      if (thEmpty && !enEmpty) return 'TH empty';
      const en = (this.data.en[key] || '').length;
      const th = (this.data.th[key] || '').length;
      if (en < 60 && th < 60) return null;
      const ratio = Math.max(en, th) / Math.max(Math.min(en, th), 1);
      if (ratio > 2.2) return 'Length differs';
      return null;
    },

    diff() {
      const changes = [];
      for (const k of this.keys) {
        for (const lang of ['en', 'th']) {
          if (this.isDirty(k, lang)) {
            changes.push({
              key: k,
              lang,
              old: this.original[lang][k] ?? '',
              new: this.data[lang][k] ?? '',
            });
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
        let differs = false;
        for (const lang of ['en', 'th']) {
          for (const k of this.keys) {
            if ((draft.data[lang][k] ?? '') !== (this.original[lang][k] ?? '')) {
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
        focusPrev: this.data[lang][key] ?? '',
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
      const next = this.data[a.lang][a.key] ?? '';
      if (next !== a.focusPrev) {
        this.pushHistory({ type: 'edit', key: a.key, lang: a.lang, prev: a.focusPrev, next });
        a.focusPrev = next; // ready for next burst within same focus
      }
    },

    commitActiveEdit() {
      this._commitCurrentBurst();
      this.activeEdit = null;
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

    // Dispatch on entry.type. Tasks 5/6/8 extend this with 'add',
    // 'delete', 'rename', 'bulk' branches.
    applyEntry(entry, dir) {
      if (entry.type === 'edit') {
        this.data[entry.lang][entry.key] = dir === 'undo' ? entry.prev : entry.next;
      }
    },

    setView(v) {
      this.commitActiveEdit();
      this.viewMode = v;
      localStorage.setItem('json-edit:view', v);
      this.growAll();
    },

    effectiveView() {
      // Mobile is too narrow to show both languages side-by-side meaningfully —
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
    // its content; for split-view pairs, equalizes both siblings to the
    // taller content height (so the pair stays visually balanced like
    // cards in a row).
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
