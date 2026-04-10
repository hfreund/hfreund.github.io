/**
 * Terminal landing: typewriter FSM + Web Audio (mainframe-style hum; keystrokes optional).
 */
(function () {
  "use strict";

  /** Set true to bring back synthesized key clicks during typing */
  var KEYSTROKES_ENABLED = false;

  var FULL_TYPED = "Hello world. My name is Hugh. I am a designer.";
  var FINAL_MESSAGE = "Hello world. My name is Hugh. I am a builder at Auth0.";
  var DELETE_SUFFIX = "designer.";
  var ADD_SUFFIX = "builder at Auth0.";
  var AUTH0_LINK_CLASS = "typed-auth0-link";
  var AUTH0_HREF = "https://auth0.design/";
  var STORAGE_MUTE = "hf-landing-muted";

  /* Base timings; +35% vs original for slower typing */
  var TYPE_MS = 74;
  var PAUSE_MS = 1200;
  var DELETE_MS = 51;
  var PERIOD_PAUSE_MS = 720;
  var START_DELAY_MS = 2800;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var typedEl = document.getElementById("typed");
  var muteBtn = document.getElementById("mute-btn");
  var srStatus = document.getElementById("sr-status");
  var terminalBlock = document.getElementById("terminal-block");

  if (!typedEl || !muteBtn || !srStatus || !terminalBlock) {
    return;
  }

  var audioCtx = null;
  var masterGain = null;
  var humNodes = null;
  var muted = false;
  /** True after user toggles mute before or during startup — do not overwrite from storage in onStart */
  var muteTouchedByUser = false;
  var started = false;
  var animationComplete = false;

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function getAudioContext() {
    if (audioCtx) {
      return audioCtx;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      return null;
    }
    try {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      audioCtx = null;
      masterGain = null;
      return null;
    }
    return audioCtx;
  }

  function resumeAudio() {
    var ctx = getAudioContext();
    if (!ctx) {
      return Promise.resolve();
    }
    if (ctx.state === "suspended") {
      return ctx.resume();
    }
    return Promise.resolve();
  }

  function startHum() {
    if (!audioCtx || humNodes) return;
    var ctx = audioCtx;

    var humOsc = ctx.createOscillator();
    humOsc.type = "sine";
    humOsc.frequency.value = 38;

    /* Pitch drift — motor / fan imperfection (~0.6–0.8 s per cycle) */
    var pitchLfo = ctx.createOscillator();
    pitchLfo.type = "sine";
    pitchLfo.frequency.value = 1.42;
    var pitchDepth = ctx.createGain();
    pitchDepth.gain.value = 0.4;
    pitchLfo.connect(pitchDepth);
    pitchDepth.connect(humOsc.frequency);
    pitchLfo.start();

    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 165;

    var humGain = ctx.createGain();
    humGain.gain.value = 0.036;

    /* Amplitude swell — churn (~0.85–1.1 s per cycle), offset from pitch LFO */
    var ampLfo = ctx.createOscillator();
    ampLfo.type = "sine";
    ampLfo.frequency.value = 1.08;
    var ampDepth = ctx.createGain();
    ampDepth.gain.value = 0.0062;
    ampLfo.connect(ampDepth);
    ampDepth.connect(humGain.gain);
    ampLfo.start();

    humOsc.connect(filter).connect(humGain).connect(masterGain);
    humOsc.start();

    humNodes = {
      osc: humOsc,
      pitchLfo: pitchLfo,
      ampLfo: ampLfo,
      pitchDepth: pitchDepth,
      ampDepth: ampDepth,
    };
  }

  function stopHum() {
    if (!humNodes) return;
    try {
      humNodes.osc.stop();
      humNodes.pitchLfo.stop();
      humNodes.ampLfo.stop();
    } catch (e) {
      /* ignore */
    }
    humNodes = null;
  }

  function setOutputGain(level) {
    if (!audioCtx || !masterGain) return;
    var t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(level, t);
  }

  /**
   * Mechanical key: low sine "thock" (dominant) + mid-band impact + short low rumble.
   * Avoids trebly high-pass noise that reads as thin / tinny.
   */
  function playKeystroke(kind) {
    if (!KEYSTROKES_ENABLED) return;
    if (!audioCtx || muted || !masterGain) return;
    if (masterGain.gain.value < 0.001) return;
    var ctx = audioCtx;
    var t0 = ctx.currentTime;
    var isDelete = kind === "delete";

    var bodyHz = (isDelete ? 146 : 176) + (Math.random() * 22 - 11);
    var bodyMs = (isDelete ? 0.05 : 0.063) + Math.random() * 0.014;
    var thockGain = (isDelete ? 0.098 : 0.125) * (0.93 + Math.random() * 0.14);

    var osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(bodyHz, t0);
    var bodyLp = ctx.createBiquadFilter();
    bodyLp.type = "lowpass";
    bodyLp.frequency.value = isDelete ? 380 : 480;
    bodyLp.Q.value = 0.65;
    var gBody = ctx.createGain();
    gBody.gain.setValueAtTime(0, t0);
    gBody.gain.linearRampToValueAtTime(thockGain, t0 + 0.0007);
    gBody.gain.exponentialRampToValueAtTime(0.001, t0 + bodyMs);
    osc.connect(bodyLp).connect(gBody).connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + bodyMs + 0.02);

    var impactMs = (isDelete ? 0.0085 : 0.0105) + Math.random() * 0.003;
    var nFrames = Math.ceil(ctx.sampleRate * impactMs);
    var buf = ctx.createBuffer(1, nFrames, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var i;
    for (i = 0; i < nFrames; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    var noiseImpact = ctx.createBufferSource();
    noiseImpact.buffer = buf;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = (isDelete ? 780 : 960) + Math.random() * 200;
    bp.Q.value = 1.05;
    var gImpact = ctx.createGain();
    var impactGain = (isDelete ? 0.034 : 0.046) * (0.9 + Math.random() * 0.2);
    gImpact.gain.setValueAtTime(0, t0);
    gImpact.gain.linearRampToValueAtTime(impactGain, t0 + 0.0003);
    gImpact.gain.exponentialRampToValueAtTime(0.001, t0 + impactMs);
    noiseImpact.connect(bp).connect(gImpact).connect(masterGain);
    noiseImpact.start(t0);
    noiseImpact.stop(t0 + impactMs + 0.002);

    var rumbleMs = 0.016 + Math.random() * 0.005;
    var bufR = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * rumbleMs), ctx.sampleRate);
    var dR = bufR.getChannelData(0);
    for (i = 0; i < dR.length; i++) {
      dR[i] = Math.random() * 2 - 1;
    }
    var noiseRumble = ctx.createBufferSource();
    noiseRumble.buffer = bufR;
    var lpR = ctx.createBiquadFilter();
    lpR.type = "lowpass";
    lpR.frequency.value = 260;
    lpR.Q.value = 0.71;
    var gRumble = ctx.createGain();
    var rumbleGain = (isDelete ? 0.02 : 0.03) * (0.88 + Math.random() * 0.2);
    gRumble.gain.setValueAtTime(0, t0);
    gRumble.gain.linearRampToValueAtTime(rumbleGain, t0 + 0.00045);
    gRumble.gain.exponentialRampToValueAtTime(0.001, t0 + rumbleMs);
    noiseRumble.connect(lpR).connect(gRumble).connect(masterGain);
    noiseRumble.start(t0);
    noiseRumble.stop(t0 + rumbleMs + 0.002);
  }

  function applyMuteState() {
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    muteBtn.textContent = muted ? "Sound off" : "Sound on";
    try {
      localStorage.setItem(STORAGE_MUTE, muted ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
    if (!masterGain || !audioCtx) return;
    setOutputGain(muted ? 0 : 1);
  }

  function setTypedWithAuth0Link() {
    typedEl.textContent = "";
    var prefix = "Hello world. My name is Hugh. I am a builder at ";
    typedEl.appendChild(document.createTextNode(prefix));
    var a = document.createElement("a");
    a.href = AUTH0_HREF;
    a.className = AUTH0_LINK_CLASS;
    a.textContent = "Auth0";
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    typedEl.appendChild(a);
    typedEl.appendChild(document.createTextNode("."));
  }

  function runReducedMotion() {
    setTypedWithAuth0Link();
    terminalBlock.removeAttribute("aria-hidden");
    muteBtn.hidden = false;
    muted = true;
    muteBtn.disabled = true;
    muteBtn.textContent = "Sound off";
    muteBtn.setAttribute("aria-pressed", "true");
    srStatus.textContent = FINAL_MESSAGE;
  }

  async function runTypewriter() {
    var text = "";
    var i;
    var ch;
    for (i = 0; i < FULL_TYPED.length; i++) {
      ch = FULL_TYPED.charAt(i);
      text += ch;
      typedEl.textContent = text;
      playKeystroke("type");
      await delay(TYPE_MS);
      if (ch === ".") {
        await delay(PERIOD_PAUSE_MS);
      }
    }
    await delay(PAUSE_MS);
    for (i = 0; i < DELETE_SUFFIX.length; i++) {
      text = text.slice(0, -1);
      typedEl.textContent = text;
      playKeystroke("delete");
      await delay(DELETE_MS);
    }
    for (i = 0; i < ADD_SUFFIX.length; i++) {
      ch = ADD_SUFFIX.charAt(i);
      text += ch;
      typedEl.textContent = text;
      playKeystroke("type");
      await delay(TYPE_MS);
      if (ch === ".") {
        await delay(PERIOD_PAUSE_MS);
      }
    }
    setTypedWithAuth0Link();
  }

  function finishAnimation() {
    animationComplete = true;
    terminalBlock.removeAttribute("aria-hidden");
    srStatus.textContent = FINAL_MESSAGE;
  }

  function resumeAudioThenMaybeHum() {
    return resumeAudio()
      .then(function () {
        getAudioContext();
        if (!muted && started && !humNodes) {
          startHum();
        }
      })
      .catch(function () {
        /* Autoplay policy: may stay suspended until user gesture */
      });
  }

  async function onStart() {
    if (started) return;
    started = true;
    getAudioContext();
    /* Keep in-memory muted (init + any pre-start clicks); re-reading storage here overwrote user toggles */
    if (!muteTouchedByUser) {
      muted = localStorage.getItem(STORAGE_MUTE) === "1";
    }
    applyMuteState();

    muteBtn.hidden = false;

    /* Do not await: Chrome may leave AudioContext suspended until interaction; awaiting blocked the typewriter */
    resumeAudioThenMaybeHum();

    try {
      await runTypewriter();
    } finally {
      finishAnimation();
    }
  }

  function attachAudioUnlockOnGesture() {
    /* Cheap to repeat: resume/startHum no-op when already running */
    function onGesture() {
      resumeAudioThenMaybeHum();
    }
    document.addEventListener("pointerdown", onGesture, { capture: true, passive: true });
    document.addEventListener("keydown", onGesture, { capture: true, passive: true });
  }

  function init() {
    if (prefersReducedMotion) {
      runReducedMotion();
      return;
    }

    terminalBlock.setAttribute("aria-hidden", "true");
    attachAudioUnlockOnGesture();
    setTimeout(function () {
      onStart();
    }, START_DELAY_MS);

    muteBtn.addEventListener("click", function () {
      muteTouchedByUser = true;
      muted = !muted;
      applyMuteState();
      resumeAudioThenMaybeHum();
    });

    var stored = localStorage.getItem(STORAGE_MUTE);
    if (stored === "1") {
      muted = true;
    }
  }

  init();
})();

/**
 * Scene tuning drawer: sliders mirror :root in landing.css (defaults object below). ⌘/ or Ctrl+/ toggles.
 */
(function () {
  "use strict";

  var root = document.documentElement;

  var elBackdrop = document.getElementById("crt-debug-backdrop");
  var elDrawer = document.getElementById("crt-debug-drawer");
  var elGap = document.getElementById("crt-debug-gap");
  var elLineW = document.getElementById("crt-debug-line-w");
  var elDiffusion = document.getElementById("crt-debug-diffusion");
  var elOpacity = document.getElementById("crt-debug-opacity");
  var elCenterOp = document.getElementById("crt-debug-center-op");
  var elCenterFade = document.getElementById("crt-debug-center-fade");
  var elCenterW = document.getElementById("crt-debug-center-w");
  var elCenterH = document.getElementById("crt-debug-center-h");
  var elCenterY = document.getElementById("crt-debug-center-y");
  var elEdgeBorderOp = document.getElementById("crt-debug-edge-border-op");
  var elEdgeBw = document.getElementById("crt-debug-edge-bw");
  var elEdgeGlow = document.getElementById("crt-debug-edge-glow");
  var elEdgeGlowOp = document.getElementById("crt-debug-edge-glow-op");
  var elOut = document.getElementById("crt-debug-output");
  var elValGap = document.getElementById("crt-debug-val-gap");
  var elValLineW = document.getElementById("crt-debug-val-line-w");
  var elValDiff = document.getElementById("crt-debug-val-diffusion");
  var elValOp = document.getElementById("crt-debug-val-opacity");
  var elValCenterOp = document.getElementById("crt-debug-val-center-op");
  var elValCenterFade = document.getElementById("crt-debug-val-center-fade");
  var elValCenterW = document.getElementById("crt-debug-val-center-w");
  var elValCenterH = document.getElementById("crt-debug-val-center-h");
  var elValCenterY = document.getElementById("crt-debug-val-center-y");
  var elValEdgeBorderOp = document.getElementById("crt-debug-val-edge-border-op");
  var elValEdgeBw = document.getElementById("crt-debug-val-edge-bw");
  var elValEdgeGlow = document.getElementById("crt-debug-val-edge-glow");
  var elValEdgeGlowOp = document.getElementById("crt-debug-val-edge-glow-op");
  var btnCopy = document.getElementById("crt-debug-copy");
  var btnReset = document.getElementById("crt-debug-reset");
  var bgCenterEl = document.getElementById("bg-center-radial");
  var edgeBorderEl = document.getElementById("edge-border");

  if (
    !elBackdrop ||
    !elDrawer ||
    !elGap ||
    !elLineW ||
    !elDiffusion ||
    !elOpacity ||
    !elCenterOp ||
    !elCenterFade ||
    !elCenterW ||
    !elCenterH ||
    !elCenterY ||
    !elEdgeBorderOp ||
    !elEdgeBw ||
    !elEdgeGlow ||
    !elEdgeGlowOp ||
    !elOut ||
    !btnCopy ||
    !btnReset
  ) {
    return;
  }

  var drawerOpen = false;
  var lastFocus = null;

  function setDrawerOpen(open) {
    drawerOpen = open;
    elBackdrop.classList.toggle("crt-debug-backdrop--visible", open);
    elDrawer.classList.toggle("crt-debug-drawer--open", open);
    elBackdrop.setAttribute("aria-hidden", open ? "false" : "true");
    elDrawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      elDrawer.removeAttribute("inert");
      lastFocus = document.activeElement;
      requestAnimationFrame(function () {
        elGap.focus();
      });
    } else {
      elDrawer.setAttribute("inert", "");
      if (lastFocus && typeof lastFocus.focus === "function" && document.contains(lastFocus)) {
        lastFocus.focus();
      }
      lastFocus = null;
    }
  }

  elDrawer.setAttribute("inert", "");

  document.addEventListener(
    "keydown",
    function (e) {
      var mod = e.metaKey || e.ctrlKey;
      var isSlash = e.key === "/" || e.code === "Slash";
      if (mod && isSlash) {
        e.preventDefault();
        setDrawerOpen(!drawerOpen);
        return;
      }
      if (drawerOpen && e.key === "Escape") {
        e.preventDefault();
        setDrawerOpen(false);
      }
    },
    true
  );

  elBackdrop.addEventListener("click", function () {
    setDrawerOpen(false);
  });

  var DIFFUSION_MAX_BLUR = 10;
  var DIFFUSION_MAX_GLOW = 6.5;

  var defaults = {
    gap: 3,
    lineW: 1,
    diffusion: 5.5,
    opacityPct: 30,
    centerOp: 15,
    centerFade: 35,
    centerW: 70,
    centerH: 100,
    centerY: 45,
    edgeBorderOp: 30,
    edgeBw: 1,
    edgeGlow: 24,
    edgeGlowOp: 28,
  };

  function diffusionToBlurGlow(D) {
    var blurPx = (D / 100) * DIFFUSION_MAX_BLUR;
    var glowPx = (D / 100) * DIFFUSION_MAX_GLOW;
    return { blurPx: blurPx, glowPx: glowPx };
  }

  function setVars() {
    var gap = parseFloat(elGap.value);
    var lineW = parseFloat(elLineW.value);
    var D = parseFloat(elDiffusion.value);
    var opacity = parseFloat(elOpacity.value) / 100;
    var cOp = parseFloat(elCenterOp.value) / 100;
    var cFade = parseFloat(elCenterFade.value);
    var cW = parseFloat(elCenterW.value);
    var cH = parseFloat(elCenterH.value);
    var cY = parseFloat(elCenterY.value);
    var ebOp = parseFloat(elEdgeBorderOp.value) / 100;
    var ebBw = parseFloat(elEdgeBw.value);
    var eGlow = parseFloat(elEdgeGlow.value);
    var eGlowOp = parseFloat(elEdgeGlowOp.value) / 100;
    var bg = diffusionToBlurGlow(D);

    root.style.setProperty("--crt-gap", gap + "px");
    root.style.setProperty("--crt-line-w", lineW + "px");
    root.style.setProperty("--crt-line-end", gap + lineW + "px");
    root.style.setProperty("--crt-blur", bg.blurPx + "px");
    root.style.setProperty("--crt-glow", bg.glowPx + "px");
    root.style.setProperty("--crt-lines-opacity", String(opacity));

    root.style.setProperty("--center-radial-opacity", String(cOp));
    root.style.setProperty("--center-radial-fade-end", cFade + "%");
    root.style.setProperty("--center-radial-ell-w", cW + "%");
    root.style.setProperty("--center-radial-ell-h", cH + "%");
    root.style.setProperty("--center-radial-at-y", cY + "%");

    root.style.setProperty("--edge-border-width", ebBw + "px");
    root.style.setProperty("--edge-border-opacity", String(ebOp));
    root.style.setProperty("--edge-diffusion", eGlow + "px");
    root.style.setProperty("--edge-shadow-opacity", String(eGlowOp));

    function paintCenterRadial() {
      var g =
        "radial-gradient(ellipse " +
        cW +
        "% " +
        cH +
        "% at 50% " +
        cY +
        "%, hsla(155 25% 12% / " +
        cOp +
        ") 0%, transparent " +
        cFade +
        "%)";
      if (bgCenterEl) {
        bgCenterEl.style.background = g;
      }
    }

    function paintEdgeBorder() {
      var b = ebBw + "px solid hsla(155 30% 42% / " + ebOp + ")";
      var s = "0 0 " + eGlow + "px hsla(155 38% 52% / " + eGlowOp + ")";
      if (edgeBorderEl) {
        edgeBorderEl.style.border = b;
        edgeBorderEl.style.boxShadow = eGlow < 0.5 ? "none" : s;
      }
    }

    paintCenterRadial();
    paintEdgeBorder();

    if (elValGap) elValGap.textContent = gap + "px";
    if (elValLineW) elValLineW.textContent = lineW + "px";
    if (elValDiff) elValDiff.textContent = D.toFixed(1);
    if (elValOp) elValOp.textContent = Math.round(parseFloat(elOpacity.value)) + "%";
    if (elValCenterOp) elValCenterOp.textContent = Math.round(parseFloat(elCenterOp.value)) + "%";
    if (elValCenterFade) elValCenterFade.textContent = Math.round(cFade) + "%";
    if (elValCenterW) elValCenterW.textContent = Math.round(cW) + "%";
    if (elValCenterH) elValCenterH.textContent = Math.round(cH) + "%";
    if (elValCenterY) elValCenterY.textContent = Math.round(cY) + "%";
    if (elValEdgeBorderOp) elValEdgeBorderOp.textContent = Math.round(parseFloat(elEdgeBorderOp.value)) + "%";
    if (elValEdgeBw) elValEdgeBw.textContent = ebBw + "px";
    if (elValEdgeGlow) elValEdgeGlow.textContent = Math.round(eGlow) + "px";
    if (elValEdgeGlowOp) elValEdgeGlowOp.textContent = Math.round(parseFloat(elEdgeGlowOp.value)) + "%";

    elOut.textContent = buildOutputText(
      gap,
      lineW,
      D,
      bg.blurPx,
      bg.glowPx,
      opacity,
      cOp,
      cFade,
      cW,
      cH,
      cY,
      ebOp,
      ebBw,
      eGlow,
      eGlowOp
    );
  }

  function buildOutputText(
    gap,
    lineW,
    diffusionPct,
    blurPx,
    glowPx,
    linesOpacity,
    cOp,
    cFade,
    cW,
    cH,
    cY,
    ebOp,
    ebBw,
    eGlow,
    eGlowOp
  ) {
    var lines = [];
    lines.push("=== CRT lines ===");
    lines.push("--crt-gap: " + gap + "px;");
    lines.push("--crt-line-w: " + lineW + "px;");
    lines.push("--crt-line-end: " + round4(gap + lineW) + "px;");
    lines.push("--crt-blur: " + round4(blurPx) + "px;");
    lines.push("--crt-glow: " + round4(glowPx) + "px;");
    lines.push("--crt-lines-opacity: " + round4(linesOpacity) + ";");
    lines.push("");
    lines.push("=== Center radial ===");
    lines.push("--center-radial-opacity: " + round4(cOp) + ";");
    lines.push("--center-radial-fade-end: " + round4(cFade) + "%;");
    lines.push("--center-radial-ell-w: " + round4(cW) + "%;");
    lines.push("--center-radial-ell-h: " + round4(cH) + "%;");
    lines.push("--center-radial-at-y: " + round4(cY) + "%;");
    lines.push("");
    lines.push("=== Viewport border + glow ===");
    lines.push("--edge-border-width: " + round4(ebBw) + "px;");
    lines.push("--edge-border-opacity: " + round4(ebOp) + ";");
    lines.push("--edge-diffusion: " + round4(eGlow) + "px;");
    lines.push("--edge-shadow-opacity: " + round4(eGlowOp) + ";");
    return lines.join("\n");
  }

  function round4(n) {
    return Math.round(n * 10000) / 10000;
  }

  function copyOutput() {
    var text = elOut.textContent || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          btnCopy.textContent = "Copied!";
          setTimeout(function () {
            btnCopy.textContent = "Copy settings";
          }, 1600);
        },
        function () {
          fallbackCopy(text);
        }
      );
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      btnCopy.textContent = "Copied!";
      setTimeout(function () {
        btnCopy.textContent = "Copy settings";
      }, 1600);
    } catch (e) {
      btnCopy.textContent = "Select text below";
    }
    document.body.removeChild(ta);
  }

  function reset() {
    elGap.value = String(defaults.gap);
    elLineW.value = String(defaults.lineW);
    elDiffusion.value = String(defaults.diffusion);
    elOpacity.value = String(defaults.opacityPct);
    elCenterOp.value = String(defaults.centerOp);
    elCenterFade.value = String(defaults.centerFade);
    elCenterW.value = String(defaults.centerW);
    elCenterH.value = String(defaults.centerH);
    elCenterY.value = String(defaults.centerY);
    elEdgeBorderOp.value = String(defaults.edgeBorderOp);
    elEdgeBw.value = String(defaults.edgeBw);
    elEdgeGlow.value = String(defaults.edgeGlow);
    elEdgeGlowOp.value = String(defaults.edgeGlowOp);
    setVars();
  }

  var sliders = [
    elGap,
    elLineW,
    elDiffusion,
    elOpacity,
    elCenterOp,
    elCenterFade,
    elCenterW,
    elCenterH,
    elCenterY,
    elEdgeBorderOp,
    elEdgeBw,
    elEdgeGlow,
    elEdgeGlowOp,
  ];

  ["input", "change"].forEach(function (ev) {
    sliders.forEach(function (el) {
      el.addEventListener(ev, setVars);
    });
  });

  btnCopy.addEventListener("click", copyOutput);
  btnReset.addEventListener("click", reset);

  setVars();
})();

