import React, { useState, useEffect, useRef } from "react";
import { storageService } from "./services/storage";
import ChallengeItem from "./features/challenges/ChallengeItem";
import {
  Calendar,
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
  RotateCcw,
  Activity,
  Rocket,
  Plus,
  X,
  ListTodo,
} from "lucide-react";

// --- CONFIGURATION ---
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

// UPDATED: Now shows seconds for precision
const formatDuration = (seconds) => {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

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
    // Fixed Blocks
    imagineCupDone: false,
    imagineCupNote: "",
    imagineCupDuration: 0,
    mathsDone: false,
    mathsNote: "",
    mathsDuration: 0,
    dsaDone: false,
    dsaNote: "",
    dsaDuration: 0,
    // Custom Tasks
    customTasks: [],
    // Health
    startTime: "",
    deepWork: false,
    distractionBreach: false,
    blocker: "",
    improvement: "",
  });

  const [challenges, setChallenges] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [newTaskInput, setNewTaskInput] = useState(""); // State for new task input
  const timerRef = useRef(null);

  // --- ACTIONS ---

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

  const toggleChallenge = async (id) => {
    const updatedList = await storageService.toggleChallengeStreak(id, date);
    setChallenges(updatedList);
  };

  const goToToday = () => {
    if (activeTimer) setActiveTimer(null);
    setDate(getLocalToday());
  };

  // --- CUSTOM TASK ACTIONS ---
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

  // --- EFFECTS ---

  useEffect(() => {
    async function loadDailyData() {
      setLoading(true);
      if (activeTimer) setActiveTimer(null);

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

  // --- ANALYTICS HELPERS ---
  const totalDuration =
    (log.primaryDuration || 0) +
    (log.imagineCupDuration || 0) +
    (log.mathsDuration || 0) +
    (log.dsaDuration || 0);
  const tasksTotal = 4;
  const tasksDone = [
    log.primaryDone,
    log.imagineCupDone,
    log.mathsDone,
    log.dsaDone,
  ].filter(Boolean).length;
  const progressPercent = Math.round((tasksDone / tasksTotal) * 100);
  const isToday = date === getLocalToday();

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-black text-cyan-500 gap-3 font-sans font-bold">
        <Loader2 className="animate-spin w-5 h-5" /> LOADING TRACKER...
      </div>
    );

  return (
    <div className="min-h-screen pb-40 font-sans text-gray-300 bg-black selection:bg-cyan-500/30">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-900/30 border border-cyan-500/50 rounded flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Layout className="text-cyan-400 w-4 h-4" />
            </div>
            <h1 className="font-bold text-gray-100 hidden sm:block tracking-wide">
              Execution Tracker
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {!isToday && (
              <button
                onClick={goToToday}
                className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-950/30 px-3 py-1.5 rounded border border-cyan-900"
              >
                <RotateCcw className="w-3 h-3" />
                Go to Today
              </button>
            )}

            <div className="relative group">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded text-xs font-bold text-gray-400 px-3 py-2 pl-9 outline-none focus:border-cyan-600 transition-colors cursor-pointer"
              />
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-600 pointer-events-none" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* --- 0. LIVE ANALYTICS DASHBOARD --- */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-lg flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-cyan-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Focus Time
              </p>
              <p className="text-xl font-mono font-bold text-gray-200 text-glow-blue">
                {formatDuration(totalDuration)}
              </p>
            </div>
          </div>

          <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-lg flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-fuchsia-500">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Progress
              </p>
              <p className="text-xl font-mono font-bold text-gray-200 text-glow-purple">
                {progressPercent}%
              </p>
            </div>
          </div>

          <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-lg flex items-center gap-4 col-span-2 md:col-span-2">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
                Start Time
              </p>
              <input
                type="time"
                value={log.startTime}
                onChange={(e) =>
                  saveData({ ...log, startTime: e.target.value })
                }
                className="bg-transparent text-lg font-mono text-gray-300 focus:outline-none w-full"
              />
            </div>
            <div className="h-8 w-[1px] bg-gray-800"></div>
            <div className="flex-1 pl-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
                Deep Work
              </p>
              <button
                onClick={() => saveData({ ...log, deepWork: !log.deepWork })}
                className={`text-xs font-bold px-2 py-1 rounded transition-all ${
                  log.deepWork
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-gray-600"
                }`}
              >
                {log.deepWork ? "YES" : "NO"}
              </button>
            </div>
          </div>
        </section>

        {/* 1. PRIMARY FOCUS */}
        <section
          className={`
          relative rounded-xl p-[1px] transition-all duration-500
          ${
            activeTimer === "primary"
              ? "neon-border-blue bg-gray-900"
              : "border border-gray-800 bg-gray-950"
          }
        `}
        >
          <div className="bg-black rounded-xl p-6 h-full relative overflow-hidden">
            {activeTimer === "primary" && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            )}

            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 relative z-10 gap-4">
              <div className="flex flex-col w-full md:w-auto">
                <label className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-2">
                  Current Focus
                </label>
                <select
                  value={log.currentPhase}
                  onChange={(e) =>
                    saveData({ ...log, currentPhase: e.target.value })
                  }
                  className="bg-gray-900 border border-cyan-900 text-cyan-400 text-sm font-bold rounded px-3 py-2 cursor-pointer outline-none focus:border-cyan-500 block w-full md:w-auto hover:bg-gray-800 transition-colors"
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="font-mono text-xs text-gray-500 border border-gray-800 px-2 py-1 rounded self-start">
                {formatDuration(log.primaryDuration)}
              </div>
            </div>

            <div className="flex items-start gap-4 relative z-10">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() =>
                    saveData({ ...log, primaryDone: !log.primaryDone })
                  }
                  className={`
                    w-10 h-10 rounded border flex items-center justify-center transition-all duration-300
                    ${
                      log.primaryDone
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        : "border-gray-800 text-gray-700 hover:border-gray-600"
                    }
                  `}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleTimer("primary")}
                  className={`
                    w-10 h-10 rounded flex items-center justify-center transition-all duration-300 border
                    ${
                      activeTimer === "primary"
                        ? "bg-cyan-500 text-black border-cyan-500"
                        : "bg-gray-900 border-gray-800 text-gray-500 hover:text-cyan-400"
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
                placeholder="What is the main goal today?"
                className={`
                  w-full text-2xl font-bold bg-transparent border-none focus:ring-0 resize-none leading-tight transition-all placeholder:text-gray-800
                  ${
                    log.primaryDone
                      ? "text-cyan-700 line-through"
                      : "text-gray-200"
                  }
                `}
                rows={2}
              />
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 2. CORE PROTOCOL */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Target className="w-3 h-3" /> Core Tasks
            </h2>

            <FixedBlock
              title="Imagine Cup"
              icon={<Rocket className="w-4 h-4" />}
              isDone={log.imagineCupDone}
              note={log.imagineCupNote}
              duration={log.imagineCupDuration}
              isActive={activeTimer === "imagineCup"}
              colorClass="purple"
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
              isActive={activeTimer === "maths"}
              colorClass="blue"
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
              isActive={activeTimer === "dsa"}
              colorClass="blue"
              onToggleTimer={() => toggleTimer("dsa")}
              onChange={({ isDone, note }) =>
                saveData({ ...log, dsaDone: isDone, dsaNote: note })
              }
            />
          </div>

          {/* 3. SIDE QUESTS (NEW!) & HEALTH */}
          <div className="space-y-8">
            {/* NEW: Side Quests */}
            <div className="space-y-4">
              <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                <ListTodo className="w-3 h-3" /> Side Quests
              </h2>
              <div className="bg-gray-950 border border-gray-900 rounded-xl p-4">
                {/* Add Input */}
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTask()}
                    placeholder="Add side task..."
                    className="bg-black border border-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:border-cyan-600 outline-none placeholder:text-gray-700"
                  />
                  <button
                    onClick={addCustomTask}
                    className="bg-gray-900 border border-gray-800 p-2 rounded-lg hover:bg-cyan-900/30 hover:text-cyan-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {(!log.customTasks || log.customTasks.length === 0) && (
                    <p className="text-xs text-gray-800 text-center py-2 italic">
                      No side quests active.
                    </p>
                  )}
                  {log.customTasks?.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center justify-between p-2 rounded hover:bg-gray-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleCustomTask(task.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            task.isDone
                              ? "bg-cyan-500/20 border-cyan-500 text-cyan-500"
                              : "border-gray-700 hover:border-cyan-500"
                          }`}
                        >
                          {task.isDone && <Check className="w-3 h-3" />}
                        </button>
                        <span
                          className={`text-sm ${
                            task.isDone
                              ? "text-gray-600 line-through"
                              : "text-gray-300"
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteCustomTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Health & Reflection */}
            <div className="space-y-4">
              <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Zap className="w-3 h-3" /> Reflection
              </h2>
              <div className="bg-gray-950 border border-gray-900 rounded-xl p-5 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-red-900 uppercase tracking-widest mb-2 block">
                      Blockers
                    </label>
                    <input
                      type="text"
                      value={log.blocker}
                      onChange={(e) =>
                        saveData({ ...log, blocker: e.target.value })
                      }
                      placeholder="What stopped you?"
                      className="w-full bg-black border border-gray-900 rounded p-2 text-xs text-red-400 focus:border-red-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-cyan-900 uppercase tracking-widest mb-2 block">
                      Improvement
                    </label>
                    <input
                      type="text"
                      value={log.improvement}
                      onChange={(e) =>
                        saveData({ ...log, improvement: e.target.value })
                      }
                      placeholder="One thing to fix tomorrow..."
                      className="w-full bg-black border border-gray-900 rounded p-2 text-xs text-cyan-400 focus:border-cyan-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. External Habits */}
        <div className="pt-8 border-t border-gray-900">
          <h3 className="text-[10px] font-bold text-gray-700 uppercase mb-4 tracking-widest">
            Habits & Challenges
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

      {/* --- ACTIVE SESSION HUD --- */}
      {activeTimer && (
        <div className="fixed bottom-0 left-0 w-full z-50">
          <div
            className={`
             h-1 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 animate-pulse
          `}
          ></div>
          <div className="bg-black/90 backdrop-blur-md border-t border-cyan-900/50 p-4 flex items-center justify-center gap-8">
            <div className="text-right">
              <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">
                Active Session
              </p>
              <p className="text-white font-bold text-sm uppercase">
                {activeTimer === "primary"
                  ? "Primary Task"
                  : activeTimer === "imagineCup"
                  ? "Imagine Cup"
                  : activeTimer === "maths"
                  ? "Maths"
                  : "DSA"}
              </p>
            </div>
            <div className="text-4xl font-mono font-bold text-cyan-400 text-glow-blue">
              {activeTimer === "primary" && formatLiveTime(log.primaryDuration)}
              {activeTimer === "imagineCup" &&
                formatLiveTime(log.imagineCupDuration)}
              {activeTimer === "maths" && formatLiveTime(log.mathsDuration)}
              {activeTimer === "dsa" && formatLiveTime(log.dsaDuration)}
            </div>
            <button
              onClick={() => toggleTimer(activeTimer)}
              className="w-12 h-12 bg-gray-900 hover:bg-red-900/20 hover:text-red-500 rounded flex items-center justify-center border border-gray-800 transition-all"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// FIXED BLOCK COMPONENT
function FixedBlock({
  title,
  icon,
  isDone,
  note,
  duration,
  isActive,
  onToggleTimer,
  onChange,
  colorClass = "blue",
}) {
  const borderColor = isActive
    ? colorClass === "purple"
      ? "border-fuchsia-500"
      : "border-cyan-500"
    : "border-gray-800";

  const activeBg = isActive
    ? colorClass === "purple"
      ? "bg-fuchsia-950/20"
      : "bg-cyan-950/20"
    : "bg-black";

  const iconColor = isDone
    ? colorClass === "purple"
      ? "text-fuchsia-400"
      : "text-cyan-400"
    : "text-gray-600";

  return (
    <div
      className={`
      relative p-4 rounded-lg border transition-all duration-300
      ${borderColor} ${activeBg}
      ${isActive ? "shadow-[0_0_15px_rgba(0,0,0,0.5)]" : ""}
    `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`text-sm font-bold ${iconColor}`}>{icon}</div>
          <div>
            <span className="text-xs font-bold tracking-widest text-gray-300 uppercase block">
              {title}
            </span>
            <span
              className={`text-[10px] font-mono ${
                isActive ? "text-white" : "text-gray-600"
              }`}
            >
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onToggleTimer}
            className={`
              w-8 h-8 rounded flex items-center justify-center transition-all border
              ${
                isActive
                  ? colorClass === "purple"
                    ? "bg-fuchsia-600 border-fuchsia-500 text-black"
                    : "bg-cyan-600 border-cyan-500 text-black"
                  : "bg-gray-900 border-gray-800 text-gray-600 hover:text-gray-300"
              }
            `}
          >
            {isActive ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
          </button>

          <button
            onClick={() => onChange({ isDone: !isDone, note })}
            className={`
              w-8 h-8 rounded flex items-center justify-center transition-all border
              ${
                isDone
                  ? colorClass === "purple"
                    ? "bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-500"
                    : "bg-cyan-500/10 border-cyan-500 text-cyan-500"
                  : "bg-gray-900 border-gray-800 text-gray-600 hover:text-gray-300"
              }
            `}
          >
            {isDone ? (
              <Check className="w-4 h-4" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-gray-700" />
            )}
          </button>
        </div>
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => onChange({ isDone, note: e.target.value })}
        placeholder="Log details..."
        className={`
          w-full bg-transparent text-xs font-mono placeholder:text-gray-800 focus:outline-none transition-all
          ${isDone ? "text-gray-500" : "text-gray-400"}
        `}
      />
    </div>
  );
}

export default App;
