import { useState } from "react";
import axios from "axios";

function AddContactModal({ closeModal, refreshContacts }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/contacts/add",
        { phone },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Contact added!");
      refreshContacts();
      closeModal();

    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>Add Contact</h3>

        <input
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button onClick={handleAdd}>
            {loading ? "Adding..." : "Add"}
          </button>
          <button onClick={closeModal}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const modalStyle = {
  background: "#111827",
  padding: "30px",
  borderRadius: "12px",
  width: "350px"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #374151",
  background: "#1f2937",
  color: "white"
};

export default AddContactModal;