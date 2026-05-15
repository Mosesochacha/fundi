"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

const STEPS = [
  "Reading your experience...",
  "Writing your bio...",
  "Crafting your tagline...",
  "Building your services...",
];

const DELAYS = [0, 1200, 2000, 2800];
const CHECK_DELAYS = [800, 2500, 3500, 4000];

interface Props {
  onDone: () => void;
}

export default function AIGenerating({ onDone }: Props) {
  const [visible, setVisible] = useState<number[]>([]);
  const [checked, setChecked] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    DELAYS.forEach((d, i) => {
      timers.push(setTimeout(() => setVisible((v) => [...v, i]), d));
    });
    CHECK_DELAYS.forEach((d, i) => {
      timers.push(setTimeout(() => setChecked((v) => [...v, i]), d));
    });
    timers.push(setTimeout(() => setDone(true), 4800));
    timers.push(setTimeout(onDone, 6800));

    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      {!done ? (
        <>
          {/* Pulsing circles */}
          <div className="relative flex items-center justify-center mb-10" style={{ width: 80, height: 80 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 80 - i * 20,
                  height: 80 - i * 20,
                  backgroundColor: `rgba(249, 115, 22, ${0.15 + i * 0.1})`,
                  animation: `pulse-ring 1.8s ease-in-out ${i * 0.4}s infinite`,
                }}
              />
            ))}
          </div>

          <div className="space-y-3 text-left w-full max-w-xs">
            {STEPS.map((text, i) => (
              <div
                key={i}
                className="flex items-center gap-3 transition-all duration-500"
                style={{
                  opacity: visible.includes(i) ? 1 : 0,
                  transform: visible.includes(i) ? "translateY(0)" : "translateY(8px)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{ backgroundColor: checked.includes(i) ? "#22c55e" : "#e5e7eb" }}
                >
                  {checked.includes(i) && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm text-gray-700">{text}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="animate-fade-in text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#22c55e" }}
          >
            <Check size={32} className="text-white" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Your profile is ready!</h2>
          <p className="text-gray-500 text-sm">Click any text to make it yours</p>
          <p className="text-gray-400 text-xs mt-1">→</p>
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
