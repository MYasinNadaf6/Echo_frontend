import { useState, useEffect } from "react";
import "./styles/profile.css";
import axios from "axios";

function Profile({ user, setUser, goBack }) {
  const [blockedUsers, setBlockedUsers] = useState([]);

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/contacts/blocked`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch blocked users:", error);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/upload/profile-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUser((prev) => ({
        ...prev,
        profileImage: res.data.image
      }));

    } catch (err) {
      console.log(err.response?.data);
      alert("Upload failed");
    }
  };

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={goBack}>
        ← Back
      </button>

      <div className="profile-card">

        <h2>Profile</h2>
        <p className="subtitle">Your profile information</p>

        <div className="profile-avatar">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="profile"
              className="avatar-image"
            />
          ) : (
            <div className="avatar-circle">
              {(user?.name || "U")[0].toUpperCase()}
            </div>
          )}

          <label className="camera-icon" style={{ cursor: "pointer" }}>
            📷
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        <div className="profile-field">
          <label>Full Name</label>
          <input value={user?.name || ""} readOnly />
        </div>

        <div className="profile-field">
          <label>Email Address</label>
          <input value={user?.email || ""} readOnly />
        </div>

        <div className="profile-section">
          <h4>Account Information</h4>
          <p><strong>Member Since:</strong> 2024</p>
          <p><strong>Status:</strong> Active</p>
        </div>

        <div className="profile-section" style={{ marginTop: "20px" }}>
          <h4>Blocked Users</h4>
          {blockedUsers.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>No blocked users.</p>
          ) : (
            blockedUsers.map(blockedUser => (
              <div 
                key={blockedUser._id} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  background: "#1f2937",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "8px"
                }}
              >
                <span>{blockedUser.name}</span>

                <button
                  style={{
                    background: "#ef4444",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      await axios.post(
                        `${process.env.REACT_APP_API_URL}/api/contacts/unblock/${blockedUser._id}`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      fetchBlockedUsers(); // Refresh the list after unblocking
                    } catch (err) {
                      console.error("Failed to unblock user", err);
                    }
                  }}
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>

        <button className="logout-btn" style={{ marginTop: "20px" }} onClick={handleLogout}>
          Logout
        </button>

      </div>
    </div>
  );
}

export default Profile;