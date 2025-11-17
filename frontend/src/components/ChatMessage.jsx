export default function ChatMessage({ message, isUser }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        {!isUser && <div className="text-xs text-gray-500 mb-1">🤖 MoodBot</div>}
        <p className="text-sm whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}