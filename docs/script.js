(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ARC = 75;

  const instrument = document.querySelector("[data-instrument]");
  const previewButton = document.querySelector("[data-preview-button]");
  const previewLabel = document.querySelector("[data-preview-label]");
  const previewTag = document.querySelector("[data-preview-tag]");
  const statusDot = document.querySelector("[data-status-dot]");
  const statusText = document.querySelector("[data-status-text]");
  const gauge = document.querySelector("[data-gauge]");
  const gaugeProgress = document.querySelector("[data-gauge-progress]");
  const gaugeLabel = document.querySelector("[data-gauge-label]");
  const gaugeNumber = document.querySelector("[data-gauge-number]");
  const gaugeUnit = document.querySelector("[data-gauge-unit]");
  const summary = document.querySelector("[data-preview-summary]");
  const readouts = {
    ping: document.querySelector('[data-readout="ping"]'),
    download: document.querySelector('[data-readout="download"]'),
    upload: document.querySelector('[data-readout="upload"]'),
  };
  const meta = {
    isp: document.querySelector('[data-meta="isp"]'),
    location: document.querySelector('[data-meta="location"]'),
    jitter: document.querySelector('[data-meta="jitter"]'),
  };

  const sample = {
    ping: 8.4,
    jitter: 1.2,
    download: 486.2,
    upload: 94.8,
  };

  const stages = [
    {
      status: "Measuring latency",
      tone: "signal",
      label: "Latency",
      unit: "ms",
      value: sample.ping,
      max: 20,
      decimals: 1,
      readout: "ping",
    },
    {
      status: "Measuring download",
      tone: "signal",
      label: "Download",
      unit: "Mbps",
      value: sample.download,
      max: 1000,
      decimals: 1,
      readout: "download",
    },
    {
      status: "Measuring upload",
      tone: "upload",
      label: "Upload",
      unit: "Mbps",
      value: sample.upload,
      max: 250,
      decimals: 1,
      readout: "upload",
    },
  ];

  let running = false;
  let runToken = 0;

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function setGauge(percent) {
    const safe = Math.max(0, Math.min(1, percent));
    gaugeProgress.style.strokeDashoffset = String(ARC - ARC * safe);
  }

  function setStatusTone(tone) {
    statusDot.className = "status-dot";

    if (tone === "signal") statusDot.classList.add("is-signal");
    if (tone === "upload") statusDot.classList.add("is-upload");
    if (tone === "complete") statusDot.classList.add("is-complete");
  }

  function setStatus(text, tone = "neutral") {
    statusText.textContent = text;
    setStatusTone(tone);
  }

  function setReadout(name, value, decimals = 1) {
    if (!readouts[name]) return;
    readouts[name].textContent = Number(value).toFixed(decimals);
  }

  function clearReadout(name) {
    if (readouts[name]) readouts[name].textContent = "—";
  }

  function setMeta(name, value) {
    if (meta[name]) meta[name].textContent = value;
  }

  function clearMeta(name) {
    if (meta[name]) meta[name].textContent = "—";
  }

  function resetPreview() {
    setStatus("Ready", "neutral");
    previewTag.textContent = "Interface preview";
    gauge.dataset.tone = "neutral";
    gaugeLabel.textContent = "Speed";
    gaugeUnit.textContent = "Mbps";
    gaugeNumber.textContent = "0.0";
    gaugeNumber.dataset.current = "0";
    setGauge(0);
    Object.keys(readouts).forEach(clearReadout);
    Object.keys(meta).forEach(clearMeta);
    summary.textContent = "";
    if (instrument) instrument.setAttribute("aria-busy", "false");
  }

  function showSampleComplete() {
    setStatus("Preview complete", "complete");
    previewTag.textContent = "Sample · not live";
    gauge.dataset.tone = "signal";
    gaugeLabel.textContent = "Download";
    gaugeUnit.textContent = "Mbps";
    gaugeNumber.textContent = sample.download.toFixed(1);
    gaugeNumber.dataset.current = String(sample.download);
    setGauge(sample.download / 1000);
    setReadout("ping", sample.ping);
    setReadout("download", sample.download);
    setReadout("upload", sample.upload);
    setMeta("isp", "Sample ISP");
    setMeta("location", "Sample city, DE");
    setMeta("jitter", `${sample.jitter.toFixed(1)} ms`);
    summary.textContent =
      "Sample preview complete. Download 486.2 Mbps, upload 94.8 Mbps, latency 8.4 milliseconds, jitter 1.2 milliseconds. These are illustrative values only, not a measurement of this connection.";
    if (instrument) instrument.setAttribute("aria-busy", "false");
    if (previewButton) previewButton.disabled = false;
    if (previewLabel) previewLabel.textContent = "Replay preview";
  }

  function animateNumber(element, from, to, decimals, duration) {
    if (!element) return Promise.resolve();

    element.dataset.current = String(from);
    element.textContent = from.toFixed(decimals);
    const startValue = Number(from);

    if (reducedMotion.matches || duration <= 0) {
      element.dataset.current = String(to);
      element.textContent = to.toFixed(decimals);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const started = performance.now();

      const frame = (now) => {
        const elapsed = Math.min((now - started) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        const current = startValue + (to - startValue) * eased;

        element.dataset.current = String(current);
        element.textContent = current.toFixed(decimals);

        if (elapsed < 1) {
          window.requestAnimationFrame(frame);
        } else {
          element.dataset.current = String(to);
          element.textContent = to.toFixed(decimals);
          resolve();
        }
      };

      window.requestAnimationFrame(frame);
    });
  }

  async function runPreview() {
    if (running) return;

    running = true;
    const token = ++runToken;

    if (previewButton) previewButton.disabled = true;
    if (previewLabel) previewLabel.textContent = "Previewing…";
    if (instrument) instrument.setAttribute("aria-busy", "true");
    resetPreview();

    if (reducedMotion.matches) {
      showSampleComplete();
      running = false;
      return;
    }

    for (const stage of stages) {
      if (token !== runToken) return;

      setStatus(stage.status, stage.tone);
      gauge.dataset.tone = stage.tone;
      gaugeLabel.textContent = stage.label;
      gaugeUnit.textContent = stage.unit;
      gaugeNumber.dataset.current = "0";
      setGauge(stage.value / stage.max);

      await animateNumber(gaugeNumber, 0, stage.value, stage.decimals, 620);
      if (token !== runToken) return;

      setReadout(stage.readout, stage.value, stage.decimals);
      await wait(180);
    }

    if (token !== runToken) return;
    showSampleComplete();
    running = false;
  }

  if (previewButton) {
    previewButton.hidden = false;
    previewButton.addEventListener("click", () => {
      void runPreview();
    });
  }

  previewTag.textContent = "Interface preview";

  // Copy the quickstart commands. Use the clipboard API where available and a
  // hidden textarea fallback for browsers that only allow execCommand.
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Clipboard permission can be denied even in a secure context. Fall
        // through to the selection-based path instead of failing the control.
      }
    }

    const previousFocus = document.activeElement;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      if (!copied) throw new Error("Copy command failed");
    } finally {
      textarea.remove();
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus({ preventScroll: true });
      }
    }
  }

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    const label = button.querySelector("[data-copy-label]");

    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;

      const commands = Array.from(target.querySelectorAll(".command"))
        .map((line) => line.textContent.trim())
        .join("\n");

      try {
        await copyText(commands);
        if (label) label.textContent = "Copied";
        button.setAttribute("aria-label", "Commands copied to clipboard");
      } catch {
        if (label) label.textContent = "Copy failed";
        button.setAttribute("aria-label", "Could not copy commands");
      }

      window.setTimeout(() => {
        if (label) label.textContent = "Copy";
        button.setAttribute("aria-label", "Copy setup commands");
      }, 2200);
    });
  });

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  // Keep the in-page navigation honest as the reader moves between sections.
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const navTargets = navLinks
    .map((link) => {
      const section = document.querySelector(link.getAttribute("href"));
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  let navFrame = 0;

  function updateCurrentNav() {
    const marker = window.scrollY + window.innerHeight * 0.35;
    let active = null;

    for (const item of navTargets) {
      const top = item.section.getBoundingClientRect().top + window.scrollY;
      const bottom = top + item.section.offsetHeight;
      if (marker >= top && marker < bottom) active = item.link;
    }

    navLinks.forEach((link) => link.removeAttribute("aria-current"));
    if (active) active.setAttribute("aria-current", "location");
  }

  function queueNavUpdate() {
    if (navFrame) return;
    navFrame = window.requestAnimationFrame(() => {
      navFrame = 0;
      updateCurrentNav();
    });
  }

  if (navTargets.length > 0) {
    window.addEventListener("scroll", queueNavUpdate, { passive: true });
    window.addEventListener("resize", queueNavUpdate, { passive: true });
    updateCurrentNav();
  }
})();
