import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react"; // Import the refresh icon
import { Skeleton } from "@/components/ui/skeleton"; // Import the Skeleton component

export function MemoriesPanel({ settings, refreshTrigger }) {
  const [userMemories, setUserMemories] = useState([]);
  const [agentMemories, setAgentMemories] = useState([]);
  const [activeTab, setActiveTab] = useState("user");
  const [isRefreshing, setIsRefreshing] = useState(false); // Add state for loading

  const fetchMemories = async (isAgent = false) => {
    try {
      if (!settings.mem0UserId) {
        console.error("User ID is not set");
        return [];
      }

      const idParam = isAgent ? "agent_id" : "user_id";
      const idValue = isAgent ? settings.mem0AssistantId : settings.mem0UserId;
      const response = await fetch(
        `/api/get?${idParam}=${idValue}&output_format=v1.1`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${settings.mem0ApiKey}`,
          },
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
  };

  const refreshMemories = async () => {
    setIsRefreshing(true); // Set loading state to true
    if (activeTab === "user") {
      await fetchMemories().then(setUserMemories);
    } else {
      await fetchMemories(true).then(setAgentMemories);
    }
    setIsRefreshing(false); // Set loading state to false
  };

  useEffect(() => {
    if (settings.mem0ApiKey && settings.mem0UserId) {
      fetchMemories().then(setUserMemories);
      fetchMemories(true).then(setAgentMemories);
    }
  }, [settings.mem0ApiKey, settings.mem0UserId, refreshTrigger]);

  return (
    <div className="max-w-3xl mx-auto bg-gray-900 border-2 border-gray-700 h-full text-white p-4 rounded-lg flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Memories</h2>
      <div className="flex mb-4 w-full">
        <button
          className={`w-1/2 px-4 py-1 rounded-l ${
            activeTab === "user" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveTab("user")}
        >
          User
        </button>
        <button
          className={`w-1/2 px-4 py-1 rounded-r ${
            activeTab === "agent" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveTab("agent")}
        >
          Agent
        </button>
      </div>
      <div className="text-sm mb-4 flex items-center justify-between">
        {activeTab === "user" ? (
          <p>User ID: {settings.mem0UserId || "Not set"}</p>
        ) : (
          <p>Agent ID: {settings.mem0AssistantId || "Not set"}</p>
        )}
        <button
          className="ml-4 px-2 py-1 bg-transparent rounded"
          onClick={refreshMemories}
          disabled={isRefreshing} // Disable button while refreshing
        >
          <RefreshCw
            className={`w-4 h-4 text-blue-500 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>
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
    </div>
  );
}
