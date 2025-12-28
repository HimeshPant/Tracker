import React, { useState, useEffect } from "react";
import { storageService } from "./services/storage";
import FocusArea from "./features/tracker/FocusArea";
import ChallengeItem from "./features/challenges/ChallengeItem";
import { Calendar, Save, Loader2, Layout, CheckCircle2 } from "lucide-react";

const DEFAULT_AREAS = [
  {
    id: "work",
    name: "Work / Career",
    planned: "",
    completed: false,
    notes: "",
  },
  {
    id: "health",
    name: "Health & Fitness",
    planned: "",
    completed: false,
    notes: "",
  },
  { id: "learn", name: "Learning", planned: "", completed: false, notes: "" },
];

function App() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [log, setLog] = useState({
    primary: "",
    secondary: "",
    areas: DEFAULT_AREAS,
  });
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    async function loadDailyData() {
      setLoading(true);
      const existingLog = await storageService.getLog(date);
      setLog(
        existingLog || { primary: "", secondary: "", areas: DEFAULT_AREAS }
      );

      let feats = await storageService.getChallenges();
      if (feats.length === 0) {
        await storageService.saveChallenge({
          id: "c1",
          title: "Deep Work (4h)",
          currentStreak: 0,
        });
        await storageService.saveChallenge({
          id: "c2",
          title: "No Social Media",
          currentStreak: 0,
        });
        feats = await storageService.getChallenges();
      }
      setChallenges(feats);
      setLoading(false);
    }
    loadDailyData();
  }, [date]);

  const saveData = async (newLog) => {
    setLog(newLog);
    setSaving(true);
    await storageService.saveLog(date, newLog);
    setTimeout(() => setSaving(false), 500);
  };

  const handleAreaChange = (updatedArea) => {
    const newAreas = log.areas.map((a) =>
      a.id === updatedArea.id ? updatedArea : a
    );
    saveData({ ...log, areas: newAreas });
  };

  const toggleChallenge = async (id) => {
    const updatedList = await storageService.toggleChallengeStreak(id, date);
    setChallenges(updatedList);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-indigo-500 gap-3 font-medium">
        <Loader2 className="animate-spin w-6 h-6" /> Initializing Tracker...
      </div>
    );

  const completionRate =
    Math.round(
      (log.areas.filter((a) => a.completed).length / log.areas.length) * 100
    ) || 0;

  return (
    <div className="min-h-screen pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* 1. Glassmorphic Sticky Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg shadow-gray-200">
              <Layout className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">
                Execution Tracker
              </h1>
              <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                Beta v1.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Status
              </span>
              <span
                className={`text-xs font-bold ${
                  saving ? "text-amber-500" : "text-emerald-500"
                }`}
              >
                {saving ? "Syncing..." : "All Saved"}
              </span>
            </div>
            <div className="relative group">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none cursor-pointer hover:bg-gray-200"
              />
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* 2. Hero Section: The Primary Goal */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-10 blur-xl transform translate-y-2"></div>
          <div className="relative bg-white rounded-2xl p-1 shadow-xl shadow-indigo-100 border border-indigo-50">
            <div className="p-8 pb-4">
              <label className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">
                Daily Highlight
              </label>
              <textarea
                value={log.primary}
                onChange={(e) => saveData({ ...log, primary: e.target.value })}
                placeholder="What is the ONE thing that makes today a success?"
                className="w-full text-3xl font-bold text-gray-800 placeholder:text-gray-300 border-none focus:ring-0 resize-none bg-transparent leading-tight"
                rows={2}
              />
            </div>
            <div className="bg-gray-50/50 px-8 py-4 rounded-b-xl border-t border-gray-100 flex items-center gap-4">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Secondary:
              </span>
              <input
                type="text"
                value={log.secondary}
                onChange={(e) =>
                  saveData({ ...log, secondary: e.target.value })
                }
                placeholder="Any side quests?"
                className="flex-1 bg-transparent text-sm font-medium text-gray-600 focus:outline-none placeholder:text-gray-300"
              />
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* 3. Left Column: Execution (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Execution Log</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-gray-600">
                  {completionRate}% Complete
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {log.areas.map((area) => (
                <FocusArea
                  key={area.id}
                  area={area}
                  onChange={handleAreaChange}
                />
              ))}
            </div>
          </div>

          {/* 4. Right Column: Challenges (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
              <h2 className="text-lg font-bold mb-1">Non-Negotiables</h2>
              <p className="text-slate-400 text-xs mb-6">
                Build the chain. Never break it.
              </p>

              <div className="space-y-3">
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

            {/* Motivational Quote */}
            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
              <p className="text-indigo-900 font-serif italic text-lg leading-relaxed">
                "Discipline is choosing between what you want now and what you
                want most."
              </p>
              <p className="text-indigo-400 text-xs font-bold mt-3 uppercase tracking-widest">
                — Abraham Lincoln
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
