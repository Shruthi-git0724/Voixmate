import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NavigationPage from "./pages/NavigationPage";

/**
 * App root: shows offline banner if offline and routes to pages.
 * Language selection is handled inside Home and stored in sessionStorage.navLang.
 */
export default function App() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <>
      {!online && <div className="app-offline-banner">You are offline — limited features available</div>}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/navigate" element={<NavigationPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
