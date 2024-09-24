import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SettingsPanel({ isOpen, onClose, settings, onSave }) {
  const [showMem0ApiKey, setShowMem0ApiKey] = useState(false);
  const [showOpenRouterApiKey, setShowOpenRouterApiKey] = useState(false);
  const [mem0ApiKey, setMem0ApiKey] = useState("");
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [mem0UserId, setMem0UserId] = useState("");
  const [mem0AssistantId, setMem0AssistantId] = useState("");

  useEffect(() => {
    const storedMem0ApiKey = localStorage.getItem("mem0ApiKey");
    const storedOpenRouterApiKey = localStorage.getItem("openRouterApiKey");
    const storedMem0UserId = localStorage.getItem("mem0UserId");
    const storedMem0AssistantId = localStorage.getItem("mem0AssistantId");
    if (storedMem0ApiKey) setMem0ApiKey(storedMem0ApiKey);
    if (storedOpenRouterApiKey) setOpenRouterApiKey(storedOpenRouterApiKey);
    if (storedMem0UserId) setMem0UserId(storedMem0UserId);
    if (storedMem0AssistantId) setMem0AssistantId(storedMem0AssistantId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSettings = {
      aiName: formData.get("aiName"),
      systemPrompt: formData.get("systemPrompt"),
      initialMessage: formData.get("initialMessage"),
      mem0ApiKey: formData.get("mem0ApiKey"),
      openRouterApiKey: formData.get("openRouterApiKey"),
      mem0UserId: formData.get("mem0UserId"),
      mem0AssistantId: formData.get("mem0AssistantId"),
    };
    Object.entries(newSettings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    onSave(newSettings);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 w-full sm:w-96 h-full bg-gray-800 rounded-l-xl text-white text-sm p-4 shadow-lg overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-[22px]">
        {[
          { id: "aiName", label: "AI Name", type: "input" },
          { id: "systemPrompt", label: "System Prompt", type: "textarea" },
          { id: "initialMessage", label: "Initial Message", type: "textarea" },
          { id: "mem0ApiKey", label: "Mem0 API Key", type: "password" },
          {
            id: "openRouterApiKey",
            label: "OpenRouter API Key",
            type: "password",
          },
          { id: "mem0UserId", label: "Mem0 User ID", type: "input" },
          { id: "mem0AssistantId", label: "Mem0 Assistant ID", type: "input" },
        ].map(({ id, label, type }) => (
          <div key={id}>
            <label htmlFor={id} className="block mb-1 text-sm font-medium">
              {label}
            </label>
            {type === "textarea" ? (
              <Textarea
                id={id}
                name={id}
                defaultValue={settings[id]}
                className="w-full h-24 bg-gray-700 text-sm"
              />
            ) : (
              <div className="relative">
                <Input
                  id={id}
                  name={id}
                  type={
                    type === "password" && !showMem0ApiKey ? "password" : "text"
                  }
                  value={
                    type === "password"
                      ? id === "mem0ApiKey"
                        ? mem0ApiKey
                        : openRouterApiKey
                      : id === "mem0UserId"
                      ? mem0UserId
                      : id === "mem0AssistantId"
                      ? mem0AssistantId
                      : settings[id]
                  }
                  onChange={(e) => {
                    if (type === "password") {
                      id === "mem0ApiKey"
                        ? setMem0ApiKey(e.target.value)
                        : setOpenRouterApiKey(e.target.value);
                    } else if (id === "mem0UserId") {
                      setMem0UserId(e.target.value);
                    } else if (id === "mem0AssistantId") {
                      setMem0AssistantId(e.target.value);
                    }
                  }}
                  className="w-full bg-gray-700 text-sm pr-8"
                />
                {type === "password" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={() =>
                      id === "mem0ApiKey"
                        ? setShowMem0ApiKey(!showMem0ApiKey)
                        : setShowOpenRouterApiKey(!showOpenRouterApiKey)
                    }
                  >
                    {(
                      id === "mem0ApiKey"
                        ? showMem0ApiKey
                        : showOpenRouterApiKey
                    ) ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        <Button
          type="submit"
          className="w-full bg-amber-600 hover:bg-amber-700 text-sm"
        >
          Save
        </Button>
      </form>
    </motion.div>
  );
}
