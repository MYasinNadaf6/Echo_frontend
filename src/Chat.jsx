import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import CryptoJS from "crypto-js";
import "./styles/layout.css";
import "./chat.css";
import Profile from "./Profile";
import AddContactModal from "./components/AddContactModal";

// 🔔 STEP 2: Import Sound
// 🔔 Import your logo (make sure the filename matches what you put in the assets folder!)
import logo from "./assets/logo.png";
import notificationSound from "./assets/notification.mp3";

const socket = io(process.env.REACT_APP_API_URL, {
  auth: {
    token: localStorage.getItem("token")
  }
});

function Chat({ user, setUser }) {
  const [view, setView] = useState("chat");
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  
  // 🔔 STEP 3: Create Audio Object
  const audioRef = useRef(new Audio(notificationSound));
  
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  // 🔥 NEW STATES for Images and Uploads
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchConversations();
  }, []);

  // 🔥 Receive Message Rendering
  useEffect(() => {
    socket.on("receiveMessage", async (msg) => {
      
      if (activeContact?._id !== msg.sender) {
        audioRef.current.play().catch(err => console.log("Audio play blocked by browser", err));

        setUnreadCounts(prev => ({
          ...prev,
          [msg.sender]: (prev[msg.sender] || 0) + 1
        }));
      }

      await fetchConversations(); 

      if (!activeContact || !conversation) return;

      if (
        msg.sender !== activeContact._id &&
        msg.receiver !== activeContact._id
      ) return;

      if (!msg.messageType || msg.messageType === "text") {
        try {
          const decrypted = CryptoJS.AES.decrypt(
            msg.encryptedMessage,
            conversation.secretKey
          ).toString(CryptoJS.enc.Utf8);
          msg.decrypted = decrypted;
        } catch (err) {
          msg.decrypted = "Error decrypting message";
        }
      }

      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");

  }, [activeContact, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const startConversation = async (selectedId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [selectedId]: 0
    }));

    const token = localStorage.getItem("token");

    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/conversations`,
      { receiverId: selectedId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setConversation(res.data);

    const msgRes = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/messages/${selectedId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const decryptedMessages = msgRes.data.map((msg) => {
      if (!msg.messageType || msg.messageType === "text") {
        try {
          msg.decrypted = CryptoJS.AES.decrypt(
            msg.encryptedMessage,
            res.data.secretKey
          ).toString(CryptoJS.enc.Utf8);
        } catch (err) {
          msg.decrypted = "Error decrypting message";
        }
      }
      return msg;
    });

    setMessages(decryptedMessages);
  };

  const sendMessage = async () => {
    if (!conversation || !message.trim()) return;

    const encrypted = CryptoJS.AES.encrypt(
      message,
      conversation.secretKey
    ).toString();

    setMessages((prev) => [
      ...prev,
      {
        sender: user?._id,
        encryptedMessage: encrypted,
        decrypted: message,
        messageType: "text"
      }
    ]);

    socket.emit("sendMessage", {
      senderId: user?._id,
      receiverId: activeContact._id,
      encryptedMessage: encrypted,
      messageType: "text"
    });

    await fetchConversations(); 
    setMessage("");
  };

  // 🔥 Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large (Max 10MB)");
      e.target.value = null;
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/chat-upload`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        }
      );

      setUploadProgress(0); 

      const messageType = file.type.startsWith("image") ? "image" : "file";

      const newMessage = {
        sender: user?._id,
        receiver: activeContact._id,
        messageType,
        fileUrl: res.data.fileUrl,
        fileName: res.data.fileName
      };

      setMessages((prev) => [...prev, newMessage]);

      socket.emit("sendMessage", {
        senderId: user._id,
        receiverId: activeContact._id,
        encryptedMessage: "",
        messageType,
        fileUrl: res.data.fileUrl,
        fileName: res.data.fileName
      });

      await fetchConversations();
    } catch (err) {
      console.error("File upload failed:", err);
      setUploadProgress(0); 
    }
    
    e.target.value = null;
  };

  // 🔥 THE FIX: Bulletproof function to force the browser to download!
  const forceDownload = async (e, fileUrl, fileName) => {
    e.stopPropagation(); 
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || fileUrl); 
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <div className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
         <img 
  src={logo} 
  alt="Echo Logo" 
  style={{ width: "35px", height: "35px", borderRadius: "8px", objectFit: "cover" }} 
