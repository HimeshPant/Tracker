import React from "react";
import { Check, Circle, BookOpen } from "lucide-react";

export default function FixedBlock({ title, isDone, note, onChange }) {
  return (
    <div
      className={`
      group relative p-4 rounded-xl border transition-all duration-300
      ${
        isDone
          ? "bg-blue-50/50 border-blue-100"
          : "bg-white border-gray-200 hover:border-blue-300"
      }
    `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen
            className={`w-4 h-4 ${isDone ? "text-blue-600" : "text-gray-400"}`}
          />
          <span className="text-sm font-bold tracking-widest text-gray-700 uppercase">
            {title}
          </span>
        </div>

        <button
          onClick={() => onChange({ isDone: !isDone, note })}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
            ${
              isDone
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50"
                : "bg-gray-50 text-gray-300 hover:text-blue-500 hover:bg-blue-50"
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

      <div className="relative">
        <input
          type="text"
          value={note}
          onChange={(e) => onChange({ isDone, note: e.target.value })}
          placeholder={`Status update for ${title}...`}
          className={`
            w-full bg-transparent text-sm font-medium placeholder:text-gray-300 focus:outline-none transition-all
            ${isDone ? "text-blue-800 opacity-80" : "text-gray-600"}
          `}
        />
      </div>
    </div>
  );
}
