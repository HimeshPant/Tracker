import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Loader2,
  Layout,
  Zap,
  Target,
  Check,
  Play,
  Pause,
  Square,
  RotateCcw,
  Activity,
  Rocket,
  Plus,
  X,
  ListTodo,
  Trophy,
  TrendingUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Clock, // Ensure Clock is imported
} from "lucide-react";

// --- 1. INTERNAL DATABASE SERVICE ---
const DB_KEYS = {
  LOGS: "protocol_logs_v5",
  CHALLENGES: "protocol_challenges_v2",
};

const DEFAULT_LOG = {
  currentPhase: "Imagine Cup Submission",
  primaryTask: "",
  primaryDone: false,
  primaryDuration: 0,
  imagineCupDone: false,
  imagineCupNote: "",
  imagineCupDuration: 0,
  mathsDone: false,
  mathsNote: "",
  mathsDuration: 0,
  dsaDone: false,
  dsaNote: "",
  dsaDuration: 0,
  customTasks: [],
  startTime: "",
  deepWork: false,
  distractionBreach: false,
  blocker: "",
  improvement: "",
};

// Helper: Streak Calculator
function calculateStreak(dates) {
  if (!dates || !Array.isArray(dates) || dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (sorted[0] !== today && sorted[0] !== yesterday) {
    if (sorted[0] < yesterday) return 0;
  }

  let streak = 0;
  let current = new Date(sorted[0]);

  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i]);
    const diffTime = Math.abs(current - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (i === 0) {
      streak++;
      continue;
    }
    if (diffDays <= 1) {
      streak++;
      current = d;
    } else break;
  }
  return streak;
}

const storageService = {
  async getLog(date) {
    try {
      const allLogs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || "{}");
      const todayLog = allLogs[date];
      return todayLog ? { ...DEFAULT_LOG, ...todayLog } : { ...DEFAULT_LOG };
    } catch (error) {
      return DEFAULT_LOG;
    }
  },

  async saveLog(date, data) {
    try {
      const allLogs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || "{}");
      allLogs[date] = { ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(allLogs));
      return allLogs[date];
    } catch (error) {
      console.error("Log Save Error:", error);
    }
  },

  async getChallenges() {
    try {
      const list = JSON.parse(localStorage.getItem(DB_KEYS.CHALLENGES) || "[]");
      return list.map((c) => ({
        ...c,
        history: Array.isArray(c.history) ? c.history : [],
      }));
    } catch (error) {
      return [];
    }
  },

  async saveChallenge(challenge) {
    const list = await this.getChallenges();
    const index = list.findIndex((c) => c.id === challenge.id);
    if (!challenge.history) challenge.history = [];

    if (index >= 0) list[index] = challenge;
    else list.push(challenge);

    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(list));
    return list;
  },

  async deleteChallenge(id) {
    const list = await this.getChallenges();
    const newList = list.filter((c) => c.id !== id);
    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(newList));
    return newList;
  },

  async toggleChallengeDate(id, dateStr) {
    let list = await this.getChallenges();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return list;

    const challenge = list[idx];
    if (!challenge.history) challenge.history = [];

    const dateIndex = challenge.history.indexOf(dateStr);

    if (dateIndex > -1) {
      challenge.history.splice(dateIndex, 1);
    } else {
      challenge.history.push(dateStr);
    }

    challenge.history.sort();
    challenge.currentStreak = calculateStreak(challenge.history);
    challenge.lastCompletedDate =
      challenge.history[challenge.history.length - 1] || null;

    list[idx] = challenge;
    localStorage.setItem(DB_KEYS.CHALLENGES, JSON.stringify(list));
    return [...list];
  },

  async toggleChallengeStreak(id, date) {
    return this.toggleChallengeDate(id, date);
  },
};

// --- 2. CONFIGURATION & HELPERS ---
const PHASES = [
  "Imagine Cup Submission",
  "Exams Phase",
  "Internship Hunt",
  "Tech Certificates",
];

const getLocalToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDuration = (seconds) => {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatBigClock = (seconds) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// --- 3. MAIN COMPONENT ---
export default function App() {
  const [date, setDate] = useState(getLocalToday());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [log, setLog] = useState(DEFAULT_LOG);
  const [challenges, setChallenges] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [newTaskInput, setNewTaskInput] = useState("");
  const timerRef = useRef(null);

  const forceSave = async (data) => {
    setSaving(true);
    await storageService.saveLog(date, data);
    setSaving(false);
  };

  const toggleTimer = (taskKey) => {
    if (activeTimer === taskKey) {
      setActiveTimer(null);
      forceSave(log);
    } else {
      if (activeTimer) forceSave(log);
      setActiveTimer(taskKey);
    }
  };

  const saveData = async (newLog) => {
    setLog(newLog);
    if (!saving) {
      setSaving(true);
      await storageService.saveLog(date, newLog);
      setSaving(false);
    }
  };

  const goToToday = () => {
    if (activeTimer) setActiveTimer(null);
    setDate(getLocalToday());
  };

  const handleToggleHabitDate = async (id, dateStr) => {
    const updatedChallenges = challenges.map((c) => {
      if (c.id === id) {
        const history = c.history.includes(dateStr)
          ? c.history.filter((d) => d !== dateStr)
          : [...c.history, dateStr];
        return { ...c, history };
      }
      return c;
    });
    setChallenges(updatedChallenges);
    const serverList = await storageService.toggleChallengeDate(id, dateStr);
    setChallenges(serverList);
  };

  const handleAddHabit = async (title) => {
    const newHabit = { id: Date.now(), title, history: [] };
    const updatedList = await storageService.saveChallenge(newHabit);
    setChallenges(updatedList);
  };

  const handleDeleteHabit = async (id) => {
    const updatedList = await storageService.deleteChallenge(id);
    setChallenges(updatedList);
  };

  const addCustomTask = () => {
    if (!newTaskInput.trim()) return;
    const newTask = { id: Date.now(), text: newTaskInput, isDone: false };
    const updatedTasks = [...(log.customTasks || []), newTask];
    saveData({ ...log, customTasks: updatedTasks });
    setNewTaskInput("");
  };

  const toggleCustomTask = (taskId) => {
    const updatedTasks = (log.customTasks || []).map((t) =>
      t.id === taskId ? { ...t, isDone: !t.isDone } : t
    );
    saveData({ ...log, customTasks: updatedTasks });
  };

  const deleteCustomTask = (taskId) => {
    const updatedTasks = (log.customTasks || []).filter((t) => t.id !== taskId);
    saveData({ ...log, customTasks: updatedTasks });
  };

  useEffect(() => {
    async function loadDailyData() {
      setLoading(true);
      setActiveTimer(null);
      const data = await storageService.getLog(date);
      setLog(data);
      let feats = await storageService.getChallenges();
      if (feats.length === 0) {
        await storageService.saveChallenge({
          id: "c1",
          title: "Gym / Fitness",
          history: [],
        });
        feats = await storageService.getChallenges();
      }
      setChallenges(feats);
      setLoading(false);
    }
    loadDailyData();
  }, [date]);

  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setLog((prevLog) => {
          const field = `${activeTimer}Duration`;
          return { ...prevLog, [field]: (prevLog[field] || 0) + 1 };
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  const totalDuration =
    (log.primaryDuration || 0) +
    (log.imagineCupDuration || 0) +
    (log.mathsDuration || 0) +
    (log.dsaDuration || 0) +
    (log.deepWorkDuration || 0);

  const tasksTotal = 4;
  const tasksDone = [
    log.primaryDone,
    log.imagineCupDone,
    log.mathsDone,
    log.dsaDone,
  ].filter(Boolean).length;
  const progressPercent = Math.round((tasksDone / tasksTotal) * 100);
  const isToday = date === getLocalToday();

  // --- FULL SCREEN TIMER COMPONENT ---
  if (activeTimer) {
    const currentDuration =
      activeTimer === "primary"
        ? log.primaryDuration
        : activeTimer === "imagineCup"
        ? log.imagineCupDuration
        : activeTimer === "maths"
        ? log.mathsDuration
        : activeTimer === "dsa"
        ? log.dsaDuration
        : log.deepWorkDuration;

    const taskName =
      activeTimer === "primary"
        ? "Primary Phase"
        : activeTimer === "imagineCup"
        ? "Imagine Cup"
        : activeTimer === "maths"
        ? "Mathematics"
        : activeTimer === "dsa"
        ? "DSA Protocol"
        : "Deep Work Session";

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 animate-in zoom-in duration-300">
        <div className="text-[#F58F7C] text-xl tracking-[0.5em] font-bold uppercase mb-8 animate-pulse text-center">
          Session Active
        </div>

        <h1 className="text-[#F2C4CE] text-3xl md:text-6xl font-black mb-4 text-center">
          {taskName}
        </h1>

        {/* RESPONSIVE CLOCK TEXT */}
        <div className="font-mono text-6xl sm:text-8xl md:text-[12rem] font-bold text-white leading-none tracking-tighter tabular-nums select-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] text-center">
          {formatBigClock(currentDuration)}
        </div>

        <div className="mt-16 flex gap-8">
          <button
            onClick={() => toggleTimer(activeTimer)}
            className="group flex items-center gap-4 px-8 py-4 md:px-12 md:py-6 bg-[#F58F7C] hover:bg-[#F2C4CE] text-[#2C2B30] text-xl md:text-2xl font-black rounded-full transition-all shadow-[0_0_40px_rgba(245,143,124,0.4)] hover:shadow-[0_0_60px_rgba(242,196,206,0.6)]"
          >
            <Square className="w-6 h-6 md:w-8 md:h-8 fill-current" />
            STOP SESSION
          </button>
        </div>

        <p className="mt-8 text-gray-500 text-sm font-mono text-center">
          Focus. Execute. Repeat.
        </p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-black text-[#F2C4CE] gap-3 font-sans font-bold">
        <Loader2 className="animate-spin w-5 h-5" /> INITIALIZING...
      </div>
    );

  return (
    <div className="min-h-screen pb-40 font-sans text-white bg-black selection:bg-[#F58F7C]/30">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#2C2B30]">
        <div className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F2C4CE] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(242,196,206,0.3)]">
              <Layout className="text-[#2C2B30] w-6 h-6" />
            </div>
            <h1 className="font-black text-2xl text-[#F2C4CE] hidden sm:block tracking-widest uppercase">
              Execution Tracker
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!isToday && (
              <button
                onClick={goToToday}
                className="flex items-center gap-2 text-xs font-bold text-[#2C2B30] bg-[#F58F7C] hover:bg-[#F2C4CE] transition-colors px-4 py-2 rounded-full"
              >
                <RotateCcw className="w-3 h-3" /> RETURN TO LIVE
              </button>
            )}
            <div className="relative group">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#2C2B30] border border-transparent rounded-lg text-sm font-bold text-[#F2C4CE] px-4 py-2 pl-10 outline-none focus:border-[#F58F7C] transition-colors cursor-pointer hover:bg-[#2C2B30]/80"
              />
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#F2C4CE] pointer-events-none" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* 1. LIVE ANALYTICS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-[#F2C4CE] p-5 rounded-2xl flex items-center gap-4 shadow-[0_0_20px_rgba(242,196,206,0.15)] transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-full bg-[#2C2B30]/10 flex items-center justify-center text-[#2C2B30]">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#2C2B30]/70 font-bold">
                Focus Time
              </p>
              <p className="text-2xl font-mono font-bold text-[#2C2B30]">
                {formatDuration(totalDuration)}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#F2C4CE] p-5 rounded-2xl flex items-center gap-4 shadow-[0_0_20px_rgba(242,196,206,0.15)] transform hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-full bg-[#2C2B30]/10 flex items-center justify-center text-[#2C2B30]">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#2C2B30]/70 font-bold">
                Progress
              </p>
              <p className="text-2xl font-mono font-bold text-[#2C2B30]">
                {progressPercent}%
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#2C2B30] border border-[#F2C4CE]/20 p-5 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-2 hover:border-[#F2C4CE] transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3 text-white">
                <Clock className="w-5 h-5 text-[#F58F7C]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#F58F7C]">
                  Start Time
                </span>
              </div>
              <input
                type="time"
                value={log.startTime || ""}
                onChange={(e) =>
                  saveData({ ...log, startTime: e.target.value })
                }
                className="bg-transparent text-xl font-mono font-bold text-white focus:outline-none text-right w-32"
              />
            </div>
            <div className="h-[1px] bg-white/10 w-full my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-white">
                Deep Work Mode
              </span>

              {/* DEEP WORK TIMER BUTTON */}
              <button
                onClick={() => toggleTimer("deepWork")}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${
                  activeTimer === "deepWork"
                    ? "bg-[#F58F7C] text-[#2C2B30] animate-pulse"
                    : "bg-black border border-[#F58F7C] text-[#F58F7C] hover:bg-[#F58F7C] hover:text-[#2C2B30]"
                }`}
              >
                {activeTimer === "deepWork" ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                {activeTimer === "deepWork" ? "ACTIVE" : "START SESSION"}
              </button>
            </div>
          </div>
        </section>

        {/* 2. PRIMARY FOCUS */}
        <section className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F2C4CE] to-[#F58F7C] rounded-3xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="relative bg-[#2C2B30] border border-[#F2C4CE]/20 rounded-3xl p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
              <div className="flex flex-col w-full md:w-auto">
                <label className="text-[10px] font-bold text-[#F58F7C] uppercase tracking-widest mb-2">
                  Primary Objective
                </label>
                <select
                  value={log.currentPhase || PHASES[0]}
                  onChange={(e) =>
                    saveData({ ...log, currentPhase: e.target.value })
                  }
                  className="bg-black border border-[#2C2B30] text-[#F2C4CE] text-lg font-bold rounded-lg px-4 py-2 cursor-pointer outline-none focus:border-[#F58F7C] block w-full md:w-auto hover:bg-[#2C2B30] transition-colors"
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="font-mono text-xs text-[#F2C4CE] border border-[#F2C4CE]/30 px-3 py-1.5 rounded-full">
                  {formatDuration(log.primaryDuration)}
                </div>
                {/* BIG FOCUS BUTTON */}
                <button
                  onClick={() => toggleTimer("primary")}
                  className="flex items-center gap-2 bg-[#F58F7C] hover:bg-[#F2C4CE] text-[#2C2B30] px-5 py-2 rounded-full text-xs font-black transition-all shadow-lg shadow-[#F58F7C]/20"
                >
                  <Maximize2 className="w-3 h-3" /> FOCUS MODE
                </button>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <button
                onClick={() =>
                  saveData({ ...log, primaryDone: !log.primaryDone })
                }
                className={`flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                  log.primaryDone
                    ? "bg-[#F2C4CE] border-[#F2C4CE] text-[#2C2B30] shadow-[0_0_30px_rgba(242,196,206,0.3)]"
                    : "border-[#F2C4CE]/30 text-transparent hover:border-[#F2C4CE]"
                }`}
              >
                <Check className="w-8 h-8" strokeWidth={4} />
              </button>

              <textarea
                value={log.primaryTask || ""}
                onChange={(e) =>
                  saveData({ ...log, primaryTask: e.target.value })
                }
                placeholder="What is the ONE thing you must do?"
                className={`w-full text-3xl md:text-5xl font-black bg-transparent border-none focus:ring-0 resize-none leading-tight transition-all placeholder:text-[#F2C4CE]/20 ${
                  log.primaryDone
                    ? "text-[#F58F7C] line-through opacity-40"
                    : "text-white"
                }`}
                rows={2}
              />
            </div>
          </div>
        </section>

        {/* 3. CORE TASKS & SIDE QUESTS */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-[#F2C4CE] uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4" /> Core Protocols
            </h2>

            <FixedBlock
              title="Imagine Cup"
              icon={<Rocket className="w-4 h-4" />}
              isDone={log.imagineCupDone}
              note={log.imagineCupNote}
              duration={log.imagineCupDuration}
              onToggleTimer={() => toggleTimer("imagineCup")}
              onChange={({ isDone, note }) =>
                saveData({
                  ...log,
                  imagineCupDone: isDone,
                  imagineCupNote: note,
                })
              }
            />
            <FixedBlock
              title="Maths"
              icon="Σ"
              isDone={log.mathsDone}
              note={log.mathsNote}
              duration={log.mathsDuration}
              onToggleTimer={() => toggleTimer("maths")}
              onChange={({ isDone, note }) =>
                saveData({ ...log, mathsDone: isDone, mathsNote: note })
              }
            />
            <FixedBlock
              title="DSA / OOPs"
              icon="{}"
              isDone={log.dsaDone}
              note={log.dsaNote}
              duration={log.dsaDuration}
              onToggleTimer={() => toggleTimer("dsa")}
              onChange={({ isDone, note }) =>
                saveData({ ...log, dsaDone: isDone, dsaNote: note })
              }
            />
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-xs font-bold text-[#F2C4CE] uppercase tracking-widest flex items-center gap-2">
                <ListTodo className="w-4 h-4" /> Side Quests
              </h2>
              <div className="bg-[#2C2B30] border border-[#F2C4CE]/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTask()}
                    placeholder="Add side task..."
                    className="bg-black border border-[#F2C4CE]/30 text-sm rounded-lg px-4 py-3 w-full focus:border-[#F2C4CE] outline-none placeholder:text-[#F2C4CE]/30 text-[#F2C4CE]"
                  />
                  <button
                    onClick={addCustomTask}
                    className="bg-[#F2C4CE] text-[#2C2B30] p-3 rounded-lg hover:bg-[#F58F7C] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {(!log.customTasks || log.customTasks.length === 0) && (
                    <p className="text-xs text-[#F58F7C] text-center py-4 italic opacity-50">
                      No side quests active.
                    </p>
                  )}
                  {log.customTasks?.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-[#F2C4CE]/5 transition-colors border border-transparent hover:border-[#F2C4CE]/20"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleCustomTask(task.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            task.isDone
                              ? "bg-[#F2C4CE] border-[#F2C4CE] text-[#2C2B30]"
                              : "border-[#F2C4CE]/50 hover:border-[#F2C4CE]"
                          }`}
                        >
                          {task.isDone && (
                            <Check className="w-3 h-3" strokeWidth={3} />
                          )}
                        </button>
                        <span
                          className={`text-sm ${
                            task.isDone
                              ? "text-[#F58F7C] line-through"
                              : "text-white"
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteCustomTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#F58F7C] hover:text-red-500 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xs font-bold text-[#F2C4CE] uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4" /> Reflection
              </h2>
              <div className="bg-[#2C2B30] border border-[#F2C4CE]/20 rounded-2xl p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-[#F58F7C] uppercase tracking-widest mb-2 block">
                    Blockers
                  </label>
                  <input
                    type="text"
                    value={log.blocker || ""}
                    onChange={(e) =>
                      saveData({ ...log, blocker: e.target.value })
                    }
                    placeholder="What stopped you?"
                    className="w-full bg-black border border-[#2C2B30] rounded-lg p-3 text-sm text-white focus:border-[#F58F7C] outline-none placeholder:text-[#F58F7C]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#F2C4CE] uppercase tracking-widest mb-2 block">
                    Improvement
                  </label>
                  <input
                    type="text"
                    value={log.improvement || ""}
                    onChange={(e) =>
                      saveData({ ...log, improvement: e.target.value })
                    }
                    placeholder="One thing to fix tomorrow..."
                    className="w-full bg-black border border-[#2C2B30] rounded-lg p-3 text-sm text-white focus:border-[#F2C4CE] outline-none placeholder:text-[#F2C4CE]/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="pt-8 mt-8">
          <MonthTracker
            challenges={challenges}
            onToggleDate={handleToggleHabitDate}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        </section>
      </main>
    </div>
  );
}

// --- INTERNAL COMPONENTS ---

function FixedBlock({
  title,
  icon,
  isDone,
  note,
  duration,
  onToggleTimer,
  onChange,
}) {
  return (
    <div className="relative bg-[#2C2B30] border border-[#F2C4CE]/20 rounded-2xl p-5 transition-all hover:border-[#F2C4CE]/50 hover:shadow-[0_0_30px_rgba(242,196,206,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-white bg-black p-2 rounded-lg">{icon}</div>
          <div>
            <span className="text-xs font-bold tracking-widest text-[#F2C4CE] uppercase block mb-1">
              {title}
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              {formatDuration(duration)} Logged
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          {/* FOCUS BUTTON (Replaces Timer) */}
          <button
            onClick={onToggleTimer}
            className="flex items-center gap-1 bg-black border border-[#F58F7C] text-[#F58F7C] px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-[#F58F7C] hover:text-[#2C2B30] transition-colors"
          >
            <Maximize2 className="w-3 h-3" /> FOCUS
          </button>

          <button
            onClick={() => onChange({ isDone: !isDone, note })}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
              isDone
                ? "bg-[#F2C4CE] border-[#F2C4CE] text-[#2C2B30]"
                : "bg-black border-[#F2C4CE]/30 text-gray-500 hover:text-white hover:border-[#F2C4CE]"
            }`}
          >
            {isDone ? (
              <Check className="w-4 h-4" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-gray-600" />
            )}
          </button>
        </div>
      </div>
      <input
        type="text"
        value={note || ""}
        onChange={(e) => onChange({ isDone, note: e.target.value })}
        placeholder="Log details..."
        className={`w-full bg-black/50 rounded-lg p-2 text-xs font-mono placeholder:text-gray-600 focus:outline-none transition-all text-white border border-transparent focus:border-[#F2C4CE]/30`}
      />
    </div>
  );
}

