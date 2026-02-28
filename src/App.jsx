import { useState, useEffect } from "react";
import axios from "axios";
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

    axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
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

  if (!user) {
    return authView === "login" ? (
      <Login setUser={setUser} setAuthView={setAuthView} />
    ) : (
      <Register setAuthView={setAuthView} />
    );
  }

  // PASSED setUser HERE so Profile.js can use it!
  return <Chat user={user} setUser={setUser} />;
}

export default App;