import React from "react";
import { Check, Circle } from "lucide-react";

export default function FocusArea({ area, onChange }) {
  const isDone = area.completed;

  return (
    <div
      className={`
      group relative mb-4 p-5 rounded-xl border transition-all duration-300 ease-in-out
      ${
        isDone
          ? "bg-emerald-50/50 border-emerald-100 shadow-none"
          : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
      }
    `}
    >
      {/* Top Row: Label & Checkbox */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={`
          text-[10px] font-black tracking-[0.2em] uppercase px-2 py-1 rounded-md transition-colors
          ${
            isDone
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
          }
        `}
        >
          {area.name}
        </div>

        <button
          onClick={() => onChange({ ...area, completed: !isDone })}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4
            ${
              isDone
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 rotate-0 ring-emerald-100"
                : "bg-gray-50 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 ring-transparent"
            }
          `}
        >
          {isDone ? (
            <Check className="w-5 h-5" strokeWidth={3} />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={area.planned}
          onChange={(e) => onChange({ ...area, planned: e.target.value })}
          placeholder={`What is your goal for ${area.name}?`}
          disabled={isDone}
          className={`
            w-full bg-transparent text-lg font-medium placeholder:text-gray-300 focus:outline-none transition-all
            ${
              isDone
                ? "text-emerald-800 line-through opacity-50"
                : "text-gray-800"
            }
          `}
        />
        {/* Animated Underline */}
        {!isDone && (
          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-focus-within:w-full opacity-50" />
        )}
      </div>

      {/* Notes Section (Expands nicely) */}
      <div
        className={`
        overflow-hidden transition-all duration-500 ease-out
        ${isDone ? "max-h-24 mt-4 opacity-100" : "max-h-0 opacity-0"}
      `}
      >
        <textarea
          value={area.notes}
          onChange={(e) => onChange({ ...area, notes: e.target.value })}
          placeholder="Execution notes: What went well? What didn't?"
          className="w-full text-sm text-gray-600 bg-emerald-100/50 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200"
          rows={2}
        />
      </div>
    </div>
  );
}
