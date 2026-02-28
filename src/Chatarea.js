import React from "react";

function ChatArea({ activeContact, messages }) {
  if (!activeContact) {
    return (
      <div className="chat-area" style={{
        justifyContent: "center",
        alignItems: "center"
      }}>
        <h2>Welcome to Echo!</h2>
        <p>Select a conversation from the sidebar to start chatting</p>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i}>{msg.decrypted}</div>
        ))}
      </div>
    </div>
  );
}

export default ChatArea;
