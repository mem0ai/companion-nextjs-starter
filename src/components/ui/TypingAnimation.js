export const TypingAnimation = () => {
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
