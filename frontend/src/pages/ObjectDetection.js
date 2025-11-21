import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

/**
 * Improved Object Detection Page
 * - uses videoWidth/videoHeight for correct canvas scaling
 * - filters by SCORE_THRESHOLD
 * - requires MIN_FRAMES consecutive detections before speaking
 * - per-class cooldown to avoid repeated TTS
 */

export default function ObjectDetectionPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const modelRef = useRef(null);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [status, setStatus] = useState("Loading model...");
  const detectionCountsRef = useRef({}); // { label: consecutiveCount }
  const lastSpokenAtRef = useRef({}); // { label: timestamp }
  const lastSpokenTextRef = useRef("");

  // Config
  const SCORE_THRESHOLD = 0.6; // minimum confidence to consider
  const MIN_FRAMES = 3; // must appear in N consecutive frames before announcing
  const SPEAK_COOLDOWN_MS = 3500; // per-class cooldown

  // TTS helper with basic debounce per label and global dedupe
  const speak = (text, lang = "en-IN") => {
    const now = Date.now();

    // global dedupe: identical text within short time -> skip
    if (lastSpokenTextRef.current === text && now - (lastSpokenTextRef.currentAt || 0) < 2500) return;

    // find label in text for per-class cooldown (approx)
    const labelMatch = text.split(" ")[0]?.toLowerCase();
    if (labelMatch && lastSpokenAtRef.current[labelMatch] && now - lastSpokenAtRef.current[labelMatch] < SPEAK_COOLDOWN_MS) {
      return;
    }

    lastSpokenTextRef.current = text;
    lastSpokenTextRef.currentAt = now;
    if (labelMatch) lastSpokenAtRef.current[labelMatch] = now;

    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);

    // vibration for mobile
    if (navigator.vibrate) navigator.vibrate([150]);
  };

  // start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait until video metadata is loaded so we know width/height
        await new Promise((resolve) => {
          const v = videoRef.current;
          if (v.readyState >= 1) return resolve();
          v.onloadedmetadata = () => resolve();
        });
      }
    } catch (err) {
      console.error("Camera start failed", err);
      alert("Unable to access camera. Please allow camera permissions.");
      setStatus("Camera access denied");
    }
  };

  // draw detection boxes scaled to actual video size
  const drawDetections = (predictions) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");

    // set canvas size to match video actual pixel size
    const vw = video.videoWidth || video.clientWidth;
    const vh = video.videoHeight || video.clientHeight;
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((p) => {
      const score = p.score || 0;
      if (score < SCORE_THRESHOLD) return;
      const [x, y, w, h] = p.bbox; // bbox is in pixels relative to video
      // draw rectangle
      ctx.strokeStyle = "rgba(0,200,0,0.9)";
      ctx.lineWidth = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) * 0.003));
      ctx.strokeRect(x, y, w, h);
      // label box
      ctx.fillStyle = "rgba(0,200,0,0.85)";
      ctx.font = `${Math.max(12, Math.round(canvas.width * 0.02))}px Arial`;
      const label = `${p.class} ${(score * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(label).width;
      const pad = 6;
      const rectW = textWidth + pad * 2;
      const rectH = parseInt(ctx.font, 10) + pad;
      ctx.fillRect(x, y - rectH, rectW, rectH);
      ctx.fillStyle = "#000";
      ctx.fillText(label, x + pad, y - pad);
    });
  };

  // Main detection loop
  const detectionLoop = async () => {
    const model = modelRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!model || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    try {
      const predictions = await model.detect(video);

      // draw boxes
      drawDetections(predictions);

      // handle counts -> require MIN_FRAMES consecutive appearances
      const seenThisFrame = new Set();
      predictions.forEach((p) => {
        if (p.score < SCORE_THRESHOLD) return;
        const label = p.class.toLowerCase();
        seenThisFrame.add(label);
        detectionCountsRef.current[label] = (detectionCountsRef.current[label] || 0) + 1;
      });

      // decrement counts for labels not seen this frame (decay)
      Object.keys(detectionCountsRef.current).forEach((label) => {
        if (!seenThisFrame.has(label)) {
          detectionCountsRef.current[label] = Math.max(0, detectionCountsRef.current[label] - 1);
        }
      });

      // announce labels which reached MIN_FRAMES and pass cooldown
      Object.keys(detectionCountsRef.current).forEach((label) => {
        if (detectionCountsRef.current[label] >= MIN_FRAMES) {
          const now = Date.now();
          const last = lastSpokenAtRef.current[label] || 0;
          if (now - last > SPEAK_COOLDOWN_MS) {
            // Speak friendly text (map quick synonyms)
            const speakText = `${label} detected ahead`;
            speak(speakText);
            lastSpokenAtRef.current[label] = now;
            // optional: reset count to avoid immediate repeat
            detectionCountsRef.current[label] = 0;
          }
        }
      });
    } catch (err) {
      console.error("Detection error:", err);
    }

    rafRef.current = requestAnimationFrame(detectionLoop);
  };

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      setStatus("Loading model...");
      try {
        // load model
        const loaded = await cocoSsd.load();
        modelRef.current = loaded;
        setModelLoaded(true);
        setStatus("Starting camera...");
        await startCamera();
        setStatus("Running detection...");
        // start loop
        rafRef.current = requestAnimationFrame(detectionLoop);
      } catch (err) {
        console.error("Model load failed", err);
        setStatus("Model load failed: " + err.message);
      }
    };

    setup();

    return () => {
      cancelled = true;
      // stop raf
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // stop camera
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: "#000", color: "#fff" }}>
      <h2 style={{ marginTop: 16 }}>Object Detection</h2>
      <p style={{ color: "#ccc" }}>{status}</p>

      <div style={{ position: "relative", width: 360, height: 280 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover", background: "#222" }}
        />
        <canvas ref={canvasRef} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
      </div>

      <div style={{ marginTop: 12 }}>
        <small style={{ color: "#aaa" }}>
          Model: COCO-SSD — filtering with score & consecutive frames. Adjust SCORE_THRESHOLD or MIN_FRAMES in code.
        </small>
      </div>
    </div>
  );
}


