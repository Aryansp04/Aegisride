// AegisRide Application Logic & Simulation Engine

// Flow Stages Data
const flowStages = {
  1: {
    title: "Stage 1: Problem",
    question: "What hurts, and for whom?",
    badge: "Problem Definition",
    points: [
      { label: "Target Victim", text: "Solo two-wheeler commuters and gig-economy delivery riders (Swiggy, Zomato, Zepto) travelling alone at night (11 PM - 5 AM)." },
      { label: "Critical Vulnerability", text: "When an accident occurs on unlit bypass roads or flyovers with no eyewitnesses, the unconscious rider cannot call for help." },
      { label: "The Fatal Cost", text: "Loss of the medical 'Golden Hour' (first 60 mins post-trauma). Delayed discovery leads to preventable internal hemorrhaging fatalities." }
    ],
    technicalSpec: "Root Cause: Zero-connectivity crash state coupled with physical incapacity."
  },
  2: {
    title: "Stage 2: Input / Data",
    question: "Where does data originate?",
    badge: "Sensory Ingestion",
    points: [
      { label: "Physical Hardware", text: "Edge IoT Sensor Pod installed either on the motorcycle chassis or smart helmet." },
      { label: "Raw Telemetry Streams", text: "• 3-Axis Accelerometer (Ax, Ay, Az in m/s²) sampled at 100 Hz.<br>• 3-Axis Gyroscope (Roll, Pitch, Yaw angular velocities in °/s).<br>• High-precision GNSS/GPS (Latitude, Longitude, Heading, Speed in km/h)." },
      { label: "Data Volume", text: "~600 floating-point telemetry readings per second, buffered in a circular 500ms FIFO ring." }
    ],
    technicalSpec: "Sensors: InvenSense MPU-6050 / ST LSM6DSOX via I2C bus @ 400kHz."
  },
  3: {
    title: "Stage 3: Technology",
    question: "Which job does each one do?",
    badge: "Architecture Allocation",
    points: [
      { label: "IoT (USED)", text: "Physical sensor sampling, signal conditioning (Butterworth low-pass filtering), and local edge microcontroller execution." },
      { label: "ML (USED)", text: "Edge TinyML Classifier (Random Forest / 1D-CNN) that processes multi-axis kinematic waveforms to distinguish crashes from potholes/phone drops." },
      { label: "AI (USED)", text: "Autonomous Triage & Dispatch Agent executing state-machine escalation: 30s countdown, severity score indexing, and multi-channel emergency broadcast." },
      { label: "NLP (DEFENDED AS NOT USED)", text: "Explicitly omitted: Road noise at 60 km/h creates fatal transcription errors; unconscious victims cannot speak; kinematics is vector math, not speech." }
    ],
    technicalSpec: "Tech Stack: C++ on FreeRTOS Edge MCU + TinyML inference + Cloud MQTT/REST Gateway."
  },
  4: {
    title: "Stage 4: Processing",
    question: "How does data become insight?",
    badge: "Inference & Feature Extraction",
    points: [
      { label: "Feature Extraction Window", text: "When instantaneous |G| > 3.0, a 400ms temporal window is captured." },
      { label: "Computed Features", text: "• Peak-to-Peak Jerk (dG/dt)<br>• Angular Tilt Delta (ΔRoll > 65°)<br>• Velocity Discontinuity (ΔSpeed > 35 km/h to 0 within 250ms)<br>• Post-impact rest stability." },
      { label: "Classification", text: "Model evaluates covariance matrix across 6 degrees of freedom. Yields a Crash Confidence Probability (0.00 to 1.00)." }
    ],
    technicalSpec: "Model Latency: <15 milliseconds inference on ARM Cortex-M4 @ 64MHz."
  },
  5: {
    title: "Stage 5: Decision",
    question: "What is being decided?",
    badge: "Deterministic Decision Boundary",
    points: [
      { label: "Binary Classification", text: "Is this event a TRUE CRASH requiring emergency services or a FALSE ALARM (pothole/drop)?" },
      { label: "Triage Severity Index", text: "Calculates impact energy: Severity Category (Minor / Moderate / Severe Trauma) to advise ambulance medics on required equipment." },
      { label: "Consciousness Check", text: "Did the rider physically cancel the escalating 30-second haptic/acoustic alarm on their phone/handlebar button?" }
    ],
    technicalSpec: "Decision Rule: IF (Crash Probability > 0.92) AND (Override Timer Expired) THEN Fire Emergency Protocol."
  },
  6: {
    title: "Stage 6: Action",
    question: "What happens next?",
    badge: "Closed-Loop Escalation",
    points: [
      { label: "Primary Transmission", text: "Encrypted SOS JSON payload dispatched via 4G LTE/5G cellular modem to State Emergency Response System (108 / 112)." },
      { label: "Secondary SMS Fallback", text: "If packet fails within 3s, automatically transmits compressed SMS with Lat/Long, severity, and rider profile." },
      { label: "Family Broadcast", text: "Automated WhatsApp/SMS alert with live Google Maps tracking link to designated emergency contacts." },
      { label: "Physical Beacon", text: "Bike hazard lights flash at 4 Hz and 110dB piezo siren triggers to alert passing motorists on unlit road." }
    ],
    technicalSpec: "Payload size: 312 bytes. Mean transmission time: 1.2 seconds over 4G."
  },
  7: {
    title: "Stage 7: User",
    question: "Who sees or receives it?",
    badge: "End Consumer & Stakeholders",
    points: [
      { label: "1. 108 Emergency Dispatch Center", text: "Receives incident on CAD (Computer Aided Dispatch) console with exact coordinates, vehicle registration, and estimated trauma score." },
      { label: "2. Nearest Paramedic Crew", text: "Dispatched directly with turn-by-turn navigation; pre-informed of probable head/spine trauma." },
      { label: "3. Family & Next of Kin", text: "Receive SMS with live status update and admitting hospital." },
      { label: "4. The Rider", text: "Protected automatically without needing to speak, unlock a phone, or be conscious." }
    ],
    technicalSpec: "SLA: Golden-Hour medical intervention enabled in under 20 minutes."
  }
};

