import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Home page:
 * - Greets user (TTS)
 * - Auto-listens (English) to detect language name or commands
 * - Buttons: Start Navigation, Start Detection, Emergency
 * - Saves chosen language to sessionStorage.navLang
 */

const LANGS = {
  english: "en-IN",
  telugu: "te-IN",
  hindi: "hi-IN",
  tamil: "ta-IN",
  kannada: "kn-IN",
  malayalam: "ml-IN",
  marathi: "mr-IN",
  gujarati: "gu-IN",
  bengali: "bn-IN",
  punjabi: "pa-IN",
  urdu: "ur-IN",
  odia: "or-IN",
};

export default function Home() {
  const nav = useNavigate();
  const recRef = useRef(null);
  const [status, setStatus] = useState("Tap mic or say a language (English, Telugu, Hindi...)");
  const [listening, setListening] = useState(false);

  // greet and auto-listen shortly after mount
  useEffect(() => {
    const greet = "Welcome to VoixMate. Say your language to begin, for example: English or Telugu.";
    const u = new SpeechSynthesisUtterance(greet);
    u.lang = "en-IN";
    window.speechSynthesis.speak(u);

    // auto-listen after greeting
    const timer = setTimeout(() => startLanguageListener(), 1400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startLanguageListener() {
    if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
      setStatus("Speech recognition not supported.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    recRef.current = rec;
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = false;

    rec.onstart = () => {
      setListening(true);
      setStatus("Listening for language or command...");
    };
    rec.onerror = (e) => {
      console.error("Lang listen error", e);
      setStatus("Could not understand. Tap mic to try again.");
      setListening(false);
    };
    rec.onend = () => setListening(false);

    rec.onresult = (ev) => {
      const txt = ev.results[0][0].transcript.toLowerCase();
      setStatus("Heard: " + txt);
      handleHeardText(txt);
    };

    rec.start();
  }

  function handleHeardText(text) {
    // check for control commands first
    if (text.includes("start navigation") || text.includes("open navigation") || text.includes("navigate")) {
      const saved = sessionStorage.getItem("navLang") || "en-IN";
      sessionStorage.setItem("navLang", saved);
      speakThenNavigate(saved, "/navigate", "Opening navigation");
      return;
    }
    if (text.includes("open detection") || text.includes("object detection") || text.includes("camera")) {
      const saved = sessionStorage.getItem("navLang") || "en-IN";
      sessionStorage.setItem("navLang", saved);
      speakThenNavigate(saved, "/navigate", "Opening navigation (object detection available on page)");
      return;
    }
    if (text.includes("help")) {
      const saved = sessionStorage.getItem("navLang") || "en-IN";
      const u = new SpeechSynthesisUtterance("Help: say a language like Telugu, or say Start Navigation.");
      u.lang = saved;
      window.speechSynthesis.speak(u);
      return;
    }
    if (text.includes("emergency") || text.includes("help me") || text.includes("sos") || text.includes("madad")) {
      triggerEmergency();
      return;
    }

    // language detection
    let found = null;
    Object.keys(LANGS).forEach((k) => {
      if (text.includes(k)) found = k;
    });
    if (found) {
      const code = LANGS[found];
      sessionStorage.setItem("navLang", code);
      const ack = new SpeechSynthesisUtterance(`${found} selected. Say 'Start navigation' or tap Start Navigation.`);
      ack.lang = code;
      window.speechSynthesis.speak(ack);
      setStatus("Language set: " + found);
    } else {
      setStatus("Language not recognized. Try again or tap mic.");
      const u = new SpeechSynthesisUtterance("Language not recognized. Please say again.");
      u.lang = "en-IN";
      window.speechSynthesis.speak(u);
    }
  }

  function speakThenNavigate(languageCode, path, msg) {
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = languageCode || "en-IN";
    window.speechSynthesis.speak(u);
    setTimeout(() => nav(path), 600);
  }

  function triggerEmergency() {
    const lang = sessionStorage.getItem("navLang") || "en-IN";
    const u = new SpeechSynthesisUtterance("Emergency mode activated. Help is being called.");
    u.lang = lang;
    window.speechSynthesis.speak(u);
    if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
    setStatus("EMERGENCY triggered — implement location/share server for full behavior");
    window.dispatchEvent(new Event("voixmate-emergency"));
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>VoixMate</h1>
      <p style={{ color: "#ddd" }}>{status}</p>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <button onClick={() => nav("/navigate")} style={styles.actionBtn}>🚀 Start Navigation</button>
        <button onClick={() => { nav("/navigate"); }} style={styles.actionBtn}>📷 Object Detection</button>
        <button onClick={triggerEmergency} style={{ ...styles.actionBtn, background: "#e11d48" }}>🆘 Emergency</button>
      </div>

      <div style={{ marginTop: 28 }}>
        <button onClick={startLanguageListener} style={styles.micBtn} aria-label="Start language selection">
          🎤 {listening ? "Listening..." : "Tap to speak language"}
        </button>
      </div>

      <p style={{ marginTop: 26, color: "#bbb", maxWidth: 560 }}>
        Tip: Say language name like "Telugu" or "Hindi". Or say "Start navigation" to jump directly.
      </p>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "#0b0f12",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  title: { fontSize: 34, margin: 0 },
  actionBtn: {
    padding: "12px 18px",
    borderRadius: 10,
    border: "none",
    background: "#0ea5a9",
    color: "white",
    fontSize: 16,
  },
  micBtn: {
    marginTop: 12,
    padding: "18px 26px",
    borderRadius: 12,
    fontSize: 18,
    background: "#1f2937",
    color: "white",
    border: "none",
  },
};

