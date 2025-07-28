import React, { useState } from 'react';

interface Message {
  id: string;
  text: string;
  username: string;
  timestamp: Date;
}

interface ChatBoxProps {
  messages: Message[];
  sendMessage: (text: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, sendMessage }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="text-sm">
            <span className="font-bold">{message.username}:</span> {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-2 border-t">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="w-full p-2 border rounded"
        />
      </form>
    </div>
  );
};

export default ChatBox; 