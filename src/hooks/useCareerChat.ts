import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-guidance`;

export function useCareerChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI career counselor. 🐧 I'm here to help you navigate your career journey. You can ask me about:\n\n• Career path recommendations\n• Interview preparation tips\n• Resume improvement suggestions\n• Industry insights and trends\n• Skill development roadmaps\n\nHow can I assist you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      const { data, error } = await supabase
        .from("chat_history")
        .select("messages")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading chat history:", error);
      }

      if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages as unknown as Message[]);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveChatHistory = async (newMessages: Message[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const messagesJson = JSON.parse(JSON.stringify(newMessages)) as Json;

      const { data: existing } = await supabase
        .from("chat_history")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        await supabase
          .from("chat_history")
          .update({ messages: messagesJson, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("chat_history")
          .insert({ user_id: user.id, messages: messagesJson });
      }
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    let assistantContent = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages.slice(1), // Skip initial greeting for context
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate limit exceeded",
            description: "Please wait a moment before sending another message.",
          });
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 402) {
          toast({
            variant: "destructive",
            title: "Credits exhausted",
            description: "Please add credits to continue using AI features.",
          });
          throw new Error("Payment required");
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      assistantContent = data.message || "I apologize, but I couldn't generate a response. Please try again.";

      const finalMessages: Message[] = [
        ...updatedMessages,
        { role: "assistant", content: assistantContent },
      ];
      
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);

    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Request aborted");
        return;
      }
      
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again in a moment.",
      };
      setMessages([...updatedMessages, errorMessage]);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI response. Please try again.",
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, toast]);

  const clearChat = useCallback(async () => {
    const initialMessage: Message = {
      role: "assistant",
      content: "Hello! I'm your AI career counselor. 🐧 I'm here to help you navigate your career journey. You can ask me about:\n\n• Career path recommendations\n• Interview preparation tips\n• Resume improvement suggestions\n• Industry insights and trends\n• Skill development roadmaps\n\nHow can I assist you today?",
    };
    setMessages([initialMessage]);
    await saveChatHistory([initialMessage]);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    sendMessage,
    clearChat,
    cancelRequest,
  };
}