/>
          <h3>Echo</h3>
        </div>
      </div>

      {/* CONDITIONAL RENDERING FOR PROFILE VS CHAT */}
      {view === "profile" ? (
        <Profile
          user={user}
          setUser={setUser}
          goBack={() => setView("chat")}
        />
      ) : (
        <div className="main-content">
          {/* Sidebar */}
<div className={`sidebar ${activeContact ? "mobile-hidden" : ""}`}>            <div className="sidebar-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Messages</h3>
                <button 
                  className="add-contact-btn"
                  onClick={() => setShowAddModal(true)}
                >
                  + Add Contact
                </button>
              </div>
            </div>

            <div className="search-box">
              <input placeholder="Search contacts..." />
            </div>

            {/* MERGED CONTACTS & CONVERSATIONS LIST */}
            <div className="contact-list">
              {contacts
                .map(contact => {
                  const conv = conversations.find(c => 
                    c.participants.some(p => p._id === contact._id)
                  );
                  return { contact: contact, conv: conv };
                })
                .sort((a, b) => {
                  const timeA = new Date(a.conv?.lastMessageTime || a.conv?.updatedAt || 0).getTime();
                  const timeB = new Date(b.conv?.lastMessageTime || b.conv?.updatedAt || 0).getTime();
                  return timeB - timeA;
                })
                .map(({ contact: otherUser, conv }) => (
                  <div
                    key={otherUser._id}
                    className="contact-item"
                    onClick={() => {
                      setActiveContact(otherUser);
                      startConversation(otherUser._id);
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      
                      {/* LEFT SIDE (Avatar + Name) */}
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1, minWidth: 0 }}>
                        
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          {otherUser.profileImage ? (
                            <img
                              src={otherUser.profileImage}
                              className="sidebar-avatar-img"
                              alt="dp"
                            />
                          ) : (
                            <div className="avatar">
                              {otherUser.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* UNREAD BADGE */}
                          {unreadCounts[otherUser._id] > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "-5px",
                              right: "-5px",
                              background: "#ef4444",
                              color: "white",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              border: "2px solid #111827"
                            }}>
                              {unreadCounts[otherUser._id]}
                            </div>
                          )}
                        </div>

                        {/* TEXT PREVIEW WITH DECRYPTION AND ELLIPSIS */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {otherUser.name}
                          </div>
                          <small style={{ 
                            color: "#9ca3af",
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "100%"
                          }}>
                            {(() => {
                              if (!conv?.lastMessage) return "No messages";
                              try {
                                const decryptedPreview = CryptoJS.AES.decrypt(
                                  conv.lastMessage,
                                  conv.secretKey
                                ).toString(CryptoJS.enc.Utf8);
                                
                                return decryptedPreview || "Attachment 📎"; 
                              } catch (error) {
                                return "Attachment 📎"; 
                              }
                            })()}
                          </small>
                        </div>

                      </div>

                      {/* 3-DOT MENU WITH DROPDOWN */}
                      <div style={{ position: "relative", flexShrink: 0, marginLeft: "10px" }}>
                        <button
                          style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px", padding: "5px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === otherUser._id ? null : otherUser._id);
                          }}
                        >
                          ⋮
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === otherUser._id && (
                          <div style={{
                            position: "absolute",
                            right: 0,
                            top: "100%",
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                            zIndex: 10,
                            overflow: "hidden",
                            minWidth: "130px" 
                          }}>
                            <button
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "10px 15px",
                                background: "none",
                                border: "none",
                                color: "#ef4444", 
                                cursor: "pointer",
                                textAlign: "left",
                                whiteSpace: "nowrap"
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActiveMenuId(null); 

                                const token = localStorage.getItem("token");
                                await axios.delete(
                                  `${process.env.REACT_APP_API_URL}/api/contacts/${otherUser._id}`,
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );

                                fetchContacts();
                                fetchConversations();
                                
                                if (activeContact?._id === otherUser._id) {
                                  setActiveContact(null);
                                  setConversation(null);
                                  setMessages([]);
                                }
                              }}
                            >
                              🗑 Delete Contact
                            </button>

                            <button
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "10px 15px",
                                background: "none",
                                border: "none",
                                color: "#f59e0b", 
                                cursor: "pointer",
                                textAlign: "left",
                                whiteSpace: "nowrap",
                                borderTop: "1px solid #374151"
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);

                                const token = localStorage.getItem("token");
                                await axios.post(
                                  `${process.env.REACT_APP_API_URL}/api/contacts/block/${otherUser._id}`,
                                  {},
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );

                                fetchContacts();
                                fetchConversations();
                                
                                if (activeContact?._id === otherUser._id) {
                                  setActiveContact(null);
                                  setConversation(null);
                                  setMessages([]);
                                }
                              }}
                            >
                              🚫 Block
                            </button>

                            <button
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "10px 15px",
                                background: "none",
                                border: "none",
                                color: "#a855f7", 
                                cursor: "pointer",
                                textAlign: "left",
                                whiteSpace: "nowrap",
                                borderTop: "1px solid #374151"
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActiveMenuId(null); 

                                const token = localStorage.getItem("token");
                                try {
                                  await axios.delete(
                                    `${process.env.REACT_APP_API_URL}/api/conversations/${otherUser._id}`,
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  
                                  fetchConversations();

                                  if (activeContact?._id === otherUser._id) {
                                    setActiveContact(null);
                                    setConversation(null);
                                    setMessages([]);
                                  }
                                } catch (err) {
                                  console.error("Error deleting chat:", err);
                                }
                              }}
                            >
                              💬 Delete Chat
                            </button>

                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Profile Footer */}
            <div className="sidebar-footer">
              <div
                className="sidebar-user"
                onClick={() => setView("profile")}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
              >
                
                {/* AVATAR DISPLAY LOGIC HERE */}
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    className="sidebar-avatar-img"
                    alt="dp"
                  />
                ) : (
                  <div className="avatar">
                    {(user?.name || "U")[0].toUpperCase()}
                  </div>
                )}

                <div>
                  <p style={{ margin: "0 0 2px 0" }}>{user?.name || "Unknown User"}</p>
                  <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>
                    {user?.email || "No email provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
<div className={`chat-area ${!activeContact ? "mobile-hidden" : ""}`}>            {!activeContact ? (
              <div style={{
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column"
}}>
  {/* 🔥 Logo added to welcome screen */}
  <img 
    src={logo} 
    alt="Echo Logo" 
    style={{ width: "120px", height: "120px", borderRadius: "25px", marginBottom: "20px", objectFit: "cover", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }} 
  />
  <h2>Welcome to Echo!</h2>
  <p style={{ color: "#9ca3af" }}>Select a conversation from the sidebar to start chatting</p>
</div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="chat-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {activeContact?.profileImage ? (
                      <img
                        src={activeContact.profileImage}
                        className="sidebar-avatar-img"
                        alt="dp"
                      />
                    ) : (
                      <div className="avatar">
                        {activeContact?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h4 style={{ margin: 0 }}>{activeContact?.name}</h4>
                  </div>

                  <button
                    className="exit-chat-btn"
                    onClick={() => {
                      setActiveContact(null);
                      setConversation(null);
                      setMessages([]);
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Messages */}
                <div className="messages">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${
                        msg.sender === user?._id ? "sent" : "received"
                      }`}
                    >
                      {(!msg.messageType || msg.messageType === "text") && msg.decrypted}

                      {/* 🔥 NEW UI WITH PROPER API DOWNLOAD BUTTON ADDED HERE */}
                      {msg.messageType === "image" && (
                        <div className="image-wrapper" style={{ position: "relative", display: "inline-block" }}>
                          <img
                            src={msg.fileUrl}
                            className="chat-image"
                            alt="img"
                            onClick={() => setPreviewImage(msg.fileUrl)}
                          />
                          
                          {/* Render Download button ONLY if the user received the image */}
                          {msg.sender !== user?._id && (
                            <button
                              onClick={(e) => forceDownload(e, msg.fileUrl, msg.fileName)} 
                              style={{
                                position: "absolute",
                                bottom: "12px",
                                right: "12px",
                                background: "rgba(0, 0, 0, 0.6)",
                                color: "white",
                                padding: "6px 8px",
                                borderRadius: "50%",
                                textDecoration: "none",
                                fontSize: "14px",
                                cursor: "pointer",
                                border: "1px solid rgba(255,255,255,0.3)",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                              }}
                              title="Download Image"
                            >
                              ⬇️
                            </button>
                          )}
                        </div>
                      )}

                      {msg.messageType === "file" && (
                        <div className="file-bubble">
                          <span
                            onClick={(e) => forceDownload(e, msg.fileUrl, msg.fileName)}
                            style={{ color: "#60a5fa", cursor: "pointer", textDecoration: "underline" }}
                            title="Download File"
                          >
                            📄 {msg.fileName}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Input Area */}
                <div className="message-input" style={{ position: "relative" }}>
                  
                  {/* UPLOAD BAR */}
                  {uploadProgress > 0 && (
                    <div className="upload-bar">
                      Uploading {uploadProgress}%
                    </div>
                  )}

                  <input
                    type="file"
                    id="fileInput"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                  
                  <button 
                    onClick={() => document.getElementById("fileInput").click()}
                    style={{ background: 'none', padding: '0 10px', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
                  >
                    📎
                  </button>
                  
                  <input
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button onClick={sendMessage}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* EXPANDED IMAGE MODAL */}
      {previewImage && (
        <div className="image-modal" onClick={() => setPreviewImage(null)}>
          <img
            src={previewImage}
            className="image-modal-content"
            alt="preview"
          />
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          closeModal={() => setShowAddModal(false)}
          refreshContacts={() => {
            fetchContacts();
            fetchConversations();
          }}
        />
      )}
    </div>
  );
}

export default Chat;