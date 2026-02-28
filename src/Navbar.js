import React from "react";
import "../styles/layout.css";

function Navbar({ user, setView }) {
  return (
    <div className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "35px",
          height: "35px",
          background: "#a4adba",
          borderRadius: "8px"
        }}></div>
        <h3>Echo</h3>
      </div>
    </div>
  );
}

export default Navbar;