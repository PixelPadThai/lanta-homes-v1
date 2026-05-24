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

    async init() {
      const storedDark = localStorage.getItem('json-edit:dark');
      this.darkMode = storedDark === null
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : storedDark === 'true';
      this.applyDark();

      this.viewMode = localStorage.getItem('json-edit:view') || 'tabs';
      this.activeLang = localStorage.getItem('json-edit:lang') || 'en';

      await this.load();
      this.tryRestoreDraft();

      window.addEventListener('keydown', (e) => {
        const cmd = e.ctrlKey || e.metaKey;
        if (cmd && e.key === 's') {
          e.preventDefault();
          if (this.dirtyCount() > 0) this.modal = 'diff';
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
      return keys.filter(k =>
        k.toLowerCase().includes(q) ||
        (this.data.en[k] || '').toLowerCase().includes(q) ||
        (this.data.th[k] || '').toLowerCase().includes(q)
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

    setView(v) {
      this.viewMode = v;
      localStorage.setItem('json-edit:view', v);
    },

    setLang(l) {
      this.activeLang = l;
      localStorage.setItem('json-edit:lang', l);
    },

    formatTime,
    formatBackupName,
    sectionOf,
  });
}

if (window.Alpine) registerEditor();
else document.addEventListener('alpine:init', registerEditor);
