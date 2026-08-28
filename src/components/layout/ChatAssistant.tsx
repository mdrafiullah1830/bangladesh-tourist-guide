"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Assalamu Alaikum! 🇧🇩 I'm your AI travel assistant for Bangladesh. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(input.toLowerCase());
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const generateResponse = (msg: string): string => {
    if (msg.includes("airport") || msg.includes("landed") || msg.includes("arrive")) {
      return "Welcome to Bangladesh! 🇧🇩\n\n**Hazrat Shahjalal International Airport (DAC)**\n\n1. Immigration - Have passport & visa ready\n2. SIM Card - Grameenphone/Robi counters (~$3)\n3. Transport to city:\n   • Taxi: ৳800-1200 (45-90 min)\n   • Bus: ৳50-100 (60-120 min)\n4. Currency: Exchange at airport or ATMs\n\n📊 *Data: ESTIMATED - Verify locally*";
    }
    if (msg.includes("budget") || msg.includes("money") || msg.includes("$")) {
      return "**Budget Guide for Bangladesh:**\n\n💰 **Per person/day:**\n• Budget: ৳1,500-2,500 ($14-23)\n• Mid-range: ৳3,000-5,000 ($28-46)\n• Comfort: ৳6,000-10,000 ($55-92)\n\n$500 for 7 days = ~৳54,000\nThis is a **comfortable mid-range budget!**\n\n📊 *Data: ESTIMATED*";
    }
    if (msg.includes("food") || msg.includes("eat") || msg.includes("cuisine")) {
      return "**Bangladesh Food Guide:** 🍛\n\n**Must-Try:**\n1. Biryani - Dhaka's layered rice dish\n2. Hilsha Fish - National fish\n3. Fuchka - Tangy street snack\n4. Panta Bhat - Traditional fermented rice\n5. Tea - World-class tea gardens!\n\n**Budget:** Street ৳50-150, Restaurants ৳300-800\n\n📊 *Data: VERIFIED*";
    }
    if (msg.includes("safe") || msg.includes("emergency") || msg.includes("help")) {
      return "**Safety Information:** 🆘\n\n**Emergency Numbers:**\n• Police/Fire/Ambulance: 999\n• Tourist Police: +880 2 8901555\n\n**Tips:**\n• Use Uber/Pathao for transport\n• Drink bottled water\n• Dress modestly at religious sites\n• Keep copies of documents\n\n📊 *Data: VERIFIED*";
    }
    if (msg.includes("transport") || msg.includes("bus") || msg.includes("train")) {
      return "**Transport Options:** 🚌\n\n**Dhaka → Chattogram:**\n• Bus: ৳600-1500 (5-7 hrs)\n• Train: ৳300-1200 (6-8 hrs)\n• Flight: ৳3500-6000 (45 min)\n\n**Dhaka → Cox's Bazar:**\n• Bus: ৳800-1600 (8-10 hrs)\n• Flight: ৳4000-7000 (55 min)\n\n📊 *Data: ESTIMATED*";
    }
    return "I can help you with:\n\n🗺️ Trip Planning\n🚌 Transport Options\n🏨 Hotels & Stay\n🍛 Food & Cuisine\n💰 Budget Planning\n🆘 Safety & Emergency\n🗣️ Bangla Translation\n\nTry asking:\n• \"Plan a 5-day trip with ৳20,000\"\n• \"How to travel Dhaka to Cox's Bazar?\"\n• \"Best food to try?\"";
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 bg-bangladesh-green text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[340px] md:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-bangladesh-green text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇧🇩</span>
          <div>
            <h3 className="font-semibold text-sm">Travel Assistant</h3>
            <p className="text-xs text-green-100">Always here to help</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] p-3 rounded-xl text-sm",
              msg.role === "user"
                ? "ml-auto bg-bangladesh-green text-white rounded-br-sm"
                : "bg-gray-100 text-gray-800 rounded-bl-sm"
            )}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {isTyping && (
          <div className="bg-gray-100 text-gray-800 p-3 rounded-xl rounded-bl-sm max-w-[85%]">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-bangladesh-green"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-3 py-2 bg-bangladesh-green text-white rounded-lg disabled:opacity-50 hover:bg-bangladesh-green/90 transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
