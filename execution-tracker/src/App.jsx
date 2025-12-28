import React, { useState, useEffect, useRef } from "react";
import { storageService } from "./services/storage";
import ChallengeItem from "./features/challenges/ChallengeItem";
import {
  Calendar,
  Save,
  Loader2,
  Layout,
  Zap,
  AlertTriangle,
  Clock,
  Target,
  Check,
  Play,
  Pause,
  Square,
  History,
} from "lucide-react";

// --- CONSTANTS ---
const PHASES = ["Imagine Cup Submission", "Exams Phase", "Internship Hunt"];

const getLocalToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to format seconds into MM:SS or HH:MM:SS
const formatDuration = (seconds) => {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Helper for the live clock (00:00:00)
const formatLiveTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

function App() {
  const [date, setDate] = useState(getLocalToday());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // LOG DATA
  const [log, setLog] = useState({
    currentPhase: PHASES[0],
    primaryTask: "",
    primaryDone: false,
    primaryDuration: 0,
    mathsDone: false,
    mathsNote: "",
    mathsDuration: 0,
    dsaDone: false,
    dsaNote: "",
    dsaDuration: 0,
    startTime: "",
    deepWork: false,
    distractionBreach: false,
    blocker: "",
    improvement: "",
  });

  const [challenges, setChallenges] = useState([]);

  // TIMER STATE
  const [activeTimer, setActiveTimer] = useState(null);
  const timerRef = useRef(null);

  // --- DEFINITIONS MOVED UP (Fixes Error) ---

  // 1. Force Save (Used by toggleTimer)
  const forceSave = async (data) => {
    setSaving(true);
    await storageService.saveLog(date, data);
    setSaving(false);
  };

  // 2. Timer Toggle Logic
  const toggleTimer = (taskKey) => {
    if (activeTimer === taskKey) {
      // STOPPING
      setActiveTimer(null);
      forceSave(log); // Save progress immediately
    } else {
      // STARTING (Switching or New)
      if (activeTimer) {
        // Stop previous first
        forceSave(log);
      }
      setActiveTimer(taskKey);
    }
  };

  // --- EFFECTS ---

  // 3. Load Data
  useEffect(() => {
    async function loadDailyData() {
      setLoading(true);

      // Stop timer if switching days (Now this works because toggleTimer is defined above)
      if (activeTimer) {
        setActiveTimer(null); // Just stop UI timer, don't trigger save to avoid race conditions on date switch
      }

      const data = await storageService.getLog(date);
      setLog(data);

      let feats = await storageService.getChallenges();
      if (feats.length === 0) {
        await storageService.saveChallenge({
          id: "c1",
          title: "Gym / Fitness",
          currentStreak: 0,
        });
        feats = await storageService.getChallenges();
      }
      setChallenges(feats);
      setLoading(false);
    }
    loadDailyData();
  }, [date]);

  // 4. Timer Interval Logic
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setLog((prevLog) => {
          const field = `${activeTimer}Duration`;
          const newLog = { ...prevLog, [field]: (prevLog[field] || 0) + 1 };
          return newLog;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  // 5. General Save Logic
  const saveData = async (newLog) => {
    setLog(newLog);
    if (!saving) {
      setSaving(true);
      await storageService.saveLog(date, newLog);
      setSaving(false);
    }
  };

  const toggleChallenge = async (id) => {
    const updatedList = await storageService.toggleChallengeStreak(id, date);
    setChallenges(updatedList);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-indigo-400 gap-3 font-medium">
        <Loader2 className="animate-spin w-6 h-6" /> Initializing Command
        Center...
      </div>
    );

  return (
    <div className="min-h-screen pb-32 font-sans text-slate-200 bg-slate-900 selection:bg-indigo-500/30">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layout className="text-white w-4 h-4" />
            </div>
            <h1 className="font-bold text-slate-100 hidden sm:block tracking-tight">
              Protocol_v2
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                saving ? "text-amber-500" : "text-emerald-500"
              }`}
            >
              {saving ? "SYNCING..." : "ONLINE"}
            </span>
            <div className="relative group">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 px-3 py-2 pl-9 outline-none focus:border-indigo-500 transition-colors"
              />
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* 1. PRIMARY FOCUS (Variable Phase) */}
        <section
          className={`
          relative rounded-2xl p-1 transition-all duration-500
          ${
            activeTimer === "primary"
              ? "bg-gradient-to-r from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/20"
              : "bg-slate-800 border border-slate-700"
          }
        `}
        >
          <div className="bg-slate-900/90 rounded-xl p-6 h-full backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">
                  Current Objective
                </label>
                <select
                  value={log.currentPhase}
                  onChange={(e) =>
                    saveData({ ...log, currentPhase: e.target.value })
                  }
                  className="bg-transparent text-sm font-bold text-slate-200 border-none outline-none cursor-pointer hover:text-indigo-300 transition-colors p-0"
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                <History className="w-3 h-3 text-slate-500" />
                <span className="text-xs font-mono text-slate-300">
                  {formatDuration(log.primaryDuration)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() =>
                    saveData({ ...log, primaryDone: !log.primaryDone })
                  }
                  className={`
                    w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300
                    ${
                      log.primaryDone
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "border-slate-600 text-transparent hover:border-indigo-500 hover:text-indigo-500/50"
                    }
                  `}
                >
                  <Check className="w-5 h-5" strokeWidth={4} />
                </button>

                {/* Timer Toggle */}
                <button
                  onClick={() => toggleTimer("primary")}
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                    ${
                      activeTimer === "primary"
                        ? "bg-indigo-600 text-white animate-pulse-slow"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-indigo-400"
                    }
                  `}
                >
                  {activeTimer === "primary" ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>
              </div>

              <textarea
                value={log.primaryTask}
                onChange={(e) =>
                  saveData({ ...log, primaryTask: e.target.value })
                }
                placeholder="Define the critical mission for today..."
                className={`
                  w-full text-2xl md:text-3xl font-bold bg-transparent border-none focus:ring-0 resize-none leading-tight transition-all placeholder:text-slate-700
                  ${
                    log.primaryDone
                      ? "text-emerald-500 line-through opacity-50"
                      : "text-slate-100"
                  }
                `}
                rows={2}
              />
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 2. CORE ACADEMIC BLOCK (Fixed) */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Target className="w-3 h-3" /> Core Protocol
            </h2>

            {/* Maths Block */}
            <FixedBlock
              title="Maths"
              icon="Σ"
              isDone={log.mathsDone}
              note={log.mathsNote}
              duration={log.mathsDuration}
              isActive={activeTimer === "maths"}
              onToggleTimer={() => toggleTimer("maths")}
              onChange={({ isDone, note }) =>
                saveData({ ...log, mathsDone: isDone, mathsNote: note })
              }
            />

            {/* DSA Block */}
            <FixedBlock
              title="DSA / OOPs"
              icon="{}"
              isDone={log.dsaDone}
              note={log.dsaNote}
              duration={log.dsaDuration}
              isActive={activeTimer === "dsa"}
              onToggleTimer={() => toggleTimer("dsa")}
              onChange={({ isDone, note }) =>
                saveData({ ...log, dsaDone: isDone, dsaNote: note })
              }
            />
          </div>

          {/* 3. EXECUTION HEALTH (Discipline) */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Zap className="w-3 h-3" /> System Health
            </h2>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-5">
              {/* Start Time */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-200 transition-colors">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Ignition Time</span>
                </div>
                <input
                  type="time"
                  value={log.startTime}
                  onChange={(e) =>
                    saveData({ ...log, startTime: e.target.value })
                  }
                  className="bg-slate-900 rounded-md px-3 py-1.5 text-sm font-mono text-slate-200 border border-slate-700 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* Deep Work Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">
                  Deep Work State
                </span>
                <button
                  onClick={() => saveData({ ...log, deepWork: !log.deepWork })}
                  className={`
                    px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border
                    ${
                      log.deepWork
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                        : "bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800"
                    }
                  `}
                >
                  {log.deepWork ? "ACHIEVED" : "PENDING"}
                </button>
              </div>

              {/* Distraction Breach Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      log.distractionBreach ? "text-rose-500" : "text-slate-600"
                    }`}
                  />
                  <span className="text-sm font-medium">Focus Breach</span>
                </div>
                <button
                  onClick={() =>
                    saveData({
                      ...log,
                      distractionBreach: !log.distractionBreach,
                    })
                  }
                  className={`
                    px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border
                    ${
                      log.distractionBreach
                        ? "bg-rose-500/10 border-rose-500/50 text-rose-400"
                        : "bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800"
                    }
                  `}
                >
                  {log.distractionBreach ? "DETECTED" : "NONE"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. REFLECTION */}
        <section className="grid md:grid-cols-2 gap-6 pt-4">
          <div className="bg-rose-900/10 rounded-xl p-5 border border-rose-900/20 hover:border-rose-500/30 transition-colors group">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-3 block">
              Critical Blockers
            </label>
            <textarea
              value={log.blocker}
              onChange={(e) => saveData({ ...log, blocker: e.target.value })}
              placeholder="Identify the friction points..."
              className="w-full bg-transparent text-sm text-rose-200 placeholder:text-rose-500/30 focus:outline-none resize-none"
              rows={3}
            />
          </div>
          <div className="bg-emerald-900/10 rounded-xl p-5 border border-emerald-900/20 hover:border-emerald-500/30 transition-colors">
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3 block">
              Iteration For Tomorrow
            </label>
            <textarea
              value={log.improvement}
              onChange={(e) =>
                saveData({ ...log, improvement: e.target.value })
              }
              placeholder="Optimization strategy..."
              className="w-full bg-transparent text-sm text-emerald-200 placeholder:text-emerald-500/30 focus:outline-none resize-none"
              rows={3}
            />
          </div>
        </section>

        {/* 5. External Habits */}
        <div className="pt-8 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-600 uppercase mb-4 tracking-widest">
            Auxiliary Protocols
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((c) => (
              <ChallengeItem
                key={c.id}
                challenge={c}
                isTodayDone={c.lastCompletedDate === date}
                onToggle={toggleChallenge}
              />
            ))}
          </div>
        </div>
      </main>

      {/* --- ACTIVE SESSION HUD (Bottom Bar) --- */}
      {activeTimer && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl shadow-2xl shadow-indigo-500/30 p-4 flex items-center justify-between animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur opacity-40 animate-pulse"></div>
                <div className="relative w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Clock className="text-white w-5 h-5 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                  Deep Work Active
                </p>
                <p className="text-white font-bold text-lg leading-none">
                  {activeTimer === "primary"
                    ? "Primary Focus"
                    : activeTimer === "maths"
                    ? "Maths"
                    : "DSA"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-2xl font-mono font-bold text-white tracking-widest">
                {activeTimer === "primary" &&
                  formatLiveTime(log.primaryDuration)}
                {activeTimer === "maths" && formatLiveTime(log.mathsDuration)}
                {activeTimer === "dsa" && formatLiveTime(log.dsaDuration)}
              </div>
              <button
                onClick={() => toggleTimer(activeTimer)}
                className="w-10 h-10 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-500 rounded-full flex items-center justify-center border border-slate-700 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// INLINE COMPONENT FOR FIXED BLOCKS (Refactored for Dark Mode & Timer)
function FixedBlock({
  title,
  icon,
  isDone,
  note,
  duration,
  isActive,
  onToggleTimer,
  onChange,
}) {
  return (
    <div
      className={`
      group relative p-4 rounded-xl border transition-all duration-300
      ${
        isActive
          ? "bg-indigo-900/10 border-indigo-500/50"
          : isDone
          ? "bg-slate-800/50 border-slate-700/50"
          : "bg-slate-800 border-slate-700 hover:border-slate-600"
      }
    `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
            ${
              isDone
                ? "bg-indigo-500 text-white"
                : "bg-slate-700 text-slate-400"
            }
          `}
          >
            {icon}
          </div>
          <div>
            <span className="text-sm font-bold tracking-wide text-slate-300 uppercase block">
              {title}
            </span>
            <span
              className={`text-[10px] font-mono ${
                isActive ? "text-indigo-400" : "text-slate-500"
              }`}
            >
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Timer Button */}
          <button
            onClick={onToggleTimer}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center transition-all
              ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:text-indigo-400"
              }
            `}
          >
            {isActive ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          {/* Check Button */}
          <button
            onClick={() => onChange({ isDone: !isDone, note })}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center transition-all
              ${
                isDone
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-700 text-slate-500 hover:text-emerald-400"
              }
            `}
          >
            {isDone ? (
              <Check className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-current opacity-50" />
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={note}
          onChange={(e) => onChange({ isDone, note: e.target.value })}
          placeholder={`Log execution details for ${title}...`}
          className={`
            w-full bg-transparent text-sm font-medium placeholder:text-slate-600 focus:outline-none transition-all
            ${isDone ? "text-slate-400" : "text-slate-300"}
          `}
        />
      </div>
    </div>
  );
}

export default App;
