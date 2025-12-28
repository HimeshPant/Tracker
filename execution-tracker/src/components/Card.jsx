import React from "react";

export default function Card({ title, children, action, className = "" }) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          {title && (
            <h3 className="font-bold text-gray-800 tracking-tight text-sm uppercase opacity-90">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
