import React, { useState } from "react";
import { Trophy, TrendingUp, Plus, Trash2, Check } from "lucide-react";

export default function MonthTracker({
  challenges = [],
  onToggleDate,
  onAddHabit,
  onDeleteHabit,
}) {
  const [newHabitName, setNewHabitName] = useState("");

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper: Get YYYY-MM-DD
  const getDateString = (dayNum) => {
    const d = String(dayNum).padStart(2, "0");
    const m = String(currentMonth + 1).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  // Helper: Get Weekday Name (MON, TUE...)
  const getDayName = (dayNum) => {
    const date = new Date(currentYear, currentMonth, dayNum);
    return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  };

  const handleAdd = () => {
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName);
    setNewHabitName("");
  };

  // GRAPH DATA
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* 1. STATS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Trophy className="w-12 h-12 text-green-500" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Total Reps
          </p>
          <p
            className="text-4xl font-mono font-bold text-white mt-2 text-green-500"
            style={{ textShadow: "0 0 15px rgba(34, 197, 94, 0.5)" }}
          >
            {challenges.reduce((acc, c) => acc + (c.history?.length || 0), 0)}
          </p>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6 relative col-span-2">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Consistency Wave
            </p>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="h-16 w-full relative">
            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient id="greenGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${getPath()} L 100 100 L 0 100 Z`}
                fill="url(#greenGlow)"
              />
              <path
                d={getPath()}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. THE MATRIX (TABLE LAYOUT) */}
      <div className="bg-black border border-gray-900 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="overflow-x-auto pb-2">
          <table className="w-full border-collapse border-spacing-0 min-w-max">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-800">
                {/* Sticky Header Column */}
                <th className="sticky left-0 z-20 bg-gray-950 w-48 p-4 text-left border-r border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-widest shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                  Protocol List
                </th>
                {/* Date Headers */}
                {monthDays.map((d) => {
                  const isToday =
                    getDateString(d) === new Date().toISOString().split("T")[0];
                  return (
                    <th
                      key={d}
                      className={`min-w-[40px] p-2 border-r border-gray-900 text-center ${
                        isToday ? "bg-green-900/20" : ""
                      }`}
                    >
                      <span
                        className={`text-[9px] font-bold ${
                          isToday ? "text-green-400" : "text-gray-500"
                        }`}
                      >
                        {getDayName(d)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {challenges.map((habit) => (
                <tr
                  key={habit.id}
                  className="border-b border-gray-900 hover:bg-gray-900/10"
                >
                  {/* Sticky Habit Row */}
                  <td className="sticky left-0 z-10 bg-black border-r border-gray-800 p-3 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between w-48">
                      <span className="text-xs font-bold text-gray-300 truncate pr-2">
                        {habit.title}
                      </span>
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="text-gray-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Data Cells (1, 2, 3...) */}
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
                        className={`p-0 border-r border-gray-900/50 text-center ${
                          isToday ? "bg-gray-900/30" : ""
                        }`}
                      >
                        <button
                          onClick={() => onToggleDate(habit.id, dateStr)}
                          className="w-full h-12 flex items-center justify-center hover:bg-gray-800 focus:outline-none transition-colors"
                        >
                          {isDone ? (
                            <div className="animate-in zoom-in duration-200">
                              <Check
                                className="w-5 h-5 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                strokeWidth={4}
                              />
                            </div>
                          ) : (
                            <span
                              className={`text-[10px] font-mono ${
                                isToday
                                  ? "text-green-600 font-bold"
                                  : "text-gray-700"
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

              {/* Add New Row */}
              <tr className="bg-gray-950">
                <td className="sticky left-0 z-10 bg-gray-950 border-r border-gray-800 p-2 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-2 w-48">
                    <input
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                      placeholder="NEW PROTOCOL..."
                      className="bg-transparent text-xs text-green-500 placeholder:text-gray-700 border-none outline-none w-full uppercase font-bold"
                    />
                    <button
                      onClick={handleAdd}
                      className="p-1 bg-green-900/20 rounded hover:bg-green-500 hover:text-black transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td colSpan={31} className="bg-gray-950"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
