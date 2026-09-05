"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Send, Bot, User, Plus, Trash2, MessageSquare, Loader2, BookOpen, GraduationCap, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your StudyFlow AI Assistant. I have full context on your subjects, progress, available study hours, and upcoming exam deadlines. How can I help you excel today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch {
      toast.error("Failed to load conversation history");
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConvId) {
      fetch(`/api/chat/conversations/${activeConvId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.conversation?.messages) {
            setMessages(
              data.conversation.messages.map((m: any) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [activeConvId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: activeConvId ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "AI request failed");
      }

      const data = await res.json();
      if (data.conversationId && !activeConvId) {
        setActiveConvId(data.conversationId);
        fetchConversations();
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId ?? Date.now().toString(),
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (err: any) {
      toast.error(err.message ?? "Error sending message");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "New conversation started! Ask me anything about your study schedule or syllabus.",
      },
    ]);
  };

  const handleDeleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Conversation deleted");
        if (activeConvId === id) handleNewChat();
        fetchConversations();
      }
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const samplePrompts = [
    "What should I study today?",
    "I only have 2 hours today. What should I prioritize?",
    "My exam is in 5 days. Make a revision plan.",
    "Explain binary search trees simply.",
    "Quiz me on Database normalization.",
    "I missed yesterday's schedule. Fix my plan.",
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
      {/* Sidebar Conversation List */}
      <Card className="w-full md:w-64 border shadow-sm shrink-0 flex flex-col">
        <CardHeader className="p-4 border-b">
          <Button onClick={handleNewChat} className="w-full gap-2 font-semibold text-xs" size="sm">
            <Plus className="h-4 w-4" /> New Conversation
          </Button>
        </CardHeader>
        <CardContent className="p-2 flex-1 overflow-y-auto space-y-1">
          {convLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">No past chats yet.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  activeConvId === c.id ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConv(c.id, e)}
                  className="text-muted-foreground hover:text-destructive opacity-70 hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Main Chat Interface */}
      <Card className="flex-1 border shadow-sm flex flex-col overflow-hidden">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">StudyFlow AI Tutor & Assistant</CardTitle>
              <CardDescription className="text-xs">Context-aware personalized study guidance</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col justify-between overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-sm ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <Avatar className="h-8 w-8 bg-primary/10 text-primary shrink-0">
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-accent/60 text-foreground rounded-tl-none border"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <Avatar className="h-8 w-8 bg-muted shrink-0">
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>AI is analyzing your workload & generating response...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2 border-t pt-3">
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-xs bg-accent hover:bg-accent/80 text-foreground px-3 py-1.5 rounded-full border transition-colors font-medium"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-3 border-t bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex w-full items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your study plan, subjects, or concepts..."
              className="h-10 text-sm"
              disabled={loading}
            />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
