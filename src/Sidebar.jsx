import React from "react";

function Sidebar({ contacts, activeContact, setActiveContact, onlineUsers }) {
  return (
    <div className="sidebar">
      <h4>Contacts</h4>

      {contacts.map(contact => (
        <div
          key={contact._id}
          style={{
            padding: "10px",
            marginTop: "10px",
            background:
              activeContact?._id === contact._id ? "#1f2937" : "transparent",
            cursor: "pointer",
            borderRadius: "6px"
          }}
          onClick={() => setActiveContact(contact)}
        >
          {contact.name}

          {onlineUsers.includes(contact._id) && (
            <span style={{ color: "#22c55e", marginLeft: "8px" }}>●</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;