function MonthTracker({
  challenges = [],
  onToggleDate,
  onAddHabit,
  onDeleteHabit,
}) {
  const [newHabitName, setNewHabitName] = useState("");
  const [viewDate, setViewDate] = useState(new Date());

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDateString = (dayNum) => {
    const d = String(dayNum).padStart(2, "0");
    const m = String(currentMonth + 1).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  const getDayName = (dayNum) => {
    const date = new Date(currentYear, currentMonth, dayNum);
    return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  };

  const handlePrevMonth = () =>
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () =>
    setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const handleAdd = () => {
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName);
    setNewHabitName("");
  };

  const graphData = monthDays.map((day) => {
    const dateStr = getDateString(day);
    return challenges.filter((c) => c.history?.includes(dateStr)).length;
  });

  const maxVal = Math.max(...graphData, 1);

  const getPath = () => {
    if (graphData.length === 0) return "";
    const width = 100;
    const height = 100;
    const stepX = width / (graphData.length - 1);
    let path = `M 0 ${height - (graphData[0] / maxVal) * height} `;
    graphData.forEach((val, i) => {
      if (i === 0) return;
      const x = i * stepX;
      const y = height - (val / maxVal) * height;
      path += `L ${x} ${y} `;
    });
    return path;
  };

  const monthlyReps = challenges.reduce((acc, c) => {
    const count = (c.history || []).filter((hDate) => {
      return hDate.startsWith(
        `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`
      );
    }).length;
    return acc + count;
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI: PASTEL PINK CARD (High Contrast) */}
        <div className="bg-[#F2C4CE] border border-[#F2C4CE] rounded-2xl p-6 relative overflow-hidden group shadow-[0_0_20px_rgba(242,196,206,0.2)]">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <Trophy className="w-12 h-12 text-[#2C2B30]" />
          </div>
          <p className="text-xs font-bold text-[#2C2B30]/80 uppercase tracking-widest">
            {viewDate.toLocaleString("default", { month: "short" })} Reps
          </p>
          <p className="text-5xl font-mono font-bold text-[#2C2B30] mt-2">
            {monthlyReps}
          </p>
        </div>

        {/* GRAPH: CHARCOAL CONTAINER */}
        <div className="bg-[#2C2B30] border border-[#F2C4CE]/20 rounded-2xl p-6 relative col-span-2 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4 bg-black rounded-full px-2 py-1 border border-[#F2C4CE]/30">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-full hover:bg-[#F58F7C] text-[#F2C4CE] hover:text-black transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-xs font-bold text-[#F2C4CE] uppercase tracking-widest min-w-[100px] text-center">
                {viewDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-full hover:bg-[#F58F7C] text-[#F2C4CE] hover:text-black transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <TrendingUp className="w-4 h-4 text-[#F58F7C]" />
          </div>
          <div className="h-16 w-full relative">
            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient id="pastelGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#F2C4CE" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#F58F7C" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${getPath()} L 100 100 L 0 100 Z`}
                fill="url(#pastelGlow)"
              />
              <path
                d={getPath()}
                fill="none"
                stroke="#F2C4CE"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-[#2C2B30] border border-[#F2C4CE]/20 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="overflow-x-auto pb-4">
          <table className="w-full border-collapse min-w-max table-fixed">
            <thead>
              <tr className="bg-[#2C2B30] border-b border-[#F2C4CE]/20">
                <th className="sticky left-0 z-20 bg-[#2C2B30] w-48 p-4 text-left border-r border-[#F2C4CE]/20 text-[10px] font-bold text-[#F58F7C] uppercase tracking-widest shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                  Protocols
                </th>
                {monthDays.map((d) => {
                  const dateStr = getDateString(d);
                  const isToday =
                    dateStr === new Date().toISOString().split("T")[0];
                  return (
                    <th
                      key={d}
                      className={`w-10 p-2 border-r border-[#F2C4CE]/10 text-center ${
                        isToday ? "bg-[#F2C4CE]/10" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`text-[9px] font-bold uppercase ${
                            isToday ? "text-[#F58F7C]" : "text-gray-500"
                          }`}
                        >
                          {getDayName(d)}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {challenges.map((habit) => (
                <tr
                  key={habit.id}
                  className="border-b border-[#F2C4CE]/10 hover:bg-[#F2C4CE]/5 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-[#2C2B30] border-r border-[#F2C4CE]/20 p-3 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-[#F2C4CE] truncate w-32 pl-2">
                        {habit.title}
                      </span>
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="text-gray-600 hover:text-[#F58F7C] transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  {monthDays.map((d) => {
                    const dateStr = getDateString(d);
                    const history = Array.isArray(habit.history)
                      ? habit.history
                      : [];
                    const isDone = history.includes(dateStr);
                    const isToday =
                      dateStr === new Date().toISOString().split("T")[0];
                    return (
                      <td
                        key={d}
                        className={`p-0 border-r border-[#F2C4CE]/10 text-center ${
                          isToday ? "bg-[#F2C4CE]/5" : ""
                        }`}
                      >
                        <button
                          onClick={() => onToggleDate(habit.id, dateStr)}
                          className="w-full h-12 flex items-center justify-center hover:bg-white/5 focus:outline-none transition-colors"
                        >
                          {isDone ? (
                            <div className="animate-in zoom-in duration-200">
                              <Check
                                className="w-5 h-5 text-[#F2C4CE] drop-shadow-[0_0_5px_rgba(242,196,206,0.8)]"
                                strokeWidth={4}
                              />
                            </div>
                          ) : (
                            <span
                              className={`text-[10px] font-mono ${
                                isToday
                                  ? "text-[#F58F7C] font-bold"
                                  : "text-gray-500"
                              }`}
                            >
                              {d}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-[#2C2B30]">
                <td className="sticky left-0 z-10 bg-[#2C2B30] border-r border-[#F2C4CE]/20 p-2 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                      placeholder="NEW..."
                      className="bg-transparent text-xs text-[#F2C4CE] placeholder:text-gray-500 border-none outline-none w-full uppercase font-bold pl-2"
                    />
                    <button
                      onClick={handleAdd}
                      className="p-1.5 bg-[#F2C4CE]/10 rounded hover:bg-[#F2C4CE] hover:text-[#2C2B30] text-[#F2C4CE] transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                {monthDays.map((d) => (
                  <td
                    key={d}
                    className="bg-[#2C2B30] border-r border-[#F2C4CE]/10"
                  ></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
