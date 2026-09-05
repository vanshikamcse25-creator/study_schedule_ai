"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, ArrowLeft, Plus, Trash2, CheckCircle2, Loader2, BookOpen, Calendar, Clock, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface SubjectForm {
  name: string;
  code: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  topics: Array<{ name: string; difficulty: "EASY" | "MEDIUM" | "HARD"; estimatedMinutes: number }>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State
  const [name, setName] = useState("");
  const [educationLevel, setEducationLevel] = useState<"SCHOOL" | "COLLEGE" | "UNIVERSITY" | "OTHER">("UNIVERSITY");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");

  // Step 2 State
  const [preferredStudyTime, setPreferredStudyTime] = useState<"MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "FLEXIBLE">("MORNING");
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState(4);
  const [studyDays, setStudyDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]);
  const [maxSessionDuration, setMaxSessionDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(10);
  const [studyStyle, setStudyStyle] = useState<"SHORT_FOCUSED" | "LONG_DEEP" | "MIXED">("SHORT_FOCUSED");

  // Step 3 State (Subjects)
  const [subjects, setSubjects] = useState<SubjectForm[]>([
    {
      name: "Data Structures & Algorithms",
      code: "CS301",
      difficulty: "HARD",
      priority: "CRITICAL",
      topics: [
        { name: "Binary Trees", difficulty: "MEDIUM", estimatedMinutes: 60 },
        { name: "Graph BFS/DFS", difficulty: "HARD", estimatedMinutes: 90 },
      ],
    },
    {
      name: "Linear Algebra",
      code: "MATH201",
      difficulty: "MEDIUM",
      priority: "HIGH",
      topics: [
        { name: "Eigenvalues", difficulty: "HARD", estimatedMinutes: 60 },
      ],
    },
  ]);

  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjCode, setNewSubjCode] = useState("");
  const [newSubjDiff, setNewSubjDiff] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [newSubjPrio, setNewSubjPrio] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newTopicName, setNewTopicName] = useState("");

  const handleAddSubject = () => {
    if (!newSubjName.trim()) {
      toast.error("Subject name is required");
      return;
    }
    setSubjects((prev) => [
      ...prev,
      {
        name: newSubjName,
        code: newSubjCode,
        difficulty: newSubjDiff,
        priority: newSubjPrio,
        topics: newTopicName.trim()
          ? [{ name: newTopicName, difficulty: newSubjDiff, estimatedMinutes: 60 }]
          : [],
      },
    ]);
    setNewSubjName("");
    setNewSubjCode("");
    setNewTopicName("");
  };

  const handleRemoveSubject = (idx: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleDay = (day: string) => {
    setStudyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload = {
        name: name || "Student",
        educationLevel,
        course,
        semester,
        preferredStudyTime,
        availableHoursPerDay: Number(availableHoursPerDay),
        studyDays,
        maxSessionDuration: Number(maxSessionDuration),
        breakDuration: Number(breakDuration),
        studyStyle,
        subjects,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save onboarding");
      }

      toast.success("Welcome! Your AI study plan has been created.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const dayOptions = [
    { key: "monday", label: "Mon" },
    { key: "tuesday", label: "Tue" },
    { key: "wednesday", label: "Wed" },
    { key: "thursday", label: "Thu" },
    { key: "friday", label: "Fri" },
    { key: "saturday", label: "Sat" },
    { key: "sunday", label: "Sun" },
  ];

  return (
    <div className="min-h-screen bg-muted/40 py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span>StudyFlow AI</span>
          </div>
          <p className="text-sm text-muted-foreground">Let&apos;s set up your personalized AI study profile</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 && "Basic Profile"}
              {step === 2 && "Study Preferences"}
              {step === 3 && "Subjects & Topics"}
              {step === 4 && "Summary & AI Plan"}
            </span>
          </div>
          <Progress value={(step / 4) * 100} className="h-2" />
        </div>

        {/* Form Steps */}
        <Card className="border shadow-lg rounded-2xl">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Tell us about yourself</CardTitle>
                <CardDescription>We&apos;ll tailor your study velocity based on your level and academic field.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Education Level</Label>
                  <Select value={educationLevel} onValueChange={(val: any) => setEducationLevel(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHOOL">High School</SelectItem>
                      <SelectItem value="COLLEGE">College / Associate</SelectItem>
                      <SelectItem value="UNIVERSITY">University / Bachelor / Master</SelectItem>
                      <SelectItem value="OTHER">Self Study / Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Degree / Major</Label>
                    <Input
                      id="course"
                      placeholder="e.g. Computer Science"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester / Year</Label>
                    <Input
                      id="semester"
                      placeholder="e.g. Semester 5"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Configure your study preferences</CardTitle>
                <CardDescription>Specify when and how long you are available to study each day.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Study Time</Label>
                    <Select value={preferredStudyTime} onValueChange={(val: any) => setPreferredStudyTime(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MORNING">Morning (8 AM - 12 PM)</SelectItem>
                        <SelectItem value="AFTERNOON">Afternoon (1 PM - 5 PM)</SelectItem>
                        <SelectItem value="EVENING">Evening (5 PM - 9 PM)</SelectItem>
                        <SelectItem value="NIGHT">Night (8 PM - 12 AM)</SelectItem>
                        <SelectItem value="FLEXIBLE">Flexible / Balanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Available Hours / Day: <span className="font-bold text-primary">{availableHoursPerDay} hrs</span></Label>
                    <Input
                      type="range"
                      min={1}
                      max={12}
                      step={0.5}
                      value={availableHoursPerDay}
                      onChange={(e) => setAvailableHoursPerDay(parseFloat(e.target.value))}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Active Study Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map((day) => {
                      const active = studyDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-muted-foreground border-input hover:bg-accent"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Session Duration (mins)</Label>
                    <Select value={String(maxSessionDuration)} onValueChange={(v) => setMaxSessionDuration(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes (Standard)</SelectItem>
                        <SelectItem value="90">90 minutes (Deep focus)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Break Duration (mins)</Label>
                    <Select value={String(breakDuration)} onValueChange={(v) => setBreakDuration(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Add your current subjects</CardTitle>
                <CardDescription>Enter the subjects and key topics you need to cover.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* List Existing Subjects */}
                <div className="space-y-3">
                  {subjects.map((subj, idx) => (
                    <div key={idx} className="p-3 border rounded-xl bg-accent/30 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{subj.name}</span>
                          {subj.code && <Badge variant="outline" className="text-[10px]">{subj.code}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Difficulty: {subj.difficulty}</span>
                          <span>•</span>
                          <span>Priority: {subj.priority}</span>
                          <span>•</span>
                          <span>{subj.topics.length} topics</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveSubject(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add New Subject */}
                <div className="p-4 border rounded-xl space-y-3 bg-card">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Another Subject</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Subject Name (e.g. Operating Systems)"
                      value={newSubjName}
                      onChange={(e) => setNewSubjName(e.target.value)}
                    />
                    <Input
                      placeholder="Code (e.g. CS302)"
                      value={newSubjCode}
                      onChange={(e) => setNewSubjCode(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select value={newSubjDiff} onValueChange={(v: any) => setNewSubjDiff(v)}>
                      <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newSubjPrio} onValueChange={(v: any) => setNewSubjPrio(v)}>
                      <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low Priority</SelectItem>
                        <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                        <SelectItem value="HIGH">High Priority</SelectItem>
                        <SelectItem value="CRITICAL">Critical Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Initial topic name (optional)"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                  />
                  <Button type="button" variant="secondary" size="sm" className="w-full gap-2" onClick={handleAddSubject}>
                    <Plus className="h-4 w-4" /> Add Subject to List
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle>Profile Summary & AI Plan Setup</CardTitle>
                <CardDescription>Review your setup before generating your personalized AI study schedule.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-xl bg-accent/20">
                  <div>
                    <span className="text-xs text-muted-foreground">Student</span>
                    <p className="font-semibold text-sm">{name || "Alex Morgan"}</p>
                    <p className="text-xs text-muted-foreground">{educationLevel} • {course}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Daily Commitment</span>
                    <p className="font-semibold text-sm">{availableHoursPerDay} Hours / Day</p>
                    <p className="text-xs text-muted-foreground">{studyDays.length} Days/Week • {preferredStudyTime}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configured Subjects ({subjects.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 text-xs">
                        {s.name} ({s.difficulty})
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 border rounded-xl bg-primary/5 space-y-2 border-primary/20">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Sparkles className="h-4 w-4" />
                    <span>What happens next?</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When you click below, our AI scheduler will calculate priority scores, respect your preferred study hours and session limits, and build a tailored weekly plan.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          <CardFooter className="flex justify-between border-t py-4">
            {step > 1 ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button size="sm" className="gap-2" onClick={() => setStep(step + 1)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="default" className="gap-2 font-semibold shadow-md" onClick={handleFinish} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate My First Study Plan
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
