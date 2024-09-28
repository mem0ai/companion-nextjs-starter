import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react"; // Import the refresh icon
import { Skeleton } from "@/components/ui/skeleton"; // Import the Skeleton component

// MemoriesPanel component for displaying and managing user and agent memories
export function MemoriesPanel({ settings, refreshTrigger }) {
  const [userMemories, setUserMemories] = useState([]);
  const [agentMemories, setAgentMemories] = useState([]);
  const [activeTab, setActiveTab] = useState("user");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update this function to use userId and agentId
  const fetchMemories = useCallback(
    async (isAgent = false) => {
      if (!settings.userId) {
        console.error("User ID is not set");
        return [];
      }

      const idParam = isAgent ? "agent_id" : "user_id";
      const idValue = isAgent ? settings.agentId : settings.userId;

      try {
        const response = await fetch(
          `/api/get?${idParam}=${idValue}&output_format=v1.1`,
          {
            method: "GET",
            headers: { Authorization: `Token ${settings.mem0ApiKey}` },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response from API:", errorData);
          throw new Error("Failed to fetch memories");
        }

        const data = await response.json();
        return (data.results || []).map((item) => item.memory);
      } catch (error) {
        console.error(
          `Error fetching ${isAgent ? "agent" : "user"} memories:`,
          error
        );
        return [];
      }
    },
    [settings.userId, settings.agentId, settings.mem0ApiKey]
  );

  // Refresh both user and agent memories
  const refreshMemories = useCallback(async () => {
    if (!settings.mem0ApiKey || !settings.userId) return;

    setIsRefreshing(true);
    try {
      const [userMems, agentMems] = await Promise.all([
        fetchMemories(),
        fetchMemories(true),
      ]);
      setUserMemories(userMems);
      setAgentMemories(agentMems);
    } catch (error) {
      console.error("Error refreshing memories:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMemories, settings.mem0ApiKey, settings.userId]);

  // Refresh memories when component mounts or refreshTrigger changes
  useEffect(() => {
    refreshMemories();
  }, [refreshMemories, refreshTrigger]);

  // Reusable TabButton component
  const TabButton = ({ label, isActive, onClick }) => (
    <button
      className={`w-1/2 px-4 py-1 ${isActive ? "bg-blue-600" : "bg-gray-700"} ${
        label === "User" ? "rounded-l" : "rounded-r"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  // MemoryList component to render the list of memories
  const MemoryList = () => (
    <ul className="list-none p-0 flex-grow overflow-y-auto">
      {isRefreshing
        ? Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="mb-2 p-2 bg-gray-800 rounded">
              <Skeleton className="w-full h-6" />
            </li>
          ))
        : (activeTab === "user" ? userMemories : agentMemories).map(
            (memory, index) => (
              <li key={index} className="mb-2 p-2 bg-gray-800 rounded">
                {memory}
              </li>
            )
          )}
    </ul>
  );

  return (
    <div className="max-w-3xl mx-auto bg-gray-900 border-2 border-gray-700 h-full text-white p-4 rounded-lg flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Memories</h2>
      {/* Tab buttons for switching between user and agent memories */}
      <div className="flex mb-4 w-full">
        <TabButton
          label="User"
          isActive={activeTab === "user"}
          onClick={() => setActiveTab("user")}
        />
        <TabButton
          label="Agent"
          isActive={activeTab === "agent"}
          onClick={() => setActiveTab("agent")}
        />
      </div>
      {/* Display current ID and refresh button */}
      <div className="text-sm mb-4 flex items-center justify-between">
        <p>
          {activeTab === "user" ? "User" : "Agent"} ID:{" "}
          {activeTab === "user"
            ? settings.userId || "Not set"
            : settings.agentId || "Not set"}
        </p>
        <button
          className="ml-4 px-2 py-1 bg-transparent rounded"
          onClick={refreshMemories}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`w-4 h-4 text-blue-500 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>
      {/* Render the list of memories */}
      <MemoryList />
    </div>
  );
}
