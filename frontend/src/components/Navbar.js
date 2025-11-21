import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      style={{
        padding: "15px",
        background: "#222",
        display: "flex",
        justifyContent: "center",
        gap: "25px",
      }}
    >
      <Link to="/" style={{ color: "white", textDecoration: "none" }}>
        Home
      </Link>

      <Link to="/voice" style={{ color: "white", textDecoration: "none" }}>
        Voice
      </Link>

      <Link to="/navigate" style={{ color: "white", textDecoration: "none" }}>
        Navigate
      </Link>

      <Link to="/settings" style={{ color: "white", textDecoration: "none" }}>
        Settings
      </Link>
    </nav>
  );
}
