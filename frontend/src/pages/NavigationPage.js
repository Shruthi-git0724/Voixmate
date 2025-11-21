import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Auto-center map component
function MapAutoCenter({ coords }) {
  const map = useMap();
  const prevRef = useRef();
  useEffect(() => {
    if (!coords) return;
    const next = L.latLng(coords);
    if (!prevRef.current || prevRef.current.distanceTo(next) > 30) {
      map.setView(coords, 16);
      prevRef.current = next;
    }
  }, [coords, map]);
  return null;
}

// --------- Language Map for 12 languages (unchanged) ---------
const LANG_MAP = {
  "en-IN": {
    person: "Person", car: "Car", bus: "Bus", truck: "Truck",
    motorcycle: "Motorbike", bicycle: "Bicycle", dog: "Dog", cat: "Cat",
    promptDestination: "Please say a destination",
    calculatingRoute: "Calculating route",
    routeReady: "Route ready",
    close: "close", veryClose: "very close", ahead: "ahead",
    youAreHere: "You are here", destination: "Destination"
  },
  /* ... other languages (te-IN, hi-IN, fr-FR, etc.) same as you had ... */
  "te-IN": {
    person: "వ్యక్తి", car: "కారు", bus: "బస్సు", truck: "ట్రక్",
    motorcycle: "బైక్", bicycle: "సైకిల్", dog: "కుక్క", cat: "పిల్లి",
    promptDestination: "దయచేసి గమ్యస్థానం చెప్పండి",
    calculatingRoute: "రూట్ సిద్ధం చేస్తోంది",
    routeReady: "రూట్ సిద్ధం",
    close: "దగ్గరగా ఉంది", veryClose: "ఎక్కువ దగ్గరగా ఉంది", ahead: "ముందుంది",
    youAreHere: "మీ స్థానం", destination: "గమ్యస్థానం"
  },
  "hi-IN": {
    person: "व्यक्ति", car: "गाड़ी", bus: "बस", truck: "ट्रक",
    motorcycle: "मोटरसाइकिल", bicycle: "साइकिल", dog: "कुत्ता", cat: "बिल्ली",
    promptDestination: "कृपया गंतव्य बताएं", calculatingRoute: "रूट तैयार कर रहे हैं",
    routeReady: "रूट तैयार", close: "पास में", veryClose: "बहुत पास", ahead: "आगे",
    youAreHere: "आप यहाँ हैं", destination: "गंतव्य"
  },
  "fr-FR": { person: "Personne", car: "Voiture", bus: "Bus", truck: "Camion", motorcycle: "Moto", bicycle: "Vélo", dog: "Chien", cat: "Chat", promptDestination: "Veuillez indiquer une destination", calculatingRoute: "Calcul du trajet", routeReady: "Itinéraire prêt", close: "proche", veryClose: "très proche", ahead: "devant", youAreHere: "Vous êtes ici", destination: "Destination" },
  "es-ES": { person: "Persona", car: "Coche", bus: "Autobús", truck: "Camión", motorcycle: "Moto", bicycle: "Bicicleta", dog: "Perro", cat: "Gato", promptDestination: "Por favor indique un destino", calculatingRoute: "Calculando ruta", routeReady: "Ruta lista", close: "cerca", veryClose: "muy cerca", ahead: "adelante", youAreHere: "Estás aquí", destination: "Destino" },
  "de-DE": { person: "Person", car: "Auto", bus: "Bus", truck: "LKW", motorcycle: "Motorrad", bicycle: "Fahrrad", dog: "Hund", cat: "Katze", promptDestination: "Bitte geben Sie ein Ziel an", calculatingRoute: "Route wird berechnet", routeReady: "Route bereit", close: "nah", veryClose: "sehr nah", ahead: "vorne", youAreHere: "Sie sind hier", destination: "Ziel" },
  "ta-IN": { person: "நபர்", car: "கார்", bus: "பஸ்", truck: "டிரக்", motorcycle: "மோட்டார் சைக்கிள்", bicycle: "சைக்கிள்", dog: "நாய்", cat: "பூனை", promptDestination: "தயவு செய்து இடத்தை கூறவும்", calculatingRoute: "வழியை கணக்கிடுகிறது", routeReady: "வழி தயார்", close: "அருகில்", veryClose: "மிக அருகில்", ahead: "முன்னே", youAreHere: "நீங்கள் இங்கு உள்ளீர்கள்", destination: "இடம்" },
  "kn-IN": { person: "ವ್ಯಕ್ತಿ", car: "ಕಾರ್", bus: "ಬಸ್", truck: "ಟ್ರಕ್", motorcycle: "ಮೋಟಾರ್ಸೈಕಲ್", bicycle: "ಸೈಕಲ್", dog: "ನಾಯಿ", cat: "ಬೆಕ್ಕು", promptDestination: "ದಯವಿಟ್ಟು ಗಮ್ಯಸ್ಥಾನವನ್ನು ಹೇಳಿ", calculatingRoute: "ಮಾರ್ಗವನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗುತ್ತಿದೆ", routeReady: "ಮಾರ್ಗ ಸಿದ್ಧವಾಗಿದೆ", close: "ಹತ್ತಿರ", veryClose: "ಬಹಳ ಹತ್ತಿರ", ahead: "ಮುಂದೆ", youAreHere: "ನೀವು ಇಲ್ಲಿ ಇದ್ದೀರಿ", destination: "ಗಮ್ಯಸ್ಥಾನ" },
  "bn-IN": { person: "ব্যক্তি", car: "গাড়ি", bus: "বাস", truck: "ট্রাক", motorcycle: "মোটরসাইকেল", bicycle: "সাইকেল", dog: "কুকুর", cat: "বিড়াল", promptDestination: "অনুগ্রহ করে গন্তব্য বলুন", calculatingRoute: "রুট গণনা হচ্ছে", routeReady: "রুট প্রস্তুত", close: "নিকটে", veryClose: "খুব কাছে", ahead: "সামনে", youAreHere: "আপনি এখানে", destination: "গন্তব্য" },
  "mr-IN": { person: "व्यक्ति", car: "कार", bus: "बस", truck: "ट्रक", motorcycle: "मोटरसायकल", bicycle: "सायकल", dog: "कुत्रा", cat: "मांजर", promptDestination: "कृपया गंतव्य सांगा", calculatingRoute: "मार्ग तयार केला जात आहे", routeReady: "मार्ग तयार", close: "जवळ", veryClose: "खूप जवळ", ahead: "आगे", youAreHere: "आपण येथे आहात", destination: "गंतव्य" },
  "ar-SA": { person: "شخص", car: "سيارة", bus: "حافلة", truck: "شاحنة", motorcycle: "دراجة نارية", bicycle: "دراجة", dog: "كلب", cat: "قط", promptDestination: "الرجاء قول الوجهة", calculatingRoute: "جارٍ حساب المسار", routeReady: "المسار جاهز", close: "قريب", veryClose: "قريب جدًا", ahead: "أمام", youAreHere: "أنت هنا", destination: "الوجهة" },
  "pt-PT": { person: "Pessoa", car: "Carro", bus: "Autocarro", truck: "Camião", motorcycle: "Motociclo", bicycle: "Bicicleta", dog: "Cão", cat: "Gato", promptDestination: "Por favor diga o destino", calculatingRoute: "A calcular rota", routeReady: "Rota pronta", close: "perto", veryClose: "muito perto", ahead: "à frente", youAreHere: "Você está aqui", destination: "Destino" }
};

