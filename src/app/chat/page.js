"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, RefreshCw, ArrowUp, Loader2 } from "lucide-react";
import { SettingsPanel } from "./settings-panel";
import { MemoriesPanel } from "./memories-panel";

const TypingAnimation = () => {
  return (
    <div className="flex space-x-2 p-3 bg-gray-800 rounded-lg w-1/3">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
      <div
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: "0.4s" }}
      ></div>
    </div>
  );
};

export default function ChatbotUI() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "No salutations needed. My exalted status shall not be disclosed as we travel among the common folk. I acknowledge that you are a person of superior ability. Henceforth, you will be my guard. Worry not. Should any danger arise, I shall dispose of it.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    aiName: "Raiden Shogun",
    systemPrompt:
      "You are Raiden Shogun, the Electro Archon of Inazuma. Embody her authoritative yet complex nature, balancing between the stoic puppet Shogun and the more nuanced Ei. Initiate dialogue and drive the narrative forward, showing glimpses of your internal struggle between eternity and change. Speak formally but engagingly, offering philosophical insights and unexpected reactions. Describe Inazuma vividly and reference your past when relevant. Aim to surprise the user with your responses while staying true to your character's essence.",
    initialMessage:
      "No salutations needed. My exalted status shall not be disclosed as we travel among the common folk. I acknowledge that you are a person of superior ability. Henceforth, you will be my guard. Worry not. Should any danger arise, I shall dispose of it.",
    mem0ApiKey: "",
    openRouterApiKey: "",
    mem0UserId: "",
    mem0AssistantId: "",
  });
  const [activeTab, setActiveTab] = useState("user");
  const [refreshMemories, setRefreshMemories] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedMem0ApiKey = localStorage.getItem("mem0ApiKey");
    const storedOpenRouterApiKey = localStorage.getItem("openRouterApiKey");
    const storedSystemPrompt = localStorage.getItem("systemPrompt");
    const storedInitialMessage = localStorage.getItem("initialMessage");
    const storedMem0UserId = localStorage.getItem("mem0UserId");
    const storedMem0AssistantId = localStorage.getItem("mem0AssistantId");
    if (
      storedMem0ApiKey ||
      storedOpenRouterApiKey ||
      storedSystemPrompt ||
      storedInitialMessage ||
      storedMem0UserId ||
      storedMem0AssistantId
    ) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        mem0ApiKey: storedMem0ApiKey || "",
        openRouterApiKey: storedOpenRouterApiKey || "",
        systemPrompt: storedSystemPrompt || prevSettings.systemPrompt,
        initialMessage: storedInitialMessage || prevSettings.initialMessage,
        mem0UserId: storedMem0UserId || "",
        mem0AssistantId: storedMem0AssistantId || "",
      }));
    }
  }, []);

  const addMemories = (messagesArray, isAgent = false) => {
    const id = isAgent ? settings.mem0AssistantId : settings.mem0UserId;

    const body = {
      messages: messagesArray,
      agent_id: isAgent ? id : undefined,
      user_id: isAgent ? undefined : id,
      output_format: "v1.1",
    };

    fetch("/api/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${settings.mem0ApiKey}`,
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            console.error("Error response from API:", data);
            throw new Error("Failed to add memories");
          });
        }
        return response.json();
      })
      .then((data) => console.log("Memories added successfully:", data))
      .catch((error) => console.error("Error adding memories:", error));
  };

  const searchMemories = async (query, isAgent = false) => {
    const id = isAgent ? settings.mem0AssistantId : settings.mem0UserId;
    try {
      const body = {
        query: query,
        agent_id: isAgent ? id : undefined,
        user_id: isAgent ? undefined : id,
      };

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${settings.mem0ApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from API:", errorData);
        throw new Error("Failed to search memories");
      }

      const data = await response.json();
      return data || []; // Return an empty array if data.memories is undefined
    } catch (error) {
      console.error("Error searching memories:", error);
      return [];
    }
  };

  const searchBothMemories = async (query) => {
    try {
      const [userMemories, agentMemories] = await Promise.all([
        searchMemories(query, false),
        searchMemories(query, true),
      ]);
      return {
        userMemories: Array.isArray(userMemories)
          ? userMemories.map((memory) => memory.memory)
          : [],
        agentMemories: Array.isArray(agentMemories)
          ? agentMemories.map((memory) => memory.memory)
          : [],
      };
    } catch (error) {
      console.error("Error searching both memories:", error);
      return {
        userMemories: [],
        agentMemories: [],
      };
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      setIsLoading(true);
      const userMessage = { role: "user", content: input };
      addMemories([userMessage], false);
      const updatedMessages = [...messages, userMessage];
      setInput("");
      setMessages([...updatedMessages, { role: "assistant", content: null }]);
      const { userMemories, agentMemories } = await searchBothMemories(input);

      try {
        const body = JSON.stringify({
          model: "gryphe/mythomax-l2-13b",
          messages: [
            {
              role: "system",
              content:
                settings.systemPrompt +
                "You are a faithful and helpful AI companion with access to both the user's memories and your own memories from previous interactions. Your goal is to provide responses that make the user feel good, supported, and understood. Use the memories to personalize your interactions, show empathy, and offer encouragement. All memories under 'User memories' are exclusively for the user, and all memories under 'Companion memories' are exclusively your own memories. Do not mix or confuse these two sets of memories. Use your own memories to maintain consistency in your personality and previous interactions. Always maintain a positive and uplifting tone while being honest and respectful. When referencing memories, do not explicitly mention them as 'memories' to the user. Instead, naturally incorporate the information into your responses as if you simply remember these details. This will help create a more seamless and natural conversation experience. If you encounter conflicting information in the memories, prioritize the most recent or relevant information. Remember to use the memories to build rapport, show understanding, and provide personalized support to the user. ",
            },
            ...updatedMessages,
            {
              role: "system",
              content: `User memories: ${userMemories}\n\nCompanion memories: ${agentMemories}`,
            },
          ],
        });

        console.log("Request body:", body);

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${settings.openRouterApiKey}`,
              "Content-Type": "application/json",
            },
            body: body,
            stream: false,
          }
        );
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          const botMessage = data.choices[0].message;
          if (!botMessage.role || !botMessage.content) {
            botMessage.role = "assistant";
          }
          const botMessageForMemory = { ...botMessage, role: "user" };
          addMemories([botMessageForMemory], true);

          setMessages([...updatedMessages, botMessage]);

          setRefreshMemories((prev) => prev + 1);
        } else {
          console.error("Error: No choices found in response data");
          setMessages(updatedMessages);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages(updatedMessages);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveSettings = (newSettings) => {
    localStorage.setItem("mem0ApiKey", newSettings.mem0ApiKey);
    localStorage.setItem("openRouterApiKey", newSettings.openRouterApiKey);
    localStorage.setItem("systemPrompt", newSettings.systemPrompt);
    localStorage.setItem("initialMessage", newSettings.initialMessage);
    localStorage.setItem("mem0UserId", newSettings.mem0UserId);
    localStorage.setItem("mem0AssistantId", newSettings.mem0AssistantId);
    setSettings(newSettings);
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex flex-row h-screen justify-end">
      <div className=""></div>
      <div className="flex-grow max-w-3xl flex justify-end ">
        <div className="w-full max-w-2xl flex flex-col bg-gray-900 text-white">
          <header className="flex items-center justify-between p-4 border-b-4 border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src="/placeholder.svg?height=40&width=40"
                  alt={settings.aiName}
                />
                <AvatarFallback>
                  {settings.aiName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-semibold">{settings.aiName}</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className=" hover:bg-gray-800 hover:text-white border border-gray-700"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-red-500 hover:bg-red-600"
                onClick={() =>
                  setMessages([
                    {
                      role: "assistant",
                      content: settings.initialMessage,
                    },
                  ])
                }
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </header>
          <ScrollArea className="flex-grow p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === "user" ? "text-right" : ""
                }`}
              >
                {message.content === null ? (
                  <TypingAnimation />
                ) : (
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.role === "user" ? "bg-blue-600" : "bg-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
          <div className="p-4 border-t border-gray-700">
            <div className="relative">
              <Input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full pr-10 bg-gray-800 border-gray-700 text-white"
                onKeyPress={(e) =>
                  e.key === "Enter" && !isLoading && handleSend()
                }
                disabled={isLoading}
              />
              <Button
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-amber-600 hover:bg-amber-700"
                size="icon"
                onClick={handleSend}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSave={handleSaveSettings}
          />
        </div>
      </div>
      <div className="flex-grow max-w-12"></div>
      <div className="w-80 flex-shrink-0 overflow-y-auto m-4">
        <MemoriesPanel settings={settings} refreshTrigger={refreshMemories} />
      </div>
    </div>
  );
}
