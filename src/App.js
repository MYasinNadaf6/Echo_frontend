import { useState, useEffect } from "react";
import axios from "axios"; // Make sure to import axios!
import Login from "./Login";
import Register from "./Register";
import Chat from "./Chat";

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");

  // PROTECTED ROUTE LOGIC: Auto-login if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    axios.get("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setUser(res.data);
    })
    .catch(() => {
      // If token is expired or invalid, clear it
      localStorage.removeItem("token");
    });

  }, []);

  // Inside your App.js render:
if (!user) {
  return authView === "login" ? (
    // 🔥 Make sure it says setAuthView={setAuthView} here!
    <Login setUser={setUser} setAuthView={setAuthView} />
  ) : (
    // 🔥 And here!
    <Register setAuthView={setAuthView} />
  );
}
  // PASSED setUser HERE so Profile.js can use it!
  return <Chat user={user} setUser={setUser} />;
}

export default App;