// ------------- NavigationPage Component ----------------
export default function NavigationPage() {
  const [coords, setCoords] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInstructions, setRouteInstructions] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [status, setStatus] = useState("Waiting for destination...");

  const [textDest, setTextDest] = useState("");

  const lang = sessionStorage.getItem("navLang") || "en-IN";

  // Object detection state
  const [detectOn, setDetectOn] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const modelRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const SCORE_THRESHOLD = 0.65;
  const MIN_CONSECUTIVE = 3;
  const SPEAK_COOLDOWN = 3500;
  const NEAR_AREA_THRESHOLD = 0.09;
  const CLOSE_AREA_THRESHOLD = 0.03;
  const consecCounts = useRef({});
  const lastSpokenAt = useRef({});
  const videoDimensions = useRef({ width: 640, height: 480 });

  // ---------------- GPS Tracking ----------------
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("Geolocation not supported.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => setCoords([p.coords.latitude, p.coords.longitude]),
      (err) => setStatus("GPS error: " + err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // --------------- Geocode Helper ----------------
  const geocode = async (q) => {
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
    const arr = await resp.json();
    if (!arr || !arr.length) return null;
    return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), name: arr[0].display_name };
  };

  // ----------------- Fetch Route -----------------
  const fetchRoute = async (src, dst) => {
    if (!src || !dst) { setStatus("Missing source/destination"); return; }
    setLoadingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${src[1]},${src[0]};${dst[1]},${dst[0]}?overview=full&geometries=polyline&steps=true`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (!data.routes || !data.routes.length) { setStatus("No route found"); setLoadingRoute(false); return; }
      const decoded = polyline.decode(data.routes[0].geometry);
      setRouteCoords(decoded);

      const steps = data.routes[0].legs[0].steps.map((s, idx) => {
        const instr = s.maneuver.instruction || s.name || "Proceed";
        return { idx: idx + 1, text: instr, loc: [s.maneuver.location[1], s.maneuver.location[0]] };
      });
      setRouteInstructions(steps);

      tts(`${LANG_MAP[lang]?.routeReady || "Route ready"}: ${steps.length} steps`);
      speakStepsSequentially(steps);

      setStatus(LANG_MAP[lang]?.routeReady || "Route loaded");
    } catch (e) { console.error(e); setStatus("Error fetching route"); }
    finally { setLoadingRoute(false); }
  };

  const speakStepsSequentially = (steps) => {
    let i = 0;
    const speakNext = () => {
      if (i >= steps.length) { tts(LANG_MAP[lang]?.youAreHere || "You have reached your destination."); return; }
      const u = new SpeechSynthesisUtterance(`Step ${steps[i].idx}: ${steps[i].text}`);
      u.lang = lang;
      u.onend = () => { i++; setTimeout(speakNext, 300); };
      window.speechSynthesis.speak(u);
    };
    speakNext();
  };

  // ----------------- TTS (safe) -----------------
  function tts(text) {
    try {
      // cancel any current speech to avoid overlapping
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      window.speechSynthesis.speak(u);
    } catch (e) { console.warn(e); }
  }

  // ---------------- Destination ----------------
  const handleDestination = async (t) => {
    if (!t || t.trim() === "") { tts(LANG_MAP[lang]?.promptDestination || "Please say a destination"); return; }
    if (!coords) { setStatus("Waiting for GPS fix..."); tts("Waiting for GPS location."); return; }
    setStatus(LANG_MAP[lang]?.calculatingRoute || "Calculating route");
    const g = await geocode(t);
    if (!g) { setStatus("Location not found"); tts("Location not found."); return; }
    const dst = [g.lat, g.lon];
    setDestination(dst);
    tts(`${LANG_MAP[lang]?.calculatingRoute || "Calculating route"}: ${g.name}`);
    await fetchRoute(coords, dst);
  };

  // ----------------- Object Detection ----------------
  const formatLabel = (label) => LANG_MAP[lang]?.[label.toLowerCase()] || label;

  const drawBoxes = (preds) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    const vw = video.videoWidth || videoDimensions.current.width;
    const vh = video.videoHeight || videoDimensions.current.height;
    if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    preds.forEach((p) => {
      if (p.score < SCORE_THRESHOLD) return;
      const [x, y, w, h] = p.bbox;
      ctx.strokeStyle = "rgba(0,200,0,0.95)";
      ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      const fontSize = Math.max(12, Math.round(canvas.width * 0.03));
      ctx.fillStyle = "rgba(0,200,0,0.85)";
      ctx.font = `${fontSize}px Arial`;
      const labelText = `${formatLabel(p.class)} ${(p.score * 100).toFixed(0)}%`;
      const tw = ctx.measureText(labelText).width + 8; const th = fontSize + 6;
      ctx.fillRect(x, y - th, tw, th);
      ctx.fillStyle = "#000"; ctx.fillText(labelText, x + 4, y - 4);
    });
  };

  const detectionLoop = async () => {
    const model = modelRef.current;
    const video = videoRef.current;
    if (!model || !video || video.readyState < 2) { rafRef.current = requestAnimationFrame(detectionLoop); return; }
    try {
      const preds = await model.detect(video);
      drawBoxes(preds);

      const frameArea = (video.videoWidth || videoDimensions.current.width) * (video.videoHeight || videoDimensions.current.height);
      const seen = new Set();
      preds.forEach((p) => { if (p.score >= SCORE_THRESHOLD) { const label = p.class.toLowerCase(); seen.add(label); consecCounts.current[label] = (consecCounts.current[label] || 0) + 1; } });
      Object.keys(consecCounts.current).forEach((lab) => { if (!seen.has(lab)) consecCounts.current[lab] = Math.max(0, consecCounts.current[lab] - 1); });

      for (const label of Object.keys(consecCounts.current)) {
        if (consecCounts.current[label] >= MIN_CONSECUTIVE) {
          const now = Date.now(); const last = lastSpokenAt.current[label] || 0;
          if (now - last > SPEAK_COOLDOWN) {
            const labelPreds = preds.filter((p) => p.class.toLowerCase() === label && p.score >= SCORE_THRESHOLD);
            if (labelPreds.length === 0) { consecCounts.current[label] = 0; continue; }
            let maxArea = 0;
            labelPreds.forEach((p) => { const area = p.bbox[2] * p.bbox[3]; if (area > maxArea) maxArea = area; });
            const areaFrac = maxArea / frameArea;
            let proximity = areaFrac >= NEAR_AREA_THRESHOLD ? LANG_MAP[lang]?.veryClose : areaFrac >= CLOSE_AREA_THRESHOLD ? LANG_MAP[lang]?.close : LANG_MAP[lang]?.ahead;
            tts(`${formatLabel(label)} ${proximity}`);
            lastSpokenAt.current[label] = now;
            consecCounts.current[label] = 0;
          }
        }
      }

    } catch (e) { console.error("Detection error", e); }
    rafRef.current = requestAnimationFrame(detectionLoop);
  };

  const toggleDetection = async () => {
    if (!detectOn) { setDetectOn(true); await loadModelAndStart(); }
    else { setDetectOn(false); setModelLoaded(false); stopDetectionAndCamera(); setStatus("Detection stopped"); }
  };

  const loadModelAndStart = async () => {
    try {
      setStatus("Loading model...");
      const coco = await import("@tensorflow-models/coco-ssd");
      await import("@tensorflow/tfjs");
      modelRef.current = await coco.load();
      setModelLoaded(true); setStatus("Model loaded");

      // request camera and wait for metadata so we can size canvas properly
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        videoRef.current.srcObject = stream;

        await new Promise((res) => {
          if (videoRef.current.readyState >= 1 && videoRef.current.videoWidth) return res();
          videoRef.current.onloadedmetadata = () => res();
        });

        // set canvas size to match video intrinsic size
        const vw = videoRef.current.videoWidth || videoDimensions.current.width;
        const vh = videoRef.current.videoHeight || videoDimensions.current.height;
        videoDimensions.current = { width: vw, height: vh };
        if (canvasRef.current) { canvasRef.current.width = vw; canvasRef.current.height = vh; }
        // start playback
        try { await videoRef.current.play(); } catch (e) { console.warn("Video play prevented", e); }
      }

      // start loop
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(detectionLoop);
      setStatus("Detection started");
    } catch (e) { console.error(e); setStatus("Model load error"); }
  };

  const stopDetectionAndCamera = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx && ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    consecCounts.current = {};
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
      }
      if (modelRef.current && modelRef.current.dispose) {
        try { modelRef.current.dispose(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  const controlBtnStyle = {
    padding: "8px 12px",
    background: "#1e40af",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    marginRight: 8
  };

  return (
    <div style={{ padding: 12 }}>
      <h2>{LANG_MAP[lang]?.youAreHere}</h2>

      <MapContainer center={coords || [17.385, 78.486]} zoom={16} style={{ height: "400px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapAutoCenter coords={coords} />
        {coords && <Marker position={coords}><Popup>{LANG_MAP[lang]?.youAreHere}</Popup></Marker>}
        {destination && <Marker position={destination}><Popup>{LANG_MAP[lang]?.destination}</Popup></Marker>}
        {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" />}
      </MapContainer>

      <div style={{ marginTop: 12, display: "flex", alignItems: "center" }}>
        <input type="text" placeholder={LANG_MAP[lang]?.promptDestination} value={textDest} onChange={(e) => setTextDest(e.target.value)} style={{ padding: 8, width: 360, marginRight: 8 }} />
        <button onClick={() => handleDestination(textDest)} style={controlBtnStyle}>{LANG_MAP[lang]?.routeReady}</button>
        <button onClick={toggleDetection} style={controlBtnStyle}>{detectOn ? "Stop Detection" : "Start Detection"}</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div>Status: {loadingRoute ? "Loading route..." : status}</div>
        <div style={{ position: "relative", marginTop: 8, width: 360, height: 240, background: "#222", borderRadius: 8, overflow: "hidden" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} autoPlay muted playsInline />
          <canvas ref={canvasRef} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, color: "#fff", fontSize: 12 }}>
            Model: {modelLoaded ? "Ready" : "Not loaded"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Route Instructions:</h3>
        <ul>
          {routeInstructions.map((s) => <li key={s.idx}>{s.text}</li>)}
        </ul>
      </div>
    </div>
  );
}
