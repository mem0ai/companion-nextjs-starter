import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

// SettingsPanel component for managing user settings
export function SettingsPanel({ isOpen, onClose, settings, onSave }) {
  // State to manage form inputs and visibility toggles
  const [formState, setFormState] = useState({
    showMem0ApiKey: false,
    showOpenRouterApiKey: false,
    mem0ApiKey: "",
    openRouterApiKey: "",
    mem0UserId: "",
    mem0AssistantId: "",
  });

  // Memoized function to handle input changes
  const handleChange = useCallback((id, value) => {
    setFormState((prev) => ({ ...prev, [id]: value }));
  }, []);

  // Effect to load stored values from localStorage on component mount
  useEffect(() => {
    const storedValues = [
      "mem0ApiKey",
      "openRouterApiKey",
      "mem0UserId",
      "mem0AssistantId",
    ].reduce((acc, key) => {
      const value = localStorage.getItem(key);
      return value ? { ...acc, [key]: value } : acc;
    }, {});

    setFormState((prev) => ({ ...prev, ...storedValues }));
  }, []);

  // Effect to handle 'Escape' key press for closing the panel
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

  // Function to save settings to localStorage and call onSave prop
  const handleSaveSettings = (newSettings) => {
    localStorage.setItem("mem0ApiKey", newSettings.mem0ApiKey);
    localStorage.setItem("openRouterApiKey", newSettings.openRouterApiKey);
    localStorage.setItem("systemPrompt", newSettings.systemPrompt);
    localStorage.setItem("initialMessage", newSettings.initialMessage);
    localStorage.setItem("mem0UserId", newSettings.mem0UserId);
    localStorage.setItem("mem0AssistantId", newSettings.mem0AssistantId);
    onSave(newSettings);
  };

  // Updated handleSubmit function
  const handleSubmit = (e) => {
    e.preventDefault();
    const newSettings = formFields.reduce((acc, field) => {
      acc[field.id] = formState[field.id] || settings[field.id] || "";
      return acc;
    }, {});
    newSettings.profilePicture = profilePicture;
    handleSaveSettings(newSettings);
  };

  // Configuration for form fields
  const formFields = [
    {
      id: "aiName",
      label: "",
      type: "custom",
      render: () => (
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <label htmlFor="profilePicture" className="cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-2xl">+</span>
                )}
              </div>
            </label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureUpload}
            />
          </div>
          <div className="flex-grow">
            <Input
              id="aiName"
              name="aiName"
              value={formState.aiName || settings.aiName || ""}
              onChange={(e) => handleChange("aiName", e.target.value)}
              className="w-full bg-gray-700 text-sm"
            />
          </div>
        </div>
      ),
    },
    { id: "systemPrompt", label: "System Prompt", type: "textarea" },
    {
      id: "initialMessage",
      label: "Initial Message",
      type: "textarea",
      height: "h-16",
    },
    {
      id: "mem0ApiKey",
      label: "Mem0 API Key*",
      type: "password",
      getSubLabel: "https://mem0.dev/api-keys-nca",
    },
    {
      id: "openRouterApiKey",
      label: "OpenRouter API Key*",
      type: "password",
      getSubLabel: "https://openrouter.ai/settings/keys",
    },
    { id: "mem0UserId", label: "Mem0 User ID*", type: "input" },
    { id: "mem0AssistantId", label: "Mem0 Agent ID*", type: "input" },
    {
      id: "model",
      label: "AI Model",
      type: "input",
      getSubLabel: "https://openrouter.ai/models",
    },
  ];

  const [profilePicture, setProfilePicture] = useState(settings.profilePicture);

  const handleProfilePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
        handleChange("profilePicture", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 w-full sm:w-96 h-full bg-gray-800 rounded-l-xl text-white text-sm shadow-lg flex flex-col"
    >
      <div className="px-4 py-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        <div className="px-4 py-2">
          <form onSubmit={handleSubmit} className="space-y-[22px]">
            {formFields.map(
              ({ id, label, type, getSubLabel, height, render }) => (
                <div key={id}>
                  <label
                    htmlFor={id}
                    className="block mb-1 text-sm font-medium"
                  >
                    {label}
                    {getSubLabel && (
                      <a
                        href={getSubLabel}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        {id === "model" ? "View models" : "Get API Key"}
                      </a>
                    )}
                  </label>
                  {type === "custom" ? (
                    render()
                  ) : type === "textarea" ? (
                    <Textarea
                      id={id}
                      name={id}
                      value={formState[id] || settings[id] || ""}
                      onChange={(e) => handleChange(id, e.target.value)}
                      className={`w-full bg-gray-700 text-sm ${
                        height || "h-24"
                      }`}
                    />
                  ) : (
                    <div className="relative">
                      <Input
                        id={id}
                        name={id}
                        type={
                          type === "password" && !formState[`show${id}`]
                            ? "password"
                            : "text"
                        }
                        value={formState[id] || settings[id] || ""}
                        onChange={(e) => handleChange(id, e.target.value)}
                        className="w-full bg-gray-700 text-sm pr-8"
                      />
                      {type === "password" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2"
                          onClick={() =>
                            handleChange(`show${id}`, !formState[`show${id}`])
                          }
                        >
                          {formState[`show${id}`] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </form>
        </div>
      </div>
      <div className="p-4 border-t border-gray-700">
        <Button
          type="submit"
          className="w-full bg-amber-600 hover:bg-amber-700 text-sm"
          onClick={handleSubmit}
        >
          Save
        </Button>
      </div>
    </motion.div>
  );
}
