"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, User, Bell, Monitor, Sparkles, Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile & Study Preferences State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [educationLevel, setEducationLevel] = useState("UNIVERSITY");
  const [course, setCourse] = useState("");
  const [preferredStudyTime, setPreferredStudyTime] = useState("MORNING");
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState(4);
  const [maxSessionDuration, setMaxSessionDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(10);

  // Notification Toggles
  const [notifyExams, setNotifyExams] = useState(true);
  const [notifySessions, setNotifySessions] = useState(true);
  const [aiAutoReschedule, setAiAutoReschedule] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setName(data.user.name ?? "");
          setEmail(data.user.email ?? "");
        }
        if (data.profile) {
          setEducationLevel(data.profile.educationLevel ?? "UNIVERSITY");
          setCourse(data.profile.course ?? "");
          setPreferredStudyTime(data.profile.preferredStudyTime ?? "MORNING");
          setAvailableHoursPerDay(data.profile.availableHoursPerDay ?? 4);
          setMaxSessionDuration(data.profile.maxSessionDuration ?? 60);
          setBreakDuration(data.profile.breakDuration ?? 10);
          setNotifyExams(data.profile.notifyExams ?? true);
          setNotifySessions(data.profile.notifySessions ?? true);
          setAiAutoReschedule(data.profile.aiAutoReschedule ?? true);
        }
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          educationLevel,
          course,
          preferredStudyTime,
          availableHoursPerDay: Number(availableHoursPerDay),
          maxSessionDuration: Number(maxSessionDuration),
          breakDuration: Number(breakDuration),
          notifyExams,
          notifySessions,
          aiAutoReschedule,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message ?? "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account & App Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your study commitments, notification rules, theme preferences, and AI scheduling behavior.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <form onSubmit={handleSaveSettings}>
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full sm:w-[500px] grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="study">Study Prefs</TabsTrigger>
              <TabsTrigger value="notifications">Alerts</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Profile Information
                  </CardTitle>
                  <CardDescription>Update your name and academic degree details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={email} disabled className="bg-muted" />
                    <p className="text-[11px] text-muted-foreground">Email address cannot be changed.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Education Level</Label>
                      <Select value={educationLevel} onValueChange={setEducationLevel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SCHOOL">High School</SelectItem>
                          <SelectItem value="COLLEGE">College</SelectItem>
                          <SelectItem value="UNIVERSITY">University</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Degree / Major</Label>
                      <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Computer Science" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t py-3 justify-end">
                  <Button type="submit" size="sm" className="gap-2 font-semibold" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Study Preferences Tab */}
            <TabsContent value="study">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Scheduling Constraints
                  </CardTitle>
                  <CardDescription>Adjust your daily availability and session duration limits.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preferred Study Time</Label>
                      <Select value={preferredStudyTime} onValueChange={setPreferredStudyTime}>
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
                      <Label>Available Study Hours Per Day</Label>
                      <Input
                        type="number"
                        min={1}
                        max={16}
                        step={0.5}
                        value={availableHoursPerDay}
                        onChange={(e) => setAvailableHoursPerDay(parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Single Session Duration (Minutes)</Label>
                      <Select value={String(maxSessionDuration)} onValueChange={(v) => setMaxSessionDuration(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Break Duration (Minutes)</Label>
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
                <CardFooter className="border-t py-3 justify-end">
                  <Button type="submit" size="sm" className="gap-2 font-semibold" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Preferences
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> Smart Notification Rules
                  </CardTitle>
                  <CardDescription>Control when StudyFlow AI sends you reminders and alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <h4 className="font-semibold text-sm">Exam & Deadline Reminders</h4>
                      <p className="text-xs text-muted-foreground">Receive countdown alerts before approaching tests.</p>
                    </div>
                    <Switch checked={notifyExams} onCheckedChange={setNotifyExams} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <h4 className="font-semibold text-sm">Session Start Alerts</h4>
                      <p className="text-xs text-muted-foreground">Get notified when a scheduled study session is starting.</p>
                    </div>
                    <Switch checked={notifySessions} onCheckedChange={setNotifySessions} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <h4 className="font-semibold text-sm">AI Automatic Rescheduling</h4>
                      <p className="text-xs text-muted-foreground">Allow AI to offer auto-rescheduling when a session is missed.</p>
                    </div>
                    <Switch checked={aiAutoReschedule} onCheckedChange={setAiAutoReschedule} />
                  </div>
                </CardContent>
                <CardFooter className="border-t py-3 justify-end">
                  <Button type="submit" size="sm" className="gap-2 font-semibold" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Alerts
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" /> App Theme
                  </CardTitle>
                  <CardDescription>Select your visual preference for Light, Dark, or System mode.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`p-4 border rounded-xl text-center space-y-2 transition-all ${
                        theme === "light" ? "border-primary bg-primary/10 font-bold" : "hover:bg-accent"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-white border mx-auto flex items-center justify-center text-xs">☀️</div>
                      <span className="text-xs">Light Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`p-4 border rounded-xl text-center space-y-2 transition-all ${
                        theme === "dark" ? "border-primary bg-primary/10 font-bold" : "hover:bg-accent"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-zinc-900 border mx-auto flex items-center justify-center text-xs text-white">🌙</div>
                      <span className="text-xs">Dark Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={`p-4 border rounded-xl text-center space-y-2 transition-all ${
                        theme === "system" ? "border-primary bg-primary/10 font-bold" : "hover:bg-accent"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-zinc-500 border mx-auto flex items-center justify-center text-xs text-white">💻</div>
                      <span className="text-xs">System Default</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      )}
    </div>
  );
}
