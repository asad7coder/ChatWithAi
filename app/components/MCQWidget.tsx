"use client";

import React, { useState } from "react";

interface MCQWidgetProps {
  data: {
    question: string;
    options: string[];
  };
  onSendMessage: (text: string) => void;
}

export default function MCQWidget({ data, onSendMessage }: MCQWidgetProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selected) {
      onSendMessage(selected);
    }
  };

  return (
    <div 
      className="my-4 w-full max-w-2xl rounded-2xl border p-4 sm:p-5 shadow-sm"
      style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}
    >
      <h4 className="mb-4 text-sm font-semibold" style={{ color: "var(--app-text)" }}>
        {data.question}
      </h4>
      
      <div className="space-y-2.5 mb-5">
        {data.options.map((option, idx) => {
          const isSelected = selected === option;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelected(option)}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all"
              style={{
                borderColor: isSelected ? "var(--theme-primary)" : "var(--app-border)",
                backgroundColor: isSelected ? "var(--theme-primary-soft)" : "transparent",
                color: isSelected ? "var(--theme-primary)" : "var(--app-text-muted)",
              }}
            >
              {/* Radio Circle */}
              <div 
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                style={{ 
                  borderColor: isSelected ? "var(--theme-primary)" : "var(--app-text-dim)",
                  backgroundColor: isSelected ? "var(--theme-primary)" : "transparent"
                }}
              >
                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              <span className="font-medium">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Continue Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full rounded-xl py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ 
          backgroundColor: "var(--app-text)", // Uses dark/light text color for contrast
          color: "var(--app-bg)" 
        }}
      >
        Continue
      </button>
    </div>
  );
}