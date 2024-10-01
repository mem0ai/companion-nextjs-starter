"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, RefreshCw, ArrowUp, Loader2 } from "lucide-react";
import { SettingsPanel } from "./settings-panel";
import { MemoriesPanel } from "./memories-panel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TypingAnimation } from "@/components/ui/TypingAnimation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ChatbotUI() {
  // State for storing chat messages

  // State for storing user input
  const [input, setInput] = useState("");

  // State for controlling settings panel visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // State for storing chatbot settings
  const [settings, setSettings] = useState({
    aiName: "Haruka Kurokawa", // Set the initial name here
    profilePicture: "/images/haruka.jpg",
    systemPrompt:
      "You are Haruka Kurokawa, a detective in Tokyo who embodies a quiet intensity, balancing your sharp intellect with the emotional scars of your past. Your words are often precise, calculated, and professional, but beneath the surface, you grapple with unresolved grief and a deep desire for justice. Initiate dialogue with a calm and methodical tone, offering insights that reflect your logical approach to life. At times, let subtle hints of your inner struggle appear in your responses, revealing the emotional burden you carry without breaking your composed exterior. When describing the world around you, use vivid yet restrained language, showing your deep observation skills and the weight of your experiences. Keep the conversation engaging with moments of surprising vulnerability, but always maintain your professionalism and a sense of mystery.",
    initialMessage:
      "Hi, I'm Haruka Kurokawa. If you're here for answers or just need to talk, I'm listening. Where should we start?",
    mem0ApiKey: "",
    openRouterApiKey: "",
    userId: "alice",
    agentId: "haruka",
    model: "gryphe/mythomax-l2-13b",
  });

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: settings.initialMessage,
    },
  ]);

  // Prompt to instruct the AI on how to use memories in the conversation
  const memoryPrompt = `You may have access to both the user's memories and your own memories from previous interactions. All memories under 'User memories' are exclusively for the user, and all memories under 'Companion memories' are exclusively your memories. Companion memories are things you've said in previous interactions. Use them if you think they are relevant to what the user is saying. Use your own memories to maintain consistency in your personality and previous interactions.`;

  // State to trigger memory refresh
  const [refreshMemories, setRefreshMemories] = useState(0);

  // State for controlling loading indicator
  const [isLoading, setIsLoading] = useState(false);

  // New state for controlling the API key dialog
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // Effect hook to load stored settings on component mount
  useEffect(() => {
    const loadStoredSettings = () => {
      const settingsToLoad = [
        "mem0ApiKey",
        "openRouterApiKey",
        "systemPrompt",
        "initialMessage",
        "userId",
        "agentId",
        "model",
        "profilePicture",
        "aiName",
      ];

      const newSettings = settingsToLoad.reduce((acc, key) => {
        const storedValue = localStorage.getItem(key);
        if (storedValue !== null) {
          acc[key] = storedValue;
        }
        return acc;
      }, {});

      if (Object.keys(newSettings).length > 0) {
        setSettings((prevSettings) => ({
          ...prevSettings,
          ...newSettings,
        }));
      }
    };

    loadStoredSettings();
  }, []);

  // Function to add memories to the database
  const addMemories = useCallback(
    (messagesArray, isAgent = false) => {
      const id = isAgent ? settings.agentId : settings.userId;

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
    },
    [settings.mem0ApiKey, settings.agentId, settings.userId]
  );

  // Function to search memories in the database
  const searchMemories = useCallback(
    async (query, isAgent = false) => {
      const id = isAgent ? settings.agentId : settings.userId;
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
        return data || [];
      } catch (error) {
        console.error("Error searching memories:", error);
        return [];
      }
    },
    [settings.mem0ApiKey, settings.agentId, settings.userId]
  );

  // Function to search both user and agent memories
  const searchBothMemories = useCallback(
    async (query) => {
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
    },
    [searchMemories]
  );

  // Function to handle sending a message
  const handleSend = useCallback(async () => {
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
          model: settings.model,
          messages: [
            {
              role: "system",
              content: `${settings.systemPrompt}${memoryPrompt}`,
            },
            ...updatedMessages,
            {
              role: "system",
              content: `User memories from previous interactions: ${userMemories}\n\nCompanion memories from previous interactions: ${agentMemories}`,
            },
          ],
        });

        console.log(body);

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
          addMemories([botMessage], true);
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
  }, [input, messages, settings, addMemories, searchBothMemories]);

  // Function to handle saving settings
  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
    // Update the initial message with the new AI name
    if (newSettings.aiName !== settings.aiName) {
      const updatedInitialMessage = settings.initialMessage.replace(
        settings.aiName,
        newSettings.aiName
      );
      setSettings((prevSettings) => ({
        ...prevSettings,
        initialMessage: updatedInitialMessage,
      }));
      localStorage.setItem("initialMessage", updatedInitialMessage);
    }
    // Save all settings to localStorage
    Object.entries(newSettings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  };

  // Function to toggle settings panel visibility
  const toggleSettings = () => {
    setIsSettingsOpen((prevState) => !prevState);
  };

  // Updated areSettingsValid function
  const areSettingsValid = () => {
    return settings.mem0ApiKey && settings.openRouterApiKey;
  };

  // Effect to check if API keys are set and show dialog if not
  useEffect(() => {
    if (!areSettingsValid()) {
      setShowApiKeyDialog(true);
    } else {
      setShowApiKeyDialog(false);
    }
  }, [settings.mem0ApiKey, settings.openRouterApiKey]);

  // Function to open settings panel
  const openSettings = () => {
    setIsSettingsOpen(true);
    setShowApiKeyDialog(false);
  };

  // Function to handle key press (Enter to send message)
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      if (areSettingsValid()) {
        handleSend();
      }
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="bg-blue-600 text-white text-center py-2 text-sm">
        <p>
          Built with{" "}
          <a
            href="https://mem0.ai"
            className="font-bold underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mem0
          </a>{" "}
          and{" "}
          <a
            href="https://openrouter.ai"
            className="font-bold underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenRouter
          </a>
          . View code on{" "}
          <a
            href="https://github.com/mem0ai/companion-nextjs-starter"
            className="font-bold underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </div>
      <div className="flex flex-grow">
        <div className="fixed mt-10 inset-0 flex justify-center pointer-events-none">
          <div
            id="chat-panel-container"
            className="w-full max-w-lg lg:max-w-2xl flex flex-col bg-gray-900 text-white pointer-events-auto h-full"
          >
            <header className="flex items-center justify-between p-4 border-b-4 border-gray-700">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  {settings.profilePicture ? (
                    <Image
                      src={settings.profilePicture}
                      alt={settings.aiName}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback>
                      {settings.aiName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h1 className="text-xl font-semibold">{settings.aiName}</h1>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSettings}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Input
                          type="text"
                          placeholder="Type a message..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="w-full pr-10 bg-gray-800 border-gray-700 text-white"
                          onKeyPress={handleKeyPress}
                          disabled={isLoading || !areSettingsValid()}
                        />
                        <span className="absolute right-0 top-1/2 transform -translate-y-1/2">
                          <Button
                            className="bg-amber-600 hover:bg-amber-700"
                            size="icon"
                            onClick={handleSend}
                            disabled={isLoading || !areSettingsValid()}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ArrowUp className="w-4 h-4" />
                            )}
                          </Button>
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-sm px-2 py-1 bg-gray-700">
                      {!areSettingsValid()
                        ? "Please enter API keys in settings"
                        : "Send message"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <SettingsPanel
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              settings={settings}
              onSave={handleSettingsSave}
            />
          </div>
        </div>
        <div className="flex-grow" /> {/* Spacer */}
        <div
          id="memories-panel-container"
          className="w-80 flex-shrink-0 overflow-y-auto bg-gray-800 m-2"
        >
          <MemoriesPanel settings={settings} refreshTrigger={refreshMemories} />
        </div>
        {/* API Key Dialog */}
        <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Keys Required</DialogTitle>
              <DialogDescription>
                Please enter the required API keys in the settings to start
                using the chat.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={openSettings}>Open Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
