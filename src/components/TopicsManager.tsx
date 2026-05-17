'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Database, 
  Coffee, 
  Layers, 
  Trash2, 
  Plus, 
  Search, 
  Moon, 
  Sun, 
  GraduationCap, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ClipboardCopy, 
  ClipboardCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Subject, Topic } from '@/lib/db';
import { addTopicAction, deleteTopicAction } from '@/app/actions';

const SUBJECTS: Subject[] = ['BWL', 'Datenbanken', 'Java', 'SAP'];

const SUBJECT_DETAILS: Record<Subject, { name: string; desc: string; color: string; borderClass: string; textClass: string; bgClass: string; icon: any }> = {
  BWL: { 
    name: 'BWL', 
    desc: 'Betriebswirtschaftslehre & Wirtschaftsrecht', 
    color: 'from-blue-500 to-indigo-600',
    borderClass: 'border-l-[#390099] dark:border-l-purple-500',
    textClass: 'text-[#390099] dark:text-purple-400',
    bgClass: 'bg-[#390099]/10 dark:bg-purple-950/30',
    icon: BookOpen 
  },
  Datenbanken: { 
    name: 'Datenbanken', 
    desc: 'ER-Modellierung, SQL & Normalisierung', 
    color: 'from-purple-500 to-pink-600',
    borderClass: 'border-l-purple-500 dark:border-l-purple-400',
    textClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-100/60 dark:bg-purple-950/30',
    icon: Database 
  },
  Java: { 
    name: 'Java', 
    desc: 'Objektorientierte Softwareentwicklung', 
    color: 'from-amber-500 to-orange-600',
    borderClass: 'border-l-orange-500 dark:border-l-orange-400',
    textClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100/60 dark:bg-orange-950/30',
    icon: Coffee 
  },
  SAP: { 
    name: 'SAP', 
    desc: 'ERP-Systeme & Geschäftsprozesse', 
    color: 'from-emerald-500 to-teal-600',
    borderClass: 'border-l-emerald-500 dark:border-l-emerald-400',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100/60 dark:bg-emerald-950/30',
    icon: Layers 
  }
};

interface TopicsManagerProps {
  initialTopics: Record<Subject, Topic[]>;
}

