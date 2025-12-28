import React from "react";
import { Flame, Check, Trophy } from "lucide-react";

export default function ChallengeItem({ challenge, onToggle, isTodayDone }) {
  return (
    <div
      onClick={() => onToggle(challenge.id)}
      className={`
        relative cursor-pointer group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 overflow-hidden
        ${
          isTodayDone
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent shadow-lg shadow-indigo-200 translate-x-1"
            : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      {/* Background Glow Effect for Completed */}
      {isTodayDone && (
        <div className="absolute inset-0 bg-white/10 blur-xl"></div>
      )}

      <div className="relative z-10 flex items-center gap-4">
        <div
          className={`
          p-2 rounded-lg transition-colors
          ${
            isTodayDone
              ? "bg-white/20 text-white"
              : "bg-orange-50 text-orange-500 group-hover:scale-110 duration-300"
          }
        `}
        >
          {isTodayDone ? (
            <Trophy className="w-5 h-5" />
          ) : (
            <Flame className="w-5 h-5" />
          )}
        </div>

        <div>
          <h4
            className={`font-bold text-sm ${
              isTodayDone ? "text-white" : "text-gray-700"
            }`}
          >
            {challenge.title}
          </h4>
          <span
            className={`text-xs font-medium tracking-wide ${
              isTodayDone ? "text-indigo-100" : "text-gray-400"
            }`}
          >
            Current Streak: {challenge.currentStreak}
          </span>
        </div>
      </div>

      <div
        className={`
        relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
        ${
          isTodayDone
            ? "bg-white text-indigo-600 border-white scale-100"
            : "border-gray-200 text-transparent scale-90 group-hover:border-indigo-300"
        }
      `}
      >
        <Check className="w-4 h-4" strokeWidth={4} />
      </div>
    </div>
  );
}
