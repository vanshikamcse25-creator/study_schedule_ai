"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Calendar,
  Clock,
  TrendingUp,
  Bot,
  Zap,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Flame,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  Layers,
  BarChart3,
  Sliders,
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStoryStep, setActiveStoryStep] = useState(0);
  const [chatMessageInput, setChatMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "user", text: "Explain Binary Search Trees simply." },
    {
      role: "assistant",
      text: "**Binary Search Trees (BST)** are hierarchical data structures where each node has at most two children:\n\n- **Left Child**: Value is strictly smaller than the parent.\n- **Right Child**: Value is strictly greater than the parent.\n\n**Key Benefit**: Search and Insert operations run in $O(\\log n)$ time!",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // 3D Perspective Tilt on Mouse Movement
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [4, -4]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-500, 500], [-4, 4]), { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Story step automatic progression loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStoryStep((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendChatPrompt = (promptText: string) => {
    if (isTyping) return;
    setChatMessages((prev) => [...prev, { role: "user", text: promptText }]);
    setIsTyping(true);

    setTimeout(() => {
      let reply = "";
      if (promptText.includes("Simpler")) {
        reply = "Think of a BST like a phonebook: to find a name starting with 'M', you open right in the middle. If your name comes before 'M', you throw away the right half and look only left!";
      } else if (promptText.includes("Example")) {
        reply = "Example: Inserting `5, 3, 7`:\n- Root = `5`\n- `3` < `5` → left of 5\n- `7` > `5` → right of 5";
      } else if (promptText.includes("Quiz")) {
        reply = "Quick Quiz: What is the worst-case time complexity of searching an unbalanced BST?\nA) $O(1)$\nB) $O(\\log n)$\nC) $O(n)$\n\n(Answer: C! An unbalanced tree degrades into a linked list!)";
      } else {
        reply = "Active recall practice initialized! Test yourself: try writing out in-order, pre-order, and post-order traversals from memory.";
      }
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 1200);
  };

  return (
    <div
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen bg-[#060810] text-[#F8FAFC] flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden"
    >
      {/* Top Thin Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Hero Ambient Motion Lights */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/15 blur-[140px] rounded-full animate-ambient-pulse" />
        <div className="absolute top-1/3 -right-20 w-[600px] h-[400px] bg-purple-600/12 blur-[130px] rounded-full animate-ambient-pulse" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-10 -left-20 w-[600px] h-[400px] bg-cyan-500/10 blur-[130px] rounded-full animate-ambient-pulse" style={{ animationDelay: "6s" }} />
        <div className="absolute inset-0 hero-grid-pattern opacity-40" />
      </div>

      {/* Top Glass Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "glass-navbar py-3 shadow-2xl" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">
              StudyFlow <span className="text-indigo-400 font-extrabold">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium text-slate-300 hover:text-white hover:bg-white/5">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          {/* AI Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Badge className="px-4 py-1.5 rounded-full text-xs font-semibold gap-2 glass-panel text-indigo-300 border-indigo-500/30 shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin" style={{ animationDuration: "8s" }} />
              <span>Next-Gen Autonomous AI Scheduling Engine</span>
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-balance leading-[1.1]"
          >
            Study Smarter. Plan Better. <br />
            <motion.span
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent inline-block"
            >
              Achieve More.
            </motion.span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto text-balance leading-relaxed"
          >
            An autonomous AI study planner that constructs a dynamic, balanced routine calculated around your exams, syllabus difficulty, and daily available time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base gap-2 px-8 h-13 font-semibold bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 bg-[length:200%_auto] hover:bg-right text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 border-0"
              >
                Create My Study Plan
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#product-story" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-13 glass-panel text-slate-200 border-white/10 hover:bg-white/5 hover:border-white/20">
                Explore How AI Adapts
              </Button>
            </a>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant Groq AI setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Auto-reschedules missed sessions
            </span>
          </motion.div>

          {/* 3D Perspective Floating Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="pt-10 max-w-4xl mx-auto perspective-1000"
          >
            <div className="relative rounded-2xl p-1 bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-cyan-500/30 shadow-2xl shadow-indigo-500/20 group">
              <div className="rounded-xl glass-card overflow-hidden text-left p-6 space-y-6 relative border-white/10">
                {/* Floating AI Insight Notification */}
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 2.2 }}
                  className="absolute top-4 right-4 z-20 max-w-xs rounded-xl glass-panel p-3 border-indigo-500/40 shadow-xl backdrop-blur-2xl text-xs space-y-1 animate-float-smooth"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-300" /> AI Priority Insight
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-slate-200 font-medium">
                    &ldquo;Exam approaching in 3 days. I&apos;ve automatically increased today&apos;s revision block.&rdquo;
                  </p>
                </motion.div>

                {/* Dashboard Header Preview */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                      Today&apos;s AI Study Schedule
                      <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                        Live AI Active
                      </Badge>
                    </h3>
                    <p className="text-xs text-slate-400">4 sessions scheduled • 4.0 hrs target available</p>
                  </div>
                </div>

                {/* Timeline Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-4 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                      <span>09:00 - 10:00 (60m)</span>
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                        <Check className="h-3 w-3" /> Done (+15 XP)
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-100">Data Structures — Binary Trees</div>
                    <div className="text-[11px] text-slate-400">Hard • High Exam Weight</div>
                  </div>

                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2 relative">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>10:10 - 11:10 (60m)</span>
                      <span className="text-amber-400 flex items-center gap-1 text-[10px]">
                        <Play className="h-3 w-3 fill-current" /> Active Focus
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-100">Computer Science — Algorithms</div>
                    <div className="text-[11px] text-slate-400">Practice & Active Recall</div>
                  </div>

                  <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 space-y-2 relative">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                      <span>11:20 - 12:20 (60m)</span>
                      <span className="text-slate-400 text-[10px]">Scheduled</span>
                    </div>
                    <div className="font-semibold text-sm text-slate-100">General Math — Calculus</div>
                    <div className="text-[11px] text-slate-400">Exam Revision</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Product Story Section */}
      <section id="product-story" className="py-24 border-t border-white/10 relative bg-[#0B1020]/50">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="px-3 py-1 text-xs border-indigo-500/30 text-indigo-300 glass-panel">
              Autonomous USP Engine
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100">
              How StudyFlow AI Thinks & Adapts
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              See how the priority scheduler processes inputs, reschedules missed blocks, and optimizes your study plan dynamically.
            </p>
          </div>

          {/* Step Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl mx-auto">
            {[
              { idx: 0, title: "1. Inputs", icon: Sliders },
              { idx: 1, title: "2. Priority Engine", icon: BrainCircuit },
              { idx: 2, title: "3. Schedule Built", icon: Calendar },
              { idx: 3, title: "4. Missed Session", icon: RotateCcw },
              { idx: 4, title: "5. AI Auto-Replan", icon: Sparkles },
            ].map((step) => {
              const Icon = step.icon;
              const isActive = activeStoryStep === step.idx;
              return (
                <button
                  key={step.idx}
                  onClick={() => setActiveStoryStep(step.idx)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isActive
                      ? "border-indigo-500 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20"
                      : "border-white/10 glass-panel text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : ""}`} />
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>

          {/* Workflow Interactive Visual Container */}
          <div className="rounded-2xl glass-card p-8 border border-white/10 max-w-4xl mx-auto min-h-[260px] flex items-center justify-center relative overflow-hidden">
            {activeStoryStep === 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Step 1: Student Preferences</Badge>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1 text-xs">
                    <span className="text-slate-400 font-bold">Subjects & Topics</span>
                    <p className="font-semibold text-slate-200">Data Structures (Hard), Calculus (Medium)</p>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1 text-xs">
                    <span className="text-slate-400 font-bold">Upcoming Exams</span>
                    <p className="font-semibold text-amber-400">Math Midterm in 3 Days</p>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1 text-xs">
                    <span className="text-slate-400 font-bold">Daily Time Limit</span>
                    <p className="font-semibold text-emerald-400">4 Hours / Day Available</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStoryStep === 1 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center max-w-xl">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                  <BrainCircuit className="h-8 w-8 animate-pulse" />
                </div>
                <h4 className="font-bold text-lg text-slate-100">AI Priority Formula Executing</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Priority = (Exam Urgency Weight × 40) + (Syllabus Progress Deficit × 25) + (Subject Difficulty × 20).
                </p>
              </motion.div>
            )}

            {activeStoryStep === 2 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center w-full max-w-xl">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Step 3: Optimal Timetable Built</Badge>
                <div className="space-y-2 text-left text-xs">
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex justify-between items-center font-medium">
                    <span>09:00 - Data Structures (BFS/DFS)</span>
                    <span className="text-emerald-400">Scheduled (60m)</span>
                  </div>
                  <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 flex justify-between items-center font-medium">
                    <span>10:10 - Linear Algebra Revision</span>
                    <span className="text-indigo-400">Scheduled (60m)</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStoryStep === 3 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center max-w-md">
                <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-base text-rose-300">Unforeseen Delay: Session Missed</h4>
                <p className="text-xs text-slate-400">
                  You got delayed at 10:10 AM. StudyFlow AI flags the missed block without breaking your daily streak.
                </p>
              </motion.div>
            )}

            {activeStoryStep === 4 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center max-w-md">
                <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                  <Sparkles className="h-6 w-6 animate-spin" style={{ animationDuration: "6s" }} />
                </div>
                <h4 className="font-bold text-base text-indigo-300">AI Autonomous Schedule Rebalance</h4>
                <p className="text-xs text-slate-300">
                  Missed linear algebra revision moved to tomorrow&apos;s 09:00 slot. Remaining schedule re-balanced cleanly.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100">
              Built Like an AI Operating System
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              Every component is engineered for cognitive retention, exam preparedness, and zero decision fatigue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SpotlightCard className="p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Mathematical Priority Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ranks topics dynamically using exam proximity, remaining syllabus percentage, difficulty ratings, and priority flags.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Instant AI Auto-Reschedule</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Missed a study block? The AI engine instantly rebalances future sessions without exceeding daily hour constraints.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Context-Aware AI Tutor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chat with Groq AI trained on your exact subjects, exam dates, and daily study performance for personalized tutoring.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Pomodoro Focus Timer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integrated focus timer automatically syncs completed sessions to PostgreSQL, awarding XP and updating streaks.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Recharts Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual completion charts, mastery bars, and weekly progress analytics track your study consistency over time.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Gamification & XP Levels</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Earn XP for every completed session, level up your profile, and unlock achievements as you build your streak.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Interactive AI Tutor Section */}
      <section className="py-24 border-t border-white/10 relative bg-[#0B1020]/30">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-3">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Live Interactive Preview</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100">Test the StudyFlow AI Assistant</h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
              Click any quick action chip below to experience how the AI assistant responds to study queries.
            </p>
          </div>

          {/* Interactive Chat Window */}
          <div className="rounded-2xl glass-card p-6 border border-white/10 space-y-6">
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "glass-panel text-slate-200 rounded-bl-none border-white/10"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass-panel p-3 rounded-2xl text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              {[
                "Explain Simpler",
                "Give Example",
                "Generate Quiz",
                "Active Recall Test",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChatPrompt(chip)}
                  disabled={isTyping}
                  className="px-3 py-1.5 rounded-full text-xs glass-panel border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  ✦ {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <div className="p-10 rounded-3xl gradient-border-animated space-y-6 shadow-2xl shadow-indigo-500/20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100">
              Ready to Master Your Study Schedule?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Join students who plan smarter, eliminate stress, and ace their exams with StudyFlow AI.
            </p>
            <div>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="font-semibold px-10 h-13 text-base bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 bg-[length:200%_auto] hover:bg-right text-white shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all duration-300 border-0"
                >
                  Get Started Free Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Footer */}
      <footer className="border-t border-white/10 py-8 bg-[#060810] text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="font-bold text-slate-200">StudyFlow AI</span>
            <span>© 2026. Autonomous AI Operating System for Students.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