export default function TopicsManager({ initialTopics }: TopicsManagerProps) {
  const [topics, setTopics] = useState<Record<Subject, Topic[]>>(initialTopics);
  const [activeSubject, setActiveSubject] = useState<Subject>('BWL');
  const [newTopicText, setNewTopicText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state with incoming props (e.g. from background page revalidations)
  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  // Initialize theme client-side
  useEffect(() => {
    setIsMounted(true);
    
    // Load Theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (systemPrefersDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTopicText.trim();
    if (!text) return;

    // Fast duplicate check in local state
    const isDuplicate = (topics[activeSubject] || []).some(
      (t) => t.title.toLowerCase() === text.toLowerCase()
    );

    if (isDuplicate) {
      triggerToast('Dieses Thema existiert bereits in diesem Fach!');
      return;
    }

    // Optimistically add the new topic to the list
    const originalTopics = topics;
    const tempId = `${activeSubject.toLowerCase()}-temp-${Date.now()}`;
    const optimisticTopic: Topic = {
      id: tempId,
      title: text,
      createdAt: new Date().toISOString()
    };

    setTopics({
      ...topics,
      [activeSubject]: [optimisticTopic, ...(topics[activeSubject] || [])]
    });
    setNewTopicText('');

    // Call server action to write to SQLite
    const response = await addTopicAction(activeSubject, text);
    if (response.success) {
      triggerToast('Thema erfolgreich hinzugefügt!');
    } else {
      // Revert if database insert failed
      setTopics(originalTopics);
      triggerToast(response.error || 'Fehler beim Hinzufügen.');
    }
    
    // Auto refocus
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleDeleteTopic = async (subject: Subject, id: string) => {
    const originalTopics = topics;

    // Optimistically filter the deleted topic
    setTopics({
      ...topics,
      [subject]: (topics[subject] || []).filter((t) => t.id !== id)
    });
    triggerToast('Thema gelöscht.');

    // Call server action to delete from SQLite
    const response = await deleteTopicAction(subject, id);
    if (!response.success) {
      // Revert if delete operation failed
      setTopics(originalTopics);
      triggerToast(response.error || 'Fehler beim Löschen.');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const exportToClipboard = () => {
    let mdText = `## 📚 Prüfungsthemen Übersicht — Klasse 2541 WI\n\n`;
    SUBJECTS.forEach((subject) => {
      const list = topics[subject] || [];
      mdText += `### 🔸 ${SUBJECT_DETAILS[subject].name} (${list.length} Themen)\n`;
      if (list.length === 0) {
        mdText += `_Keine Themen eingetragen._\n\n`;
      } else {
        list.forEach((t, i) => {
          mdText += `${i + 1}. ${t.title}\n`;
        });
        mdText += `\n`;
      }
    });

    navigator.clipboard.writeText(mdText);
    setCopied(true);
    triggerToast('Alle Themen als Markdown in die Zwischenablage kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard accessibility for tab navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const nextIndex = (index + 1) % SUBJECTS.length;
      setActiveSubject(SUBJECTS[nextIndex]);
      const nextTab = document.getElementById(`tab-${SUBJECTS[nextIndex]}`);
      nextTab?.focus();
    } else if (e.key === 'ArrowLeft') {
      const nextIndex = (index - 1 + SUBJECTS.length) % SUBJECTS.length;
      setActiveSubject(SUBJECTS[nextIndex]);
      const prevTab = document.getElementById(`tab-${SUBJECTS[nextIndex]}`);
      prevTab?.focus();
    }
  };

  // German Relative Time Formatter
  const getRelativeTimeGerman = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays === 1) return 'Gestern';
    return `vor ${diffDays} Tagen`;
  };

  const getTotalTopicsCount = () => {
    return SUBJECTS.reduce((sum, sub) => sum + (topics[sub]?.length || 0), 0);
  };

  const getFilteredTopics = () => {
    const activeList = topics[activeSubject] || [];
    if (!searchQuery.trim()) return activeList;
    return activeList.filter((t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Render clean layout during mount to avoid hydration blink
  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 px-4 bg-background text-foreground">
        <div className="w-12 h-12 rounded-full border-4 border-primary-accent border-t-transparent animate-spin"></div>
        <p className="mt-4 text-text-secondary text-sm font-medium">Lade Prüfungsthemen...</p>
      </div>
    );
  }

  const filteredTopics = getFilteredTopics();
  const currentSubjectDetails = SUBJECT_DETAILS[activeSubject];
  const ActiveIcon = currentSubjectDetails.icon;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start">
      {/* Ambient floating glows for premium glassmorphism background */}
      <div className="absolute top-[-5%] left-[-5%] w-[20rem] h-[20rem] sm:w-[32rem] sm:h-[32rem] rounded-full bg-purple-600/8 dark:bg-purple-500/6 blur-[80px] sm:blur-[120px] pointer-events-none -z-10 animate-glow-1" />
      <div className="absolute bottom-[20%] right-[-5%] w-[20rem] h-[20rem] sm:w-[32rem] sm:h-[32rem] rounded-full bg-pink-500/6 dark:bg-pink-600/5 blur-[80px] sm:blur-[120px] pointer-events-none -z-10 animate-glow-2" />

      <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 py-8 md:py-12 md:px-8 z-10">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 px-4 rounded-xl shadow-2xl animate-slide-in border border-slate-800 dark:border-slate-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-card-border mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-accent-light text-primary-accent rounded-2xl shadow-sm border border-primary-accent/10">
            <GraduationCap className="w-8 h-8 md:w-9 h-9" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary-accent bg-clip-text text-transparent">
                Prüfungsthemen Übersicht
              </h1>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary-accent-light text-primary-accent border border-primary-accent/20 shadow-sm backdrop-blur-sm">
                2541 WI
              </span>
            </div>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium mt-1.5 max-w-xl">
              Sammle und verwalte hier gemeinschaftlich die anstehenden Prüfungsthemen für unsere vier Kernfächer.
            </p>
          </div>
        </div>

        {/* TOP BUTTONS (Theme Toggle & Export) */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={exportToClipboard}
            className="touch-target flex items-center gap-2 px-4 py-2 rounded-xl border border-card-border bg-card hover:bg-background/80 font-semibold text-sm transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
            title="Kopiert alle Fächer als strukturierte Liste"
          >
            {copied ? (
              <>
                <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-semibold hidden sm:inline">Kopiert!</span>
              </>
            ) : (
              <>
                <ClipboardCopy className="w-4 h-4 text-text-secondary" />
                <span className="hidden sm:inline">Exportieren</span>
              </>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="touch-target p-2 rounded-xl border border-card-border bg-card hover:bg-background/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            aria-label="Design-Farbschema wechseln"
            title={theme === 'light' ? 'Dunkelmodus aktivieren' : 'Hellmodus aktivieren'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* QUICK STATUS DASHBOARD */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between shadow-sm hover-scale-sm">
          <div>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Themen Gesamt</span>
            <h3 className="text-2xl font-black mt-1 text-primary-accent">{getTotalTopicsCount()}</h3>
          </div>
          <div className="p-2.5 bg-primary-accent-light rounded-xl text-primary-accent shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between shadow-sm hover-scale-sm">
          <div>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Aktuelles Fach</span>
            <h3 className="text-lg font-black mt-1 truncate max-w-[150px]">{currentSubjectDetails.name}</h3>
          </div>
          <div className="p-2.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl shadow-inner">
            <ActiveIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between shadow-sm hover-scale-sm">
          <div>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Themen in {currentSubjectDetails.name}</span>
            <h3 className="text-2xl font-black mt-1">{topics[activeSubject]?.length || 0}</h3>
          </div>
          <div className={`p-2.5 bg-gradient-to-br ${currentSubjectDetails.color} text-white rounded-xl shadow-md`}>
            <span className="text-xs font-bold font-mono">#{activeSubject.substring(0, 2).toUpperCase()}</span>
          </div>
        </div>
      </section>

      {/* TABS NAVIGATION (iOS-style Segmented Glass Control to prevent cut-off look) */}
      <nav className="mb-6" aria-label="Fächer Tabs">
        <div className="flex overflow-x-auto scrollbar-none pb-1.5 -mx-4 px-4 md:mx-0 md:px-0 gap-2">
          <div className="flex p-1.5 bg-slate-200/30 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl border border-card-border/40 w-max min-w-full sm:min-w-0 gap-1.5 shadow-inner">
            {SUBJECTS.map((subject, index) => {
              const isActive = activeSubject === subject;
              const Icon = SUBJECT_DETAILS[subject].icon;
              const count = topics[subject]?.length || 0;

              return (
                <button
                  key={subject}
                  id={`tab-${subject}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="tab-content"
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onClick={() => {
                    setActiveSubject(subject);
                    setSearchQuery('');
                  }}
                  className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-accent/40 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-primary-accent shadow-md scale-[1.02] border border-slate-200/30 dark:border-white/5'
                      : 'text-text-secondary hover:text-foreground hover:bg-white/40 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 rotate-3' : ''}`} />
                  <span>{SUBJECT_DETAILS[subject].name}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-black transition-all duration-300 ${
                      isActive
                        ? 'bg-primary-accent text-white shadow-sm'
                        : 'bg-slate-300/60 dark:bg-slate-800/80 text-text-secondary/70'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* CORE WORKSPACE / CONTENT SECTION */}
      <main id="tab-content" role="tabpanel" className="flex flex-col gap-6 flex-1">
        {/* TAB SPECIFIC BANNER (Redesigned glassmorphic left-border accent layout for absolute contrast) */}
        <div className={`p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-white/5 border-l-4 ${currentSubjectDetails.borderClass} shadow-md flex items-center justify-between hover-scale-sm transition-all duration-300`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 ${currentSubjectDetails.bgClass} ${currentSubjectDetails.textClass} rounded-xl hidden sm:block shadow-sm transition-all duration-300`}>
              <ActiveIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400">Aktives Fach</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mt-0.5">{currentSubjectDetails.name}</h2>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">{currentSubjectDetails.desc}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block pr-1">
            <span className="text-3xl font-black font-mono tracking-tighter text-slate-300/30 dark:text-slate-700/20">
              0{SUBJECTS.indexOf(activeSubject) + 1}
            </span>
          </div>
        </div>

        {/* INPUT FORM & SEARCH CONTAINER (Grouped in glass deck for premium alignment) */}
        <div className="glass-panel border border-card-border rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Add Form */}
            <form onSubmit={handleAddTopic} className="lg:col-span-8 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTopicText}
                  onChange={(e) => setNewTopicText(e.target.value)}
                  placeholder={`Neues Thema für ${currentSubjectDetails.name} hinzufügen...`}
                  className="w-full px-4.5 py-3 rounded-xl border border-card-border/60 bg-card/60 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent text-sm transition-all placeholder:text-text-secondary/50 backdrop-blur-sm"
                  aria-label={`Neues Thema für ${currentSubjectDetails.name}`}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!newTopicText.trim()}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-accent hover:bg-primary-accent-hover text-white font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Hinzufügen</span>
              </button>
            </form>

            {/* Search bar */}
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Themen filtern..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-card-border/60 bg-card/60 focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent text-sm transition-all placeholder:text-text-secondary/50 backdrop-blur-sm"
                aria-label="Themen filtern"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary hover:text-foreground"
                >
                  Leeren
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TOPICS LIST */}
        <section className="flex-1 flex flex-col">
          {filteredTopics.length === 0 ? (
            /* EMPTY STATES */
            searchQuery ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-card border border-dashed border-card-border rounded-3xl min-h-[250px] animate-slide-in">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-text-secondary/70 mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold">Keine Ergebnisse gefunden</h3>
                <p className="text-sm text-text-secondary mt-1 max-w-sm">
                  Für den Suchbegriff &bdquo;{searchQuery}&ldquo; wurden in {currentSubjectDetails.name} keine Themen gefunden. Versuche es mit einem anderen Begriff!
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm font-semibold text-primary-accent hover:underline flex items-center gap-1"
                >
                  Suche zurücksetzen <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-card border border-dashed border-card-border rounded-3xl min-h-[300px] animate-slide-in">
                <div className="p-4 bg-primary-accent-light rounded-full text-primary-accent mb-4">
                  <ActiveIcon className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-extrabold">Noch keine Themen eingetragen</h3>
                <p className="text-sm text-text-secondary mt-2 max-w-md">
                  In {currentSubjectDetails.name} wurden bisher noch keine Prüfungsthemen erfasst. 
                  Nutze das obige Eingabefeld, um das erste wichtige Thema hinzuzufügen!
                </p>
              </div>
            )
          ) : (
            /* DYNAMIC LIST */
            <div className="grid grid-cols-1 gap-3">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-4.5 glass-card rounded-2xl animate-slide-in group shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className="p-2.5 bg-slate-200/40 dark:bg-slate-800/40 rounded-xl border border-card-border/40 text-text-secondary group-hover:text-primary-accent group-hover:bg-primary-accent-light transition-all duration-300 shadow-inner">
                      <ActiveIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm md:text-base leading-snug break-words">
                        {topic.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary/70 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-text-secondary/60" />
                        <span>Hinzugefügt {getRelativeTimeGerman(topic.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTopic(activeSubject, topic.id)}
                    className="touch-target p-2 text-text-secondary hover:text-red-500 bg-transparent hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shrink-0"
                    aria-label={`Thema "${topic.title}" löschen`}
                    title="Thema entfernen"
                  >
                    <Trash2 className="w-4.5 h-4.5 md:w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 pt-6 border-t border-card-border text-center text-xs text-text-secondary">
        <p className="font-semibold">
          &copy; {new Date().getFullYear()} Prüfungsthemen Manager. Mit Liebe für die Klasse 2541 WI entwickelt.
        </p>
        <p className="mt-1 opacity-70">
          Gespeichert in SQLite (geteilt) &bull; Design-Modus in localStorage &bull; Tastatur-Navigierbar
        </p>
      </footer>
      </div>
    </div>
  );
}
