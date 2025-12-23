
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Copy, 
  Check,
  Edit3,
  Trash2,
  Clock,
  ChevronUp,
  ChevronDown,
  Move,
  X,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { TimetableEvent, DaySchedule, DurationOption, PASTEL_COLORS, DURATION_LABELS } from './types';
import { ACTIVITY_ICONS } from './constants';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface DraggedItem {
  type: 'new' | 'move';
  data: any;
}

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedules, setSchedules] = useState<Record<string, DaySchedule>>({});
  const [frequentTemplates, setFrequentTemplates] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Sidebar accordion states
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup state to support "Cancel"
  const [backupSchedule, setBackupSchedule] = useState<DaySchedule | null | undefined>(null);

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  // Form State for new Activity
  const [newActTitle, setNewActTitle] = useState('');
  const [newActEmoji, setNewActEmoji] = useState(ACTIVITY_ICONS[0].emoji);
  const [newActDuration, setNewActDuration] = useState<DurationOption>(30);
  const [newActColor, setNewActColor] = useState(PASTEL_COLORS[0]);

  const dateKey = formatDate(selectedDate);
  const currentSchedule = schedules[dateKey];

  // Calculate Yesterday's status
  const yesterday = new Date(selectedDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDate(yesterday);
  const hasYesterday = !!schedules[yesterdayKey];

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedSchedules = localStorage.getItem('kids_schedules');
    const savedTemplates = localStorage.getItem('kids_templates');
    if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
    if (savedTemplates) {
      const parsed = JSON.parse(savedTemplates);
      setFrequentTemplates(parsed);
      // Auto-open creator if no templates exist
      if (parsed.length === 0) setIsCreatorOpen(true);
    } else {
      setIsCreatorOpen(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kids_schedules', JSON.stringify(schedules));
    localStorage.setItem('kids_templates', JSON.stringify(frequentTemplates));
  }, [schedules, frequentTemplates]);

  // Clear selection when switching days or modes
  useEffect(() => {
    setDraggedItem(null);
  }, [selectedDate, isEditing]);

  // Auto-scroll to current time when a schedule is loaded/viewed
  const scrollToCurrentTime = () => {
    if (!currentSchedule || !scrollContainerRef.current) return;
    
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const startMin = currentSchedule.startHour * 60;
    
    // Only scroll if within the schedule's range
    if (totalMinutes >= startMin && totalMinutes <= currentSchedule.endHour * 60) {
      const top = ((totalMinutes - startMin) / 15) * 30;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, top - 200), // Center it, leaving some space above
        behavior: 'smooth'
      });
    }
  };

  // Trigger auto-scroll when entering edit mode or changing date, provided schedule exists
  useEffect(() => {
    if (currentSchedule) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(scrollToCurrentTime, 300);
      return () => clearTimeout(timer);
    }
  }, [dateKey, isEditing, !!currentSchedule]);

  const canNavigateTo = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round(Math.abs(target.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7;
  };

  const handlePrevDay = () => {
    if (isEditing) return;
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    if (canNavigateTo(prevDate)) setSelectedDate(prevDate);
  };

  const handleNextDay = () => {
    if (isEditing) return;
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    if (canNavigateTo(nextDate)) setSelectedDate(nextDate);
  };

  const startEditing = () => {
    setBackupSchedule(currentSchedule ? { ...currentSchedule, events: [...currentSchedule.events.map(e => ({...e}))] } : undefined);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setSchedules(prev => {
      const next = { ...prev };
      if (backupSchedule === undefined) {
        delete next[dateKey];
      } else if (backupSchedule !== null) {
        next[dateKey] = backupSchedule;
      }
      return next;
    });
    setIsEditing(false);
    setBackupSchedule(null);
  };

  const saveEditing = () => {
    setIsEditing(false);
    setBackupSchedule(null);
  };

  const createSchedule = (start = 7, end = 21) => {
    setBackupSchedule(undefined);
    const newSchedule: DaySchedule = {
      date: dateKey,
      startHour: start,
      endHour: end,
      events: []
    };
    setSchedules(prev => ({ ...prev, [dateKey]: newSchedule }));
    setIsEditing(true);
  };

  const copyYesterday = () => {
    if (!hasYesterday) return;
    const yesterdaySchedule = schedules[yesterdayKey];
    setSchedules(prev => ({
      ...prev,
      [dateKey]: { 
        ...yesterdaySchedule, 
        date: dateKey,
        events: yesterdaySchedule.events.map(e => ({ ...e, id: Math.random().toString(36).substr(2, 9) }))
      }
    }));
  };

  const addNewFrequentActivity = () => {
    if (!newActTitle) return;
    const template = {
      id: Date.now().toString(),
      title: newActTitle,
      duration: newActDuration,
      color: newActColor,
      emoji: newActEmoji,
      usageCount: 0
    };
    setFrequentTemplates(prev => [template, ...prev]);
    setNewActTitle('');
    // Optionally close creator after adding
    // setIsCreatorOpen(false); 
  };

  const addOrMoveEvent = (data: any, startTime: number, isMove = false) => {
    if (!currentSchedule) return;
    const duration = data.duration;
    const endTime = startTime + duration;
    
    if (endTime > currentSchedule.endHour * 60) return false;

    const overlap = currentSchedule.events.find(e => {
      if (isMove && e.id === data.id) return false;
      const eEnd = e.startTime + e.duration;
      return (startTime < eEnd && endTime > e.startTime);
    });

    if (overlap) return false;

    let updatedEvents;
    if (isMove) {
      updatedEvents = currentSchedule.events.map(e => 
        e.id === data.id ? { ...e, startTime } : e
      );
    } else {
      const newEvent: TimetableEvent = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        startTime
      };
      updatedEvents = [...currentSchedule.events, newEvent];
    }

    setSchedules(prev => ({
      ...prev,
      [dateKey]: { 
        ...currentSchedule, 
        events: updatedEvents.sort((a, b) => a.startTime - b.startTime)
      }
    }));
    return true;
  };

  const deleteEvent = (eventId: string) => {
    if (!currentSchedule) return;
    setSchedules(prev => ({
      ...prev,
      [dateKey]: {
        ...currentSchedule,
        events: currentSchedule.events.filter(e => e.id !== eventId)
      }
    }));
    if (draggedItem?.data?.id === eventId) setDraggedItem(null);
  };

  const updateHour = (type: 'start' | 'end', delta: number) => {
    if (!currentSchedule) return;
    let val = type === 'start' ? currentSchedule.startHour : currentSchedule.endHour;
    val = Math.max(0, Math.min(23, val + delta));
    setSchedules(prev => ({
      ...prev,
      [dateKey]: { 
        ...currentSchedule, 
        [type === 'start' ? 'startHour' : 'endHour']: val 
      }
    }));
  };

  const handleExport = () => {
    const data = {
      schedules,
      frequentTemplates,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `little-star-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSettingsOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.schedules && data.frequentTemplates) {
          if (window.confirm('This will replace your current schedule with the backup. Are you sure?')) {
            setSchedules(data.schedules);
            setFrequentTemplates(data.frequentTemplates);
            setIsSettingsOpen(false);
          }
        } else {
          alert('Invalid backup file');
        }
      } catch (err) {
        alert('Error reading backup file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const timeIndicatorTop = useMemo(() => {
    if (!currentSchedule) return null;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const startMin = currentSchedule.startHour * 60;
    const endMin = currentSchedule.endHour * 60;
    if (totalMinutes < startMin || totalMinutes > endMin) return null;
    return ((totalMinutes - startMin) / (endMin - startMin)) * 100;
  }, [currentTime, currentSchedule]);

  const timeSlots = useMemo(() => {
    if (!currentSchedule) return [];
    const slots = [];
    const startMin = currentSchedule.startHour * 60;
    const endMin = currentSchedule.endHour * 60;
    for (let t = startMin; t < endMin; t += 15) {
      slots.push(t);
    }
    return slots;
  }, [currentSchedule]);

  const handleSlotInteraction = (t: number) => {
    if (isEditing && draggedItem) {
      const success = addOrMoveEvent(draggedItem.data, t, draggedItem.type === 'move');
      if (success) {
        setDraggedItem(null); 
        setHoveredSlot(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fbff] overflow-hidden text-slate-800">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept=".json" 
        onChange={handleImport} 
      />

      <header className="bg-white px-8 py-5 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={handlePrevDay} 
            disabled={isEditing || !canNavigateTo(new Date(selectedDate.getTime() - 86400000))}
            className={`p-3 rounded-2xl transition-transform active:scale-90 disabled:opacity-30 ${isEditing ? 'bg-slate-50 text-slate-300' : 'bg-sky-50 text-sky-500'}`}
          >
            <ChevronLeft size={32} strokeWidth={3} />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-sky-950">{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</h1>
            <p className="text-sky-400 font-bold tracking-wide uppercase text-xs">{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
          </div>
          <button 
            onClick={handleNextDay} 
            disabled={isEditing || !canNavigateTo(new Date(selectedDate.getTime() + 86400000))}
            className={`p-3 rounded-2xl transition-transform active:scale-90 disabled:opacity-30 ${isEditing ? 'bg-slate-50 text-slate-300' : 'bg-sky-50 text-sky-500'}`}
          >
            <ChevronRight size={32} strokeWidth={3} />
          </button>
        </div>

        <div className="flex gap-3 items-center">
          {!currentSchedule ? null : isEditing ? (
            <>
              <button 
                onClick={cancelEditing}
                className="px-6 py-4 bg-slate-100 text-slate-500 rounded-[1.5rem] font-bold flex items-center gap-2 active:scale-95 transition-all"
              >
                <X size={24} /> Cancel
              </button>
              <button 
                onClick={saveEditing}
                className="px-8 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-bold shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95 transition-all"
              >
                <Check size={24} strokeWidth={3} /> Save Plan
              </button>
            </>
          ) : (
            <button 
              onClick={startEditing}
              className="px-8 py-4 bg-sky-500 text-white rounded-[1.5rem] font-bold shadow-lg shadow-sky-100 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Edit3 size={24} /> Edit Day
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-8 bg-slate-100 mx-2"></div>

          {/* Settings Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-4 rounded-[1.5rem] transition-all ${isSettingsOpen ? 'bg-sky-50 text-sky-500' : 'bg-slate-50 text-slate-300 hover:text-sky-500 hover:bg-sky-50'}`}
            >
              <Settings size={24} />
            </button>
            
            {isSettingsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSettingsOpen(false)}
                ></div>
                <div className="absolute top-full right-0 mt-4 w-64 bg-white rounded-3xl shadow-xl border-4 border-slate-50 p-2 z-50 animate-in fade-in slide-in-from-top-4">
                  <h4 className="px-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Data Management</h4>
                  <button 
                    onClick={handleExport}
                    className="w-full p-4 flex items-center gap-3 hover:bg-sky-50 rounded-2xl text-sky-900 font-bold transition-colors text-left"
                  >
                    <Download size={20} className="text-sky-400" />
                    Backup to File
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 flex items-center gap-3 hover:bg-amber-50 rounded-2xl text-amber-900 font-bold transition-colors text-left"
                  >
                    <Upload size={20} className="text-amber-400" />
                    Restore Backup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        <div className={`flex-1 bg-white rounded-[2.5rem] shadow-xl border-4 border-white overflow-hidden flex flex-col transition-all duration-500 ${!isEditing ? 'mx-auto max-w-2xl' : ''}`}>
          {!currentSchedule ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-white to-sky-50">
              <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center text-5xl mb-6">🗓️</div>
              <h2 className="text-3xl font-bold text-sky-950 mb-4">Ready for an adventure?</h2>
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button onClick={() => createSchedule()} className="w-full py-5 bg-sky-500 text-white rounded-3xl font-bold text-xl shadow-xl shadow-sky-100 flex items-center justify-center gap-3 active:scale-95 transition-all"><Plus size={32} strokeWidth={3} /> Start Today</button>
              </div>
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto relative bg-white touch-pan-y scrollbar-hide"
            >
              <div className="flex min-h-full relative">
                <div className="w-24 border-r-2 border-slate-50 flex flex-col sticky left-0 bg-white z-10">
                  {Array.from({ length: currentSchedule.endHour - currentSchedule.startHour + 1 }).map((_, i) => {
                    const hour = currentSchedule.startHour + i;
                    return (
                      <div key={hour} className="h-[120px] border-b border-slate-50 flex items-start justify-center pt-3">
                        <span className="text-sm font-black text-slate-300 uppercase tracking-tighter">
                          {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex-1 relative bg-slate-50/30">
                  {timeSlots.map((t) => (
                    <div 
                      key={t}
                      onDragOver={(e) => { 
                        e.preventDefault(); 
                        if (isEditing) setHoveredSlot(t);
                      }}
                      onDragLeave={() => setHoveredSlot(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedItem) {
                          addOrMoveEvent(draggedItem.data, t, draggedItem.type === 'move');
                        }
                        setDraggedItem(null);
                        setHoveredSlot(null);
                      }}
                      onClick={() => handleSlotInteraction(t)}
                      className={`h-[30px] border-b relative group flex items-center justify-center ${t % 60 === 0 ? 'border-slate-200' : 'border-slate-50'}`}
                    >
                      {/* Free Time Label */}
                      {!isEditing && (
                         <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest pointer-events-none select-none">Free Time</span>
                      )}

                      {/* Ghost Preview */}
                      {(hoveredSlot === t || (draggedItem && !hoveredSlot && draggedItem.type === 'move' && draggedItem.data.startTime === -1)) && draggedItem && (
                        <div 
                          style={{ 
                            height: `${(draggedItem.data.duration / 15) * 30}px`, 
                            backgroundColor: draggedItem.data.color,
                            top: 0
                          }}
                          className="absolute left-1 right-2 rounded-2xl opacity-60 z-[35] pointer-events-none border-2 border-dashed border-sky-400 shadow-lg flex flex-col p-4 overflow-hidden animate-pulse"
                        >
                          <div className="flex items-center gap-3">
                             <span className="text-3xl grayscale">{draggedItem.data.emoji}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {currentSchedule.events.map((event) => {
                    const top = ((event.startTime - currentSchedule.startHour * 60) / 15) * 30;
                    const height = (event.duration / 15) * 30;
                    const isBeingMoved = draggedItem?.type === 'move' && draggedItem.data.id === event.id;

                    return (
                      <div 
                        key={event.id}
                        draggable={isEditing}
                        onDragStart={(e) => {
                          if (!isEditing) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('text/plain', '');
                          e.dataTransfer.effectAllowed = 'move';
                          // We use a brief timeout so the element still exists for the drag start
                          setTimeout(() => {
                            setDraggedItem({ type: 'move', data: event });
                          }, 10);
                        }}
                        onDragEnd={() => {
                          setDraggedItem(null);
                          setHoveredSlot(null);
                        }}
                        onClick={(e) => {
                          if (!isEditing) return;
                          e.stopPropagation();
                          if (draggedItem?.data?.id === event.id) {
                            setDraggedItem(null);
                          } else {
                            setDraggedItem({ type: 'move', data: event });
                          }
                        }}
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`, 
                          backgroundColor: event.color,
                          pointerEvents: isBeingMoved ? 'none' : 'auto',
                          opacity: isBeingMoved ? 0.4 : 1
                        }}
                        className={`absolute left-2 right-4 rounded-3xl shadow-lg border-4 border-white flex flex-col p-4 overflow-hidden z-20 group transition-all duration-200 
                          ${isEditing ? 'cursor-pointer hover:scale-[1.01]' : ''} 
                          ${isBeingMoved ? 'ring-4 ring-sky-400 ring-offset-2' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl drop-shadow-sm">{event.emoji}</span>
                            <div>
                              <h4 className="font-black text-slate-800 text-lg leading-tight truncate">{event.title}</h4>
                              <p className="text-xs font-bold text-slate-600 opacity-60 flex items-center gap-1"><Clock size={12}/> {event.duration}m</p>
                            </div>
                          </div>
                          {isEditing && (
                            <div className="flex gap-1">
                              <div className="p-2 bg-white/20 rounded-2xl text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Move size={20} />
                              </div>
                              <button 
                                onPointerDown={(e) => e.stopPropagation()} 
                                onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }} 
                                className="p-2 bg-white/40 hover:bg-white/80 rounded-2xl text-rose-500 transition-colors"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {timeIndicatorTop !== null && (
                    <div 
                      className="absolute left-0 right-0 z-40 pointer-events-none flex items-center"
                      style={{ top: `${(timeIndicatorTop / 100) * (currentSchedule.endHour - currentSchedule.startHour) * 4 * 30}px` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-rose-500 -ml-3 border-4 border-white shadow-xl" />
                      <div className="flex-1 h-1 bg-rose-500 shadow-sm" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isEditing && currentSchedule && (
          <aside className="w-[400px] flex flex-col gap-6 overflow-hidden">
            {/* Options Section */}
            <section className="bg-white rounded-[2rem] shadow-xl overflow-hidden border-4 border-white flex-shrink-0 transition-all">
              <button 
                onClick={() => setIsOptionsOpen(!isOptionsOpen)} 
                className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-lg font-black text-sky-950 flex items-center gap-2">☀️ Options</h3>
                <div className={`transition-transform duration-300 ${isOptionsOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown className="text-sky-300" />
                </div>
              </button>
              
              {isOptionsOpen && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={copyYesterday}
                    disabled={!hasYesterday}
                    className={`w-full py-4 mb-6 border-4 rounded-3xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all 
                      ${hasYesterday ? 'border-sky-100 text-sky-500 hover:bg-sky-50 bg-white' : 'border-slate-50 text-slate-300 bg-slate-50 opacity-50 cursor-not-allowed'}
                    `}
                  >
                    <Copy size={20} /> Copy from Yesterday
                  </button>

                  <div className="flex gap-4">
                    <div className="flex-1 bg-sky-50 p-4 rounded-3xl flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-sky-400 uppercase">Wake</p>
                        <p className="text-xl font-black text-sky-900">{currentSchedule.startHour}:00</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => updateHour('start', -1)} className="p-1 hover:bg-white rounded-lg transition-colors"><ChevronUp size={20} /></button>
                        <button onClick={() => updateHour('start', 1)} className="p-1 hover:bg-white rounded-lg transition-colors"><ChevronDown size={20} /></button>
                      </div>
                    </div>
                    <div className="flex-1 bg-rose-50 p-4 rounded-3xl flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-rose-400 uppercase">Sleep</p>
                        <p className="text-xl font-black text-rose-900">{currentSchedule.endHour}:00</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => updateHour('end', -1)} className="p-1 hover:bg-white rounded-lg transition-colors"><ChevronUp size={20} /></button>
                        <button onClick={() => updateHour('end', 1)} className="p-1 hover:bg-white rounded-lg transition-colors"><ChevronDown size={20} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* New Activity Section */}
            <section className="bg-white rounded-[2rem] shadow-xl overflow-hidden border-4 border-white flex-shrink-0 transition-all">
              <button 
                onClick={() => setIsCreatorOpen(!isCreatorOpen)} 
                className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-lg font-black text-sky-950 flex items-center gap-2">✨ New Activity</h3>
                <div className={`transition-transform duration-300 ${isCreatorOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown className="text-sky-300" />
                </div>
              </button>

              {isCreatorOpen && (
                <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <input 
                    type="text" 
                    placeholder="Activity Name..." 
                    value={newActTitle}
                    onChange={(e) => setNewActTitle(e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-sky-300 outline-none font-bold"
                  />
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {ACTIVITY_ICONS.map(icon => (
                      <button 
                        key={icon.emoji} 
                        onClick={() => setNewActEmoji(icon.emoji)}
                        className={`text-2xl p-3 rounded-2xl transition-all flex-shrink-0 ${newActEmoji === icon.emoji ? 'bg-sky-500 shadow-lg scale-110 text-white' : 'bg-slate-50'}`}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {([15, 30, 60, 90, 120] as DurationOption[]).map(d => (
                      <button 
                        key={d} 
                        onClick={() => setNewActDuration(d)}
                        className={`text-xs font-black p-3 rounded-xl transition-all ${newActDuration === d ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {DURATION_LABELS[d]}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {PASTEL_COLORS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setNewActColor(c)}
                        style={{ backgroundColor: c }}
                        className={`flex-1 h-8 rounded-lg border-2 ${newActColor === c ? 'border-slate-800' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={addNewFrequentActivity}
                    disabled={!newActTitle}
                    className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 disabled:opacity-30 transition-all"
                  >
                    Create & Save
                  </button>
                </div>
              )}
            </section>

            {/* My Activities Section (Scrollable) */}
            <section className="flex-1 bg-white rounded-[2rem] shadow-xl p-6 border-4 border-white flex flex-col overflow-hidden min-h-[200px]">
              <h3 className="text-lg font-black text-sky-950 mb-4 flex items-center gap-2 flex-shrink-0">📦 My Activities</h3>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-2">
                {frequentTemplates.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <p className="text-slate-300 font-bold italic">Create your first activity above! 🚀</p>
                  </div>
                ) : frequentTemplates.map(template => (
                  <div
                    key={template.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', '');
                      setDraggedItem({ type: 'new', data: template });
                    }}
                    onDragEnd={() => { setDraggedItem(null); setHoveredSlot(null); }}
                    onClick={() => setDraggedItem(draggedItem?.data?.id === template.id ? null : { type: 'new', data: template })}
                    style={{ backgroundColor: template.color }}
                    className={`p-4 rounded-3xl shadow-sm border-2 border-white flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all hover:brightness-95 select-none ${draggedItem?.data?.id === template.id ? 'ring-4 ring-sky-300 scale-95 opacity-50' : ''}`}
                  >
                    <span className="text-3xl">{template.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800">{template.title}</h4>
                      <p className="text-[10px] font-black text-slate-600 uppercase opacity-50">{template.duration} mins</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFrequentTemplates(prev => prev.filter(t => t.id !== template.id));
                      }}
                      className="p-2 hover:bg-white/30 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-sky-50 rounded-2xl text-center flex-shrink-0">
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Tap to Select, Tap Slot to Place</p>
              </div>
            </section>
          </aside>
        )}
      </main>
    </div>
  );
};

export default App;