// State variables
let activeFlowStage = 1;
let currentScenario = null;
let overrideInterval = null;
let overrideSecondsRemaining = 30;
let pitchTimerInterval = null;
let pitchSecondsRemaining = 60;
let isPitchRunning = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  showFlowDetail(1);
  initTelemetryCanvas();
  setupSpeechSynthesis();
  selectTwist('T1');
  
  // Quick demo button
  document.getElementById('quick-demo-btn').addEventListener('click', () => {
    switchTab('tab-simulator');
    setTimeout(() => {
      runScenario('crash');
    }, 400);
  });
});

// Tab Navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      switchTab(targetId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Flow Detail Renderer
function showFlowDetail(stageNum) {
  activeFlowStage = stageNum;
  document.querySelectorAll('.flow-node').forEach(node => {
    node.classList.toggle('active', parseInt(node.getAttribute('data-flow')) === stageNum);
  });

  const data = flowStages[stageNum];
  const container = document.getElementById('flow-detail-card');
  if (!container || !data) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
      <div>
        <span class="badge blue" style="margin-bottom: 6px;">${data.badge}</span>
        <h3 style="font-size: 1.35rem; color: #fff;">${data.title}</h3>
        <p style="color: var(--accent-cyan); font-size: 0.95rem; font-weight: 500; margin-top: 2px;">
          Key Question: "${data.question}"
        </p>
      </div>
      <div style="font-family: var(--font-mono); font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        Step ${stageNum} of 7
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
      ${data.points.map(pt => `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 14px; border-radius: 8px;">
          <strong style="color: var(--accent-emerald); font-size: 0.85rem; text-transform: uppercase; display: block; margin-bottom: 6px;">
            ${pt.label}
          </strong>
          <div style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">
            ${pt.text}
          </div>
        </div>
      `).join('')}
    </div>

    <div style="padding: 10px 14px; background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--accent-cyan); font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
      ⚙️ ${data.technicalSpec}
    </div>
  `;
}

// Canvas & Waveform Engine
let canvas, ctx;
let waveformHistory = [];
const maxWaveformPoints = 120;
let animationFrameId;

function initTelemetryCanvas() {
  canvas = document.getElementById('telemetryCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  // Fill initial neutral baseline
  for (let i = 0; i < maxWaveformPoints; i++) {
    waveformHistory.push({
      x: 0 + (Math.random() - 0.5) * 0.1,
      y: 0 + (Math.random() - 0.5) * 0.1,
      z: 1.0 + (Math.random() - 0.5) * 0.08
    });
  }

  animateWaveform();
}

function animateWaveform() {
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const midY = h / 2;

  // Clear background
  ctx.fillStyle = '#06090e';
  ctx.fillRect(0, 0, w, h);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 20; y < h; y += 35) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  for (let x = 20; x < w; x += 50) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  ctx.stroke();

  // Draw baseline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(w, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Plot lines for X (red), Y (green), Z (blue)
  const drawLine = (prop, color, scale) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const step = w / (maxWaveformPoints - 1);
    waveformHistory.forEach((pt, idx) => {
      const posX = idx * step;
      const posY = midY - (pt[prop] * scale);
      if (idx === 0) ctx.moveTo(posX, posY);
      else ctx.lineTo(posX, posY);
    });
    ctx.stroke();
  };

  drawLine('x', '#f43f5e', 14); // X in red
  drawLine('y', '#10b981', 14); // Y in green
  drawLine('z', '#38bdf8', 14); // Z in blue

  // Add next baseline frame if no scenario running
  if (!currentScenario) {
    waveformHistory.shift();
    waveformHistory.push({
      x: (Math.random() - 0.5) * 0.15,
      y: (Math.random() - 0.5) * 0.15,
      z: 1.0 + (Math.random() - 0.5) * 0.1
    });
  }

  animationFrameId = requestAnimationFrame(animateWaveform);
}

// Scenarios Simulator
function runScenario(type) {
  cancelOverride();
  currentScenario = type;

  const accelEl = document.getElementById('sim-accel');
  const rollEl = document.getElementById('sim-roll');
  const speedEl = document.getElementById('sim-speed');
  const mlStatusEl = document.getElementById('sim-ml-status');
  const overridePanel = document.getElementById('sim-override-panel');

  document.querySelectorAll('.btn-scenario').forEach(btn => btn.classList.remove('active'));

  if (type === 'pothole') {
    event.currentTarget.classList.add('active');
    accelEl.textContent = "3.84 G (Vertical Z-only)";
    rollEl.textContent = "2° (Upright)";
    speedEl.textContent = "48 km/h (Maintained)";
    mlStatusEl.innerHTML = "<span style='color: #10b981;'>FALSE ALARM (99.2% Conf)</span>";
    overridePanel.style.display = 'none';

    logMessage("🚨 [POTHOLE DETECTED] Sharp vertical impulse Z=3.84G registered.", "warn");
    logMessage("🧠 [EDGE TinyML] Temporal analysis: Roll angle unchanged (2°). Forward speed uninterrupted at 48 km/h.", "info");
    logMessage("✅ [DECISION] Classified as 'Harmless Road Roughness'. Alert suppressed.", "success");

    injectWaveformSpike(0.4, 0.3, 3.8);

  } else if (type === 'drop') {
    event.currentTarget.classList.add('active');
    accelEl.textContent = "4.10 G (Acoustic rebound)";
    rollEl.textContent = "N/A (Tumble)";
    speedEl.textContent = "0 km/h (Stationary or linear)";
    mlStatusEl.innerHTML = "<span style='color: #10b981;'>FALSE ALARM (98.7% Conf)</span>";
    overridePanel.style.display = 'none';

    logMessage("⚠️ [DROP SIGNATURE] Zero-G freefall window (0.02G, 180ms) followed by floor impact spike.", "warn");
    logMessage("🧠 [EDGE TinyML] Kinematic verification: Zero vehicle deceleration vector. Vehicle tilt sensor is stationary.", "info");
    logMessage("✅ [DECISION] Classified as 'Accessory/Phone Drop'. Emergency dispatch suppressed.", "success");

    injectWaveformSpike(2.2, 1.8, -1.0, 3.5);

  } else if (type === 'crash') {
    event.currentTarget.classList.add('active');
    accelEl.textContent = "8.65 G (Catastrophic Multi-Axis)";
    rollEl.textContent = "86° (Vehicle on Side)";
    speedEl.textContent = "Plunged 55 ➔ 0 km/h in 160ms";
    mlStatusEl.innerHTML = "<span style='color: #f43f5e; font-weight:700;'>CRASH CONFIRMED (99.8% Conf)</span>";

    logMessage("💥 [CRITICAL IMPACT] Violent impulse detected: 8.65G across tri-axial matrix.", "danger");
    logMessage("🧠 [EDGE TinyML] Severe deceleration: ΔV = 55 km/h in 160ms. Roll angle = 86° resting.", "danger");
    logMessage("🤖 [AI AGENT TRIAGE] Severity Index: CLASS-3 SEVERE TRAUMA. Initiating 30-second rider override sequence...", "warn");

    injectWaveformSpike(6.8, 5.2, 8.6);
    startOverrideCountdown();
  }
}

function injectWaveformSpike(spikeX, spikeY, spikeZ) {
  for (let k = 0; k < 25; k++) {
    waveformHistory.shift();
    const decay = Math.exp(-k / 6);
    waveformHistory.push({
      x: (spikeX * decay) + (Math.random() - 0.5) * 0.4,
      y: (spikeY * decay) + (Math.random() - 0.5) * 0.4,
      z: 1.0 + (spikeZ * decay) + (Math.random() - 0.5) * 0.4
    });
  }
}

// 30-Second Override Countdown Logic
function startOverrideCountdown() {
  const panel = document.getElementById('sim-override-panel');
  const secEl = document.getElementById('override-seconds');
  panel.style.display = 'block';
  overrideSecondsRemaining = 30;
  secEl.textContent = overrideSecondsRemaining;

  clearInterval(overrideInterval);
  overrideInterval = setInterval(() => {
    overrideSecondsRemaining--;
    secEl.textContent = overrideSecondsRemaining;

    if (overrideSecondsRemaining === 20) {
      logMessage("⏰ [OVERRIDE 20s] Audio buzzer escalating to 95dB. Haptic vibration active on bike handlebar.", "warn");
    }
    if (overrideSecondsRemaining === 10) {
      logMessage("⏰ [OVERRIDE 10s] No rider touch input detected. Assembling emergency SOS telemetry packet...", "warn");
    }

    if (overrideSecondsRemaining <= 0) {
      clearInterval(overrideInterval);
      panel.style.display = 'none';
      fireAutonomousDispatch();
    }
  }, 1000);
}

function cancelOverride() {
  clearInterval(overrideInterval);
  const panel = document.getElementById('sim-override-panel');
  if (panel) panel.style.display = 'none';
  if (currentScenario === 'crash') {
    logMessage("🛑 [OVERRIDE CANCELLED] Rider pressed 'I Am OK'. Escalation aborted. False alarm recorded for model calibration.", "info");
    const mlStatusEl = document.getElementById('sim-ml-status');
    if (mlStatusEl) mlStatusEl.innerHTML = "<span style='color: #38bdf8;'>Aborted by User</span>";
  }
}

function fireAutonomousDispatch() {
  logMessage("📡 [AUTONOMOUS DISPATCH FIRED] Rider unresponsive. 30s elapsed. Dispatching SOS payload:", "danger");
  
  const payload = {
    incident_id: "EMERG-BLR-" + Math.floor(100000 + Math.random() * 900000),
    timestamp: new Date().toISOString(),
    telemetry: {
      gps: { lat: 12.9716, lng: 77.5946, location_name: "Hebbal Flyover North Bypass" },
      peak_g_force: 8.65,
      impact_delta_v_kmh: 55.0,
      resting_roll_deg: 86.2,
      probable_trauma_score: "HIGH (Code Red)"
    },
    victim: {
      vehicle_reg: "KA-01-EQ-9241",
      blood_group: "O+ (From Registered Profile)",
      emergency_contacts_notified: ["+91 98765 43210", "+91 91234 56789"]
    }
  };

  logMessage(JSON.stringify(payload, null, 2), "info");
  logMessage("🚑 [EMS GATEWAY 108] HTTP 201 Created. Ambulance Unit #44 Dispatched with ALS (Advanced Life Support). Estimated Arrival: 11 mins.", "success");
  logMessage("📱 [SMS GATEWAY] Family notified via SMS with live tracking link.", "success");
}

function logMessage(msg, type = "info") {
  const consoleBody = document.getElementById('consoleLog');
  if (!consoleBody) return;
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.innerHTML = `[${time}] ${msg.replace(/\n/g, '<br>')}`;
  consoleBody.appendChild(line);
  consoleBody.scrollTop = consoleBody.scrollHeight;
}

function clearConsole() {
  const consoleBody = document.getElementById('consoleLog');
  if (consoleBody) consoleBody.innerHTML = '';
}

// 60-Second Pitch Teleprompter Engine
function startPitchTimer() {
  if (isPitchRunning) return;
  isPitchRunning = true;
  pitchSecondsRemaining = 60;
  updatePitchTimerUI();

  document.getElementById('btn-start-pitch').textContent = "⏸ Running...";
  document.getElementById('btn-start-pitch').disabled = true;

  clearInterval(pitchTimerInterval);
  pitchTimerInterval = setInterval(() => {
    pitchSecondsRemaining--;
    updatePitchTimerUI();

    const elapsed = 60 - pitchSecondsRemaining;
    highlightScriptBlock(elapsed);

    if (pitchSecondsRemaining <= 0) {
      clearInterval(pitchTimerInterval);
      isPitchRunning = false;
      document.getElementById('btn-start-pitch').textContent = "▶ Start Pitch Timer";
      document.getElementById('btn-start-pitch').disabled = false;
    }
  }, 1000);
}

function resetPitchTimer() {
  clearInterval(pitchTimerInterval);
  isPitchRunning = false;
  pitchSecondsRemaining = 60;
  updatePitchTimerUI();
  document.getElementById('btn-start-pitch').textContent = "▶ Start Pitch Timer";
  document.getElementById('btn-start-pitch').disabled = false;
  document.querySelectorAll('.script-block').forEach(b => b.classList.remove('active'));
}

function updatePitchTimerUI() {
  const timerEl = document.getElementById('pitch-timer');
  if (timerEl) {
    timerEl.textContent = pitchSecondsRemaining;
    if (pitchSecondsRemaining <= 10) {
      timerEl.style.color = "var(--accent-rose)";
    } else {
      timerEl.style.color = "var(--accent-amber)";
    }
  }
}

function highlightScriptBlock(elapsedSeconds) {
  const blocks = document.querySelectorAll('.script-block');
  blocks.forEach(block => {
    const start = parseInt(block.getAttribute('data-start'));
    const end = parseInt(block.getAttribute('data-end'));
    const isActive = elapsedSeconds >= start && elapsedSeconds < end;
    block.classList.toggle('active', isActive);
    if (isActive) {
      block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

// Speech Synthesis Demo for Pitch
let synth = null;
function setupSpeechSynthesis() {
  if ('speechSynthesis' in window) {
    synth = window.speechSynthesis;
  }
}

function speakPitch() {
  if (!synth) {
    alert("Speech Synthesis not supported in this browser.");
    return;
  }
  if (synth.speaking) {
    synth.cancel();
    return;
  }

  const scriptText = `
    In India, over 150,000 people die on roads every year—and 44% are two-wheeler riders. 
    Tragically, most don't die upon impact; they die because they were riding alone at midnight, crashed into a dark ditch, and bled out because nobody knew.
    We built AegisRide to conquer the trauma Golden Hour. 
    Our IoT sensor pod continuously streams 6-axis kinematics. 
    Our edge Machine Learning model analyzes real-time G-force and tilt to reject potholes and dropped phones with 99% accuracy. 
    If a genuine crash occurs and the rider doesn't override our 30-second alarm, our autonomous AI agent dispatches precise GPS coordinates and trauma severity directly to the nearest hospital.
    Notice what we deliberately left out: Natural Language Processing. 
    When a rider is unconscious or wind is roaring at 60 kilometers an hour, speech recognition is useless. 
    Crash physics is vector dynamics, not grammar.
    Using the right technologies, not all of them, is what saves lives. 
    AegisRide guarantees that no rider is ever left alone in the dark. Thank you.
  `;

  const utterance = new SpeechSynthesisUtterance(scriptText);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  
  startPitchTimer();
  synth.speak(utterance);
}

// SLIDE 13: TWIST CARDS DATA & ENGINE
const twistData = {
  T1: {
    id: "T1",
    title: "Budget Cut (70% Less Money)",
    prompt: "70% less money. What goes first?",
    whatGoesFirst: "The dedicated hardware pod (custom ARM microcontroller, PCB manufacturing, custom waterproof enclosure, and standalone cellular module) is completely eliminated.",
    thePivot: "Pivot to a Software-Only Smartphone Edge App. Modern smartphones already contain calibrated 6-DOF IMUs and GPS chips. Our TinyML inference model runs on the smartphone's background NPU/CPU whenever the rider's phone is in their pocket or mounted on the handlebar. Hardware BOM drops from $35 to $0.",
    defenseQuote: "We eliminate hardware manufacturing costs while preserving 100% of our core algorithmic detection and autonomous triage logic on existing consumer smartphones."
  },
  T2: {
    id: "T2",
    title: "No Internet / Connectivity Drops",
    prompt: "Connectivity drops. How does it cope?",
    whatGoesFirst: "Real-time cloud HTTP REST APIs and high-bandwidth telemetry uploads become unavailable.",
    thePivot: "Three-Tier Autonomous Resilience: (1) Detection & 30s override countdown run 100% on the local edge chip without internet; (2) Cellular dispatch falls back to ultra-low-bandwidth 2G GSM SMS / USSD telemetry packets (transmitting raw lat/long coordinates on just 1 bar of signal); (3) Bike hardware fires a local 110dB piezo siren and 4Hz hazard strobes to alert passing highway motorists.",
    defenseQuote: "AegisRide is edge-autonomous by design. The cloud is an alert recipient, never a dependency for crash detection."
  },
  T3: {
    id: "T3",
    title: "Biased Data (One Group Only)",
    prompt: "Data came from one group only.",
    whatGoesFirst: "One-size-fits-all model assumptions (e.g. training only on smooth asphalt or expensive sports bikes).",
    thePivot: "Synthetic Kinematic Augmentation + Federated Local Baselining. We augment training datasets with synthetic physics models simulating varied motorcycle masses (from 100cc mopeds to cargo delivery e-bikes). Furthermore, the device runs a 3-day passive onboarding calibration that learns each individual vehicle's suspension floor and pothole vibration signature.",
    defenseQuote: "We normalize jerk (dG/dt) against each individual rider's rolling baseline, ensuring equitable accuracy across all economic vehicle classes."
  },
  T4: {
    id: "T4",
    title: "Privacy Backlash (Surveillance Fears)",
    prompt: "Users learn what you collect.",
    whatGoesFirst: "Any continuous cloud telemetry logging or persistent route history.",
    thePivot: "Zero-Knowledge Ephemeral RAM Architecture. We publish an open-source firmware audit: GPS coordinates and motion vectors are processed strictly in a 5-second circular ring buffer in volatile RAM. No trip history, location logs, or speeds are ever written to disk or transmitted during normal riding. Telemetry is unlocked and broadcast ONLY if an uncancelled crash occurs.",
    defenseQuote: "We do not track your journey; we only broadcast your rescue. Zero trip tracking, zero surveillance."
  },
  T5: {
    id: "T5",
    title: "Sensor Failure (20% Faulty Readings)",
    prompt: "20% of readings are faulty.",
    whatGoesFirst: "Naive single-sensor threshold triggers.",
    thePivot: "Extended Kalman Filtering (EKF) + Multi-Modal Degraded Consensus. If an accelerometer axis clips or drifts, the system requires secondary consensus: GNSS sudden Doppler speed loss (ΔV > 35 km/h) combined with vehicle roll tilt inversion before flagging an emergency. Faulty sensor drift is mathematically rejected as anomalous noise.",
    defenseQuote: "Our decision boundary requires cross-sensor coherence across 6 degrees of freedom. Single-sensor glitches are mathematically filtered."
  },
  T6: {
    id: "T6",
    title: "False Alarms (10 False Alarms Per Real One)",
    prompt: "10 false alarms per real one.",
    whatGoesFirst: "Instantaneous dispatch without physical confirmation.",
    thePivot: "Post-Impact Stability Inspection + Multi-Stage Escalation. We inspect the 2-second post-impact window: genuine crashes leave the vehicle stationary on its side (>65° roll). In addition, the progressive 30-second escalating haptic/acoustic buzzer gives conscious riders immediate one-tap override control before any ambulance is alerted.",
    defenseQuote: "By inspecting post-crash resting stability and enforcing a 30s rider check, 99.4% of road noise and false alarms are suppressed."
  },
  T7: {
    id: "T7",
    title: "Language Gap (Multilingual Demographics)",
    prompt: "Half the users speak another language.",
    whatGoesFirst: "English-only textual prompts or voice commands.",
    thePivot: "Sensory Non-Verbal UI + Dynamic Regional SMS Localization. The on-vehicle override interface uses zero text: distinct acoustic siren tones, aggressive haptic vibration, and a prominent physical cancel button. For dispatch and family alerts, the AI agent dynamically formats SMS alerts into the recipient's native regional language (Hindi, Tamil, Kannada, Telugu, etc.).",
    defenseQuote: "Emergency protection should never depend on literacy or language. Our device interface is sensory; our dispatch alerts are multilingual."
  },
  T8: {
    id: "T8",
    title: "Over-Trust & Moral Hazard",
    prompt: "Users follow it blindly.",
    whatGoesFirst: "Any marketing framing AegisRide as an active safety or accident-prevention device.",
    thePivot: "Passive Digital Airbag Positioning. AegisRide is strictly framed, certified, and insured as an aftermath trauma mitigation system—identical to a car's physical airbag or seatbelt. Rider onboarding emphasizes that physics always wins: AegisRide cannot prevent a collision; it only ensures you don't bleed out unseen.",
    defenseQuote: "A digital airbag cannot prevent a crash. We position the system strictly as aftermath trauma triage, not an autopilot."
  },
  T9: {
    id: "T9",
    title: "Adversarial Attack & Fake Data",
    prompt: "Someone feeds it fake data.",
    whatGoesFirst: "Unauthenticated software sensor inputs.",
    thePivot: "Hardware Cryptographic Attestation + Kinematic Physics Plausibility. Sensor data is signed at the hardware layer via an ATECC608A crypto co-processor. Software spoofing or shaking a phone by hand is rejected because true crashes require multi-sensor coherence: sudden multi-G impulse MUST correlate with an instantaneous drop in GPS Doppler forward ground speed.",
    defenseQuote: "You can shake a sensor in your hand, but you cannot fake matching GPS Doppler deceleration without actually travelling at 60 km/h."
  },
  T10: {
    id: "T10",
    title: "Rapid Scale-Up (100 ➔ 100,000 Users)",
    prompt: "100 users become 100,000.",
    whatGoesFirst: "Centralized server-side streaming architectures.",
    thePivot: "Decentralized Edge Computing Architecture. Because 100% of continuous sensor sampling, signal filtering, and TinyML inference runs locally on the edge device, 100,000 active riders generate zero idle server compute load. Cloud servers only receive packets when a verified crash occurs (~0.001% of the time), enabling effortless horizontal scaling on modest infrastructure.",
    defenseQuote: "Our backend server load is O(1) during normal operation because intelligence lives on the edge, not in a centralized cloud."
  }
};

function selectTwist(twistId) {
  const data = twistData[twistId];
  if (!data) return;

  document.querySelectorAll('.twist-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-twist') === twistId);
  });

  const detailEl = document.getElementById('twistDetailCard');
  if (!detailEl) return;

  detailEl.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
      <div>
        <span class="badge yellow" style="margin-bottom: 6px;">Twist Card ${data.id}</span>
        <h3 style="font-size: 1.4rem; color: #fff;">${data.title}</h3>
        <p style="color: var(--accent-amber); font-size: 1.05rem; font-weight: 600; margin-top: 4px;">
          ${data.prompt}
        </p>
      </div>
      <div style="font-family: var(--font-mono); font-size: 0.8rem; background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); padding: 4px 12px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">
        Evaluator Stress Challenge
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
      <div style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.25); padding: 16px; border-radius: 8px;">
        <strong style="color: var(--accent-rose); font-size: 0.82rem; text-transform: uppercase; display: block; margin-bottom: 6px;">
          ✂️ What Goes First / The Immediate Vulnerability:
        </strong>
        <p style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">
          ${data.whatGoesFirst}
        </p>
      </div>

      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 16px; border-radius: 8px;">
        <strong style="color: var(--accent-emerald); font-size: 0.82rem; text-transform: uppercase; display: block; margin-bottom: 6px;">
          🔄 The Architectural Pivot & Survival Strategy:
        </strong>
        <p style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">
          ${data.thePivot}
        </p>
      </div>
    </div>

    <div style="padding: 14px 18px; background: rgba(56, 189, 248, 0.08); border-left: 4px solid var(--accent-cyan); border-radius: 4px;">
      <strong style="color: var(--accent-cyan); font-size: 0.8rem; text-transform: uppercase; display: block; margin-bottom: 4px;">
        🗣️ Ready Spoken Defense for the Professor:
      </strong>
      <p style="font-size: 0.95rem; color: #fff; font-style: italic;">
        "${data.defenseQuote}"
      </p>
    </div>
  `;
}

function spinRandomTwist() {
  const keys = Object.keys(twistData);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  
  // Quick visual animation
  let count = 0;
  const interval = setInterval(() => {
    const tempKey = keys[count % keys.length];
    document.querySelectorAll('.twist-card').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-twist') === tempKey);
    });
    count++;
    if (count > 12) {
      clearInterval(interval);
      selectTwist(randomKey);
      const targetCard = document.querySelector(`.twist-card[data-twist="${randomKey}"]`);
      if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 70);
}
