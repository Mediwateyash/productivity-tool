import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { 
  Lightbulb, 
  Plus, 
  Trash2, 
  Search, 
  Tag, 
  Sparkles, 
  Mic, 
  MicOff,
  BookOpen,
  Edit3,
  Check,
  FolderOpen
} from 'lucide-react';

export const Ideas = () => {
  const { apiFetch } = useAuth();
  const { showToast } = useToast();
  
  // Ideas notes lists
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Editor States
  const [activeIdeaId, setActiveIdeaId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [tagsInput, setTagsInput] = useState('');
  const [activeTab, setActiveTab] = useState('edit'); // edit, preview
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Voice Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    fetchIdeas();
    initializeSpeechRecognition();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/ideas');
      setIdeas(data);
      if (data.length > 0) {
        selectIdea(data[0]);
      }
    } catch (err) {
      console.error('Error fetching ideas:', err);
      showToast('Running in offline sandbox.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          } else {
            interimTranscript += e.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setContent(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  };

  const toggleRecording = () => {
    if (!recognition) {
      showToast('Speech Recognition not supported in this browser.', 'warning');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      showToast('Voice dictation paused.', 'info');
    } else {
      recognition.start();
      setIsRecording(true);
      showToast('Voice dictation active. Speak clearly!', 'success');
    }
  };

  const selectIdea = (idea) => {
    setActiveIdeaId(idea._id);
    setTitle(idea.title);
    setContent(idea.content || '');
    setCategory(idea.category || 'general');
    setTagsInput(idea.tags ? idea.tags.join(', ') : '');
  };

  const handleCreateNewIdea = async () => {
    try {
      const newIdeaData = {
        title: 'Untitled Idea Note',
        content: '# New Idea\nStart typing your creative thoughts here...',
        category: 'general',
        tags: ['draft']
      };

      const created = await apiFetch('/ideas', {
        method: 'POST',
        body: JSON.stringify(newIdeaData)
      });

      setIdeas(prev => [created, ...prev]);
      selectIdea(created);
      showToast('Brainstorm note draft created.', 'success');
      
      await apiFetch('/achievements/check', { method: 'POST' });
    } catch (err) {
      console.error('Error creating new idea:', err);
      showToast('Failed to create note.', 'error');
    }
  };

  const handleSaveIdea = async () => {
    if (!activeIdeaId) return;

    try {
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const payload = {
        title: title.trim() || 'Untitled Idea Note',
        content,
        category,
        tags: parsedTags
      };

      const updated = await apiFetch(`/ideas/${activeIdeaId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setIdeas(prev => prev.map(i => i._id === activeIdeaId ? updated : i));
      showToast('Note autosaved.', 'success');
      
      await apiFetch('/achievements/check', { method: 'POST' });
    } catch (err) {
      console.error('Error saving idea:', err);
    }
  };

  const handleDeleteIdea = async (ideaId, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await apiFetch(`/ideas/${ideaId}`, { method: 'DELETE' });
      const filtered = ideas.filter(i => i._id !== ideaId);
      setIdeas(filtered);
      showToast('Note permanently deleted.', 'info');
      
      if (activeIdeaId === ideaId) {
        if (filtered.length > 0) {
          selectIdea(filtered[0]);
        } else {
          setActiveIdeaId(null);
          setTitle('');
          setContent('');
          setCategory('general');
          setTagsInput('');
        }
      }
    } catch (err) {
      console.error('Error deleting idea:', err);
      showToast('Failed to delete note.', 'error');
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return '<p class="text-slate-400 italic">No notes written. Start typing!</p>';
    
    let html = text;
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    html = html.replace(/^### (.*$)/gim, '<h6 class="font-bold text-xs mt-3 mb-1 text-slate-800 dark:text-slate-100">$1</h6>');
    html = html.replace(/^## (.*$)/gim, '<h5 class="font-bold text-sm mt-4 mb-1.5 text-slate-800 dark:text-slate-100">$1</h5>');
    html = html.replace(/^# (.*$)/gim, '<h4 class="font-extrabold text-base mt-5 mb-2.5 text-slate-800 dark:text-slate-100 border-b border-slate-200/50 dark:border-brand-800/40 pb-1.5">$1</h4>');
    
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em class="italic text-slate-700 dark:text-slate-355">$1</em>');
    
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-650 dark:text-slate-350 py-0.5">$1</li>');
    
    html = html.replace(/\n/gim, '<br />');

    return `<div class="space-y-1 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">${html}</div>`;
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(search.toLowerCase()) || 
                          idea.content.toLowerCase().includes(search.toLowerCase());
    
    let matchesCategory = true;
    if (activeCategory !== 'all') {
      matchesCategory = idea.category === activeCategory;
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and note adder */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Ideas Dump
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Capture creative thoughts, draft markdown text notes, and dictate plans via speech-to-text.
          </p>
        </div>
        
        <button
          onClick={handleCreateNewIdea}
          className="glass-btn-primary flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-md shadow-blue-500/20"
        >
          <Plus size={14} />
          <span>Capture New Note</span>
        </button>
      </div>

      {/* Editor & Notes list Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Notes directory sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search active ideas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10 py-2.5 text-xs placeholder:text-slate-450"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200/50 dark:border-brand-800/30">
            {[
              { name: 'All', key: 'all' },
              { name: 'Startup', key: 'startup' },
              { name: 'Dev', key: 'development' },
              { name: 'Creative', key: 'creative' },
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                  activeCategory === cat.key
                    ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Notes Card Directory */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Synchronizing notes...
              </div>
            ) : filteredIdeas.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-450 font-medium">No ideas logged. Create one!</p>
            ) : (
              filteredIdeas.map((idea) => (
                <div
                  key={idea._id}
                  onClick={() => selectIdea(idea)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[90px] ${
                    activeIdeaId === idea._id
                      ? 'bg-white dark:bg-brand-900 border-blue-500 shadow-md shadow-blue-500/5'
                      : 'bg-slate-100/50 dark:bg-brand-850/30 hover:bg-slate-200/50 dark:hover:bg-brand-800/40 border-slate-200/50 dark:border-brand-800/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-blue-500/10 text-blue-500 rounded uppercase">
                        {idea.category}
                      </span>
                      <button
                        onClick={(e) => handleDeleteIdea(idea._id, e)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 truncate leading-snug">
                      {idea.title || 'Untitled Idea Note'}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 mt-3 text-[8px] font-bold text-slate-400 uppercase">
                    <Tag size={8} />
                    <span>{idea.tags ? idea.tags.slice(0, 2).join(', ') : 'draft'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Columns: Dual Pane rich editor */}
        <div className="lg:col-span-3 space-y-4">
          {activeIdeaId ? (
            <div className="glass-card flex flex-col justify-between min-h-[440px] rounded-2xl animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-slate-200/50 dark:border-brand-800/30 pb-4 mb-4">
                <input
                  type="text"
                  placeholder="Note Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveIdea}
                  className="bg-transparent font-extrabold text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none flex-1 min-w-0"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      handleSaveIdea();
                    }}
                    className="glass-input py-1.5 px-3 text-[10px] font-bold uppercase w-28 bg-white/70 dark:bg-brand-900/40"
                  >
                    <option value="general">💼 General</option>
                    <option value="startup">💡 Startup</option>
                    <option value="development">💻 Coding</option>
                    <option value="creative">🎨 Creative</option>
                  </select>

                  <button
                    onClick={handleSaveIdea}
                    className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 active:scale-95 transition-all text-[10px] font-extrabold flex items-center gap-1"
                  >
                    <Check size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5 bg-slate-100 dark:bg-brand-800/40 border border-slate-200/50 dark:border-brand-800/50 rounded-2xl p-1 shrink-0">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 ${
                      activeTab === 'edit'
                        ? 'bg-white dark:bg-brand-700 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                    }`}
                  >
                    <Edit3 size={10} />
                    <span>Editor</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 ${
                      activeTab === 'preview'
                        ? 'bg-white dark:bg-brand-700 text-slate-800 dark:text-slate-100 shadow-sm'
                        : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                    }`}
                  >
                    <BookOpen size={10} />
                    <span>Preview</span>
                  </button>
                </div>

                <button
                  onClick={toggleRecording}
                  className={`p-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all border ${
                    isRecording 
                      ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' 
                      : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 border-transparent'
                  }`}
                >
                  {isRecording ? <MicOff size={12} /> : <Mic size={12} />}
                  <span>{isRecording ? 'Listening...' : 'Voice Dictate'}</span>
                </button>
              </div>

              <div className="flex-1">
                {activeTab === 'edit' ? (
                  <textarea
                    placeholder="Type raw notes using Markdown shorthand (e.g. # Title, - lists, **bold**)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onBlur={handleSaveIdea}
                    className="w-full bg-slate-50/50 dark:bg-brand-850/20 border border-slate-200/40 dark:border-brand-800/40 rounded-2xl p-4 text-xs font-mono placeholder:text-slate-400 focus:outline-none min-h-[260px] leading-relaxed resize-none"
                  />
                ) : (
                  <div 
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                    className="w-full bg-slate-50/30 dark:bg-brand-850/10 border border-slate-200/30 dark:border-brand-800/30 rounded-2xl p-4 min-h-[260px] overflow-y-auto"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/40 dark:border-brand-800/20">
                <Tag size={12} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Tags (comma-separated: article, startup)..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onBlur={handleSaveIdea}
                  className="bg-transparent text-[10px] text-slate-505 focus:outline-none placeholder:text-slate-450 w-full"
                />
              </div>

            </div>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center text-center py-24 rounded-2xl">
              <Lightbulb size={36} className="text-slate-350 dark:text-slate-700 animate-pulse mb-3" />
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 font-sans tracking-tight">No Note Selected</h4>
              <p className="text-xs text-slate-450 mt-1 font-medium max-w-xs leading-normal">
                Click any note in the left column list directory, or capture a new note to start brainstorming!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default Ideas;
