"use client";

import { useState, useEffect, useRef } from "react";
import { useChatStore } from "./chat-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Send, X, Bot, User, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function FloatingChatDrawer() {
  const { isOpen, closeChat } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your StudyFlow AI Assistant. Ask me anything about your subjects, study schedule, exam preparation, or concepts you'd like explained!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? input;
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to get AI response");
      }

      const data = await res.json();
      if (data.conversationId) {
        setConversationId(data.conversationId);
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
    setConversationId(undefined);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "New chat started! How can I help you today?",
      },
    ]);
  };

  const quickPrompts = [
    "What should I study today?",
    "I only have 2 hours today. What should I prioritize?",
    "Quiz me on my most difficult subject.",
    "Explain this topic simply.",
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 duration-200">
      <Card className="border shadow-2xl rounded-2xl overflow-hidden backdrop-blur bg-card/95">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">StudyFlow AI Assistant</CardTitle>
              <p className="text-[11px] text-muted-foreground">Personalized study guidance</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewChat} title="New Chat">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeChat}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-sm ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <Avatar className="h-7 w-7 bg-primary/10 text-primary shrink-0">
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 max-w-[80%] whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none border"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <Avatar className="h-7 w-7 bg-muted shrink-0">
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>AI is thinking...</span>
              </div>
            )}
          </div>

          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-xs bg-accent hover:bg-accent/80 text-foreground px-2.5 py-1 rounded-full border transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-3 border-t">
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
              placeholder="Ask AI assistant..."
              className="h-9 text-sm"
              disabled={loading}
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
