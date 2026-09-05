"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BrainCircuit, CheckCircle2, Clock } from "lucide-react";

interface AiLoadingStepperProps {
  active: boolean;
  onComplete?: () => void;
}

const STEPS = [
  "✦ StudyFlow AI Engine Initializing...",
  "Analyzing your subjects & syllabus workload...",
  "Calculating priority scores based on exam urgency...",
  "Balancing study blocks against daily hour constraints...",
  "Optimizing spaced repetition & revision breaks...",
  "✨ Your personalized AI study schedule is ready!",
];

export function AiLoadingStepper({ active, onComplete }: AiLoadingStepperProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        if (onComplete) onComplete();
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-[#0B1020]/90 p-6 shadow-2xl backdrop-blur-xl space-y-6 text-center"
      >
        <div className="relative mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25">
          <div className="h-full w-full rounded-[15px] bg-[#060810] flex items-center justify-center text-indigo-400">
            <BrainCircuit className="h-8 w-8 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> StudyFlow AI Engine
          </div>
          <h3 className="text-lg font-bold text-slate-100">Calculating Priorities</h3>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Active Step Indicator */}
        <div className="h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-medium text-slate-300 flex items-center justify-center gap-2"
            >
              {currentStepIndex === STEPS.length - 1 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-indigo-400 animate-spin shrink-0" />
              )}
              <span>{STEPS[currentStepIndex]}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
