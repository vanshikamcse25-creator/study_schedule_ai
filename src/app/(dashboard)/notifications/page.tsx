"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, GraduationCap, Calendar, Flame, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (res.ok) {
        toast.success("All notifications marked as read");
        fetchNotifications();
      }
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "EXAM":
      case "DEADLINE":
        return <GraduationCap className="h-5 w-5 text-amber-500" />;
      case "STREAK":
        return <Flame className="h-5 w-5 text-orange-500" />;
      case "DAILY_PLAN":
        return <Sparkles className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-sm text-muted-foreground">
            Smart reminders for upcoming exams, study sessions, and streak milestones.
          </p>
        </div>

        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleMarkAllRead}>
          <CheckCheck className="h-4 w-4" /> Mark All as Read
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : notifications.length === 0 ? (
        <Card className="border border-dashed p-12 text-center space-y-4">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="font-semibold text-base">No Notifications</h3>
            <p className="text-xs text-muted-foreground">You are all caught up!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`border shadow-sm transition-colors ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0 border">
                  {getIcon(n.type)}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm">{n.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
