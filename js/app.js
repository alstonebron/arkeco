/* ARK ECO — scene director. Spatial flow per storyboard 00: hub → map → dive → leg
   → checkpoint → floor, with inspection (05) and conversion (07) layered on.
   All copy comes from js/data.js; all travel scrubs deterministic sequences. */

const App = (() => {
  const vh = n => n * (window.innerHeight || 768);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  let players = {};
  let current = "hub";
  let hubVidDone = false;   // the storm intro plays exactly once, then the living diorama owns the stage
  let legsBuilt = false;

  const el = id => document.getElementById(id);
  const world = () => el("world");

  /* sequence travels on disk (dirs under assets/, filled by the extraction pipeline) */
  /* wired scenes → extracted frame counts (6s clips = 176, 10s clips = 304) */
  const SEQS = { "hub": 176, "atlantic-0": 176, "atlantic-1": 176, "atlantic-2": 304, "atlantic-3": 304, "atlantic-4": 176, "atlantic-5": 304, "atlantic-6": 176, "coast-0": 176, "coast-1": 176, "coast-2": 304, "coast-4": 304, "coast-5": 176, "coast-6": 176, "eden-0": 176, "eden-1": 176, "eden-2": 304, "eden-3": 176, "eden-4": 176, "haven-0": 176, "haven-1": 176, "haven-2": 176, "haven-3": 304, "haven-4": 176 };
  window.__MARK = "v3-seq";

  /* ---------- build regional legs from data ---------- */
  const STILLS = {
    "hub-0": "assets/hub_hook.png",
    "coast-0": "assets/coast_0.png",
    "coast-1": "assets/coast_1.png",
    "coast-2": "assets/coast_2.png",
    "coast-3": "assets/coast_3.png",
    "coast-4": "assets/coast_4.png",
    "coast-5": "assets/coast_5.png",
    "coast-6": "assets/coast_6.png",
    "haven-0": "assets/haven_0.png",
    "haven-1": "assets/haven_1.png",
    "haven-2": "assets/haven_2.png",
    "haven-3": "assets/haven_3.png",
    "haven-4": "assets/haven_4.png",
    "atlantic-0": "assets/atlantic_0.png",
    "atlantic-1": "assets/atlantic_1.png",
    "atlantic-2": "assets/atlantic_2.png",
    "atlantic-3": "assets/atlantic_3.png",
    "atlantic-4": "assets/atlantic_4.png",
    "atlantic-5": "assets/atlantic_5.png",
    "atlantic-6": "assets/atlantic_6.png",
    "eden-0": "assets/eden_0.png",
    "eden-1": "assets/eden_1.png",
    "eden-2": "assets/eden_2.png",
    "eden-3": "assets/eden_3.png",
    "eden-4": "assets/eden_4.png"
  };

  /* ambient played journeys per segment (played; deterministic scrub stays as fallback) */
  const AMBIENT = {
    "coast-1": "assets/ambient_coast_1.mp4",
    "coast-6": "assets/ambient_coast_6.mp4",
    "haven-2": "assets/ambient_haven_2.mp4",
    "haven-4": "assets/ambient_haven_4.mp4",
    "atlantic-2": "assets/ambient_atlantic_2.mp4",
    "atlantic-4": "assets/ambient_atlantic_4.mp4",
    "eden-2": "assets/ambient_eden_2.mp4",
    "eden-4": "assets/ambient_eden_4.mp4",
    "hub-0": "assets/ambient_hub.mp4",
    "haven-1": "assets/ambient_haven_1.mp4",
    "coast-3": "assets/ambient_coast_3.mp4",
    "coast-5": "assets/ambient_coast_5.mp4",
    "atlantic-3": "assets/ambient_atlantic_3.mp4",
    "atlantic-6": "assets/ambient_atlantic_6.mp4",
    "eden-1": "assets/ambient_eden_1.mp4",
    "eden-3": "assets/ambient_eden_3.mp4"
  };

  function buildLegs() {
    if (legsBuilt) return;
    legsBuilt = true;
    const host = el("legs");
    for (const key of Object.keys(LEGS)) {
      const L = LEGS[key];
      const sec = document.createElement("section");
      sec.className = "scene scene-leg";
      sec.id = "scene-" + key;
      sec.dataset.region = key;

      const bar = document.createElement("div");
      bar.className = "leg-title-bar";
      bar.innerHTML = `<span class="leg-no">${L.no}</span><span class="leg-name">${L.title}</span>`;
      sec.appendChild(bar);

      L.segments.forEach((S, i) => {
        const seg = document.createElement("div");
        seg.className = "segment";
        seg.dataset.region = key;
        seg.dataset.seg = i;
        seg.dataset.last = i === L.segments.length - 1 ? "1" : "";

        seg.innerHTML = `
          <div class="canvas-pin">
            <canvas width="1440" height="810" data-seq="${key}-${i}"></canvas>
            ${AMBIENT[key + "-" + i] ? `<video class="ambient" muted loop playsinline hidden src="${AMBIENT[key + "-" + i]}"></video>` : ""}
            <div class="copy-dock ${i % 2 ? "right" : "left"}">
              <p class="seg-kicker">${L.title}</p>
              <h3>${S.headline}</h3>
              <p>${S.body}</p>
              <div class="overlay-row">
                ${S.overlays.map((o, i) => `<button class="pin-btn" style="--i:${i}" data-cred="${o.c || ""}">${o.l}</button>`).join("")}
              </div>
              <p class="credential" data-role="credential"></p>
            </div>
          </div>`;

        // overlay buttons dock the matching region credentials
        const region = ARK.regions[key];
        seg.querySelectorAll(".pin-btn").forEach((btn, bi) => {
          btn.dataset.cred = bi === 0 ? region.cred : region.cred2;
          btn.addEventListener("click", () => {
            const cred = seg.querySelector(".credential");
            cred.textContent = btn.dataset.cred;
            cred.classList.add("on");
            const label = S.overlays[bi] && S.overlays[bi].l;
            if (INSPECT[label]) openInspect(label);
          });
        });

        // checkpoint on final segment
        if (i === L.segments.length - 1 && L.checkpoint) {
          const cp = document.createElement("div");
          cp.className = "checkpoint";
          cp.innerHTML = `
            <h3 style="color:var(--gold)">${L.segments[i].headline}</h3>
            <div class="badges">
              <span class="badge">Financing partners — secured &amp; non-secured</span>
              <span class="badge">30-year warranty solutions</span>
              <span class="badge">Master Electrical License</span>
            </div>
            <a class="cp-cta" href="${ARK.phoneHref}">Get your free assessment — ${ARK.phone}</a>`;
          seg.appendChild(cp);
        }
        sec.appendChild(seg);
        // leg gate + gate-space after the final segment's travel
        if (i === L.segments.length - 1 && L.checkpoint) {
          const gate = document.createElement("div");
          gate.className = "leg-gate";
          const gateBg = STILLS[key + "-0"];
          gate.innerHTML = `
            ${gateBg ? `<img class="gate-bg" src="${gateBg}" alt="" loading="eager">` : ""}
            <div class="gate-inner">
              <div class="gate-mark">
                <img class="gate-logo-fill" src="assets/logo_ark.png" alt="ARK ECO">
                <img class="gate-logo-base" src="assets/logo_ark.png" alt="">
                <div class="gate-sweep"></div>
              </div>
              <div class="gate-kicker">Journey complete — ${L.title}</div>
              <div class="gate-continue">Continue to scroll</div>
              <div class="gate-arrow"></div>
            </div>`;
          sec.appendChild(gate);

          const gateSpace = document.createElement("div");
          gateSpace.className = "scroll-space gate-space";
          gateSpace.dataset.space = "gate-" + key;
          sec.appendChild(gateSpace);
        }
      });
      host.appendChild(sec);
    }
  }

  /* every segment canvas gets a deterministic player (sequence travel if on disk, else painted still) */
  function buildPlayers() {
    players.hub = new SeqPlayer(el("seq-hub"),
      SEQS["hub"] !== undefined ? Scenes.seqTravel("hub", "hub")
        : STILLS["hub-0"] ? Scenes.stillScene(STILLS["hub-0"]) : Scenes.ACT.hook,
      SEQS["hub"]);
    players.dive = new SeqPlayer(el("seq-dive"), Scenes.diveScene(currentRegion || "haven"));

    document.querySelectorAll("canvas[data-seq]").forEach(c => {
      const [region, seg] = c.dataset.seq.split("-");
      const still = STILLS[c.dataset.seq];
      const frames = SEQS[c.dataset.seq];
      players[c.dataset.seq] = new SeqPlayer(c,
        frames !== undefined ? Scenes.seqTravel(c.dataset.seq.replace("-", "_"), region)
          : still ? Scenes.stillScene(still, region) : Scenes.legScene(region, +seg),
        frames);
    });
  }

  /* ---------- spatial flow: scroll → scene state ---------- */
  const hubSpace = () => document.querySelector('[data-space="hub"]').offsetHeight;
  const mapSpace = () => document.querySelector('[data-space="map"]').offsetHeight;
  const diveSpace = () => document.querySelector('[data-space="dive"]').offsetHeight;

  function frame(scroll) {
    const top = scroll;
    const hubEnd = hubSpace() - vh(1);
    const mapStart = hubEnd;
    const mapEnd = mapStart + mapSpace() - vh(1);

    // ACT 0 progress — the storm hook carries itself once reached
    players.hub.resize();
    players.hub.setAuto(top < hubEnd + vh(0.5) ? 'pingpong' : false);
    if (!players.hub.autoMode) players.hub.seek(clamp01(top / hubEnd));
    el("scene-hub").style.opacity = top < hubEnd ? 1 : Math.max(0, 1 - (top - hubEnd) / vh(0.4));
    el("hub-stage").querySelector(".hook-title").classList.toggle("on", top > hubEnd * 0.62);
    const hubVid = el("hub-video");
    if (top < hubEnd && !hubVidDone) {
      if (hubVid.getAttribute("src") !== MOTION.hub) { hubVid.setAttribute("src", MOTION.hub); hubVid.load(); }
      hubVid.hidden = false;
      if (hubVid.paused) hubVid.play().catch(() => {});
      hubVid.onerror = () => { hubVid.hidden = true; hubVidDone = true; };
      hubVid.onended = () => { hubVid.hidden = true; hubVidDone = true; };  // one shot — never refreezes or restarts
    } else if (!hubVid.paused) {
      hubVid.pause();
    }

    // ACT 1 map: sticky across its own space
    const mapVisible = top >= mapStart - vh(0.5) && top < mapEnd;
    el("map-pin").style.top = mapVisible ? "0" : "";

    // dive progress
    const diveSec = el("scene-dive");
    if (!diveSec.hidden) {
      const dStart = parseFloat(diveSec.dataset.start || 0);
      const dEnd = dStart + diveSpace() - vh(1);
      players.dive.resize();
      players.dive.setAuto(top >= dStart - vh(0.5) && top < dEnd ? 'once' : false);
      players.dive.seek(clamp01((top - dStart) / (dEnd - dStart)));
      diveSec.querySelector("#dive-stage").style.opacity =
        top > dEnd - vh(0.3) ? Math.max(0, 1 - (top - (dEnd - vh(0.3))) / vh(0.3)) : 1;
    }

    // descent vignette handled in the dive scene

    frameScroll = scroll;
    progress(top);
    updateRegion(scroll);
  }

  let frameScroll = 0;

  function progress(scroll) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    el("progress-fill").style.width = (scroll / max * 100) + "%";
  }

  function updateRegion(scroll) {
    let label = "The storm is coming";
    const hubH = hubSpace();
    if (scroll > hubH) label = "Relief Map — Southern Florida";
    if (scroll > hubH + mapSpace()) {
      for (const key of Object.keys(LEGS)) {
        const sec = el("scene-" + key);
        if (!sec) continue;
        const top = sec.offsetTop, bottom = top + sec.offsetHeight;
        if (scroll >= top - window.innerHeight * 0.5 && scroll < bottom) {
          label = LEGS[key].title;
          current = key;
          break;
        }
      }
    }
    el("region-label").textContent = label;
    el("compass").hidden = scroll <= hubH + mapSpace();
  }

  /* ---------- navigation between flows ---------- */
  function flows() {
    const list = [];
    for (const key of Object.keys(LEGS)) {
      const sec = el("scene-" + key);
      list.push({ key, top: sec.offsetTop });
    }
    return list;
  }

  function pauseMotion() {
    const video = el("dive-video");
    video.pause();
    video.hidden = true;
  }

  function goToFlow(key) {
    if (key !== "hub-map") pauseMotion();
    buildLegs();
    if (key === "hub") { Timeline.jump(0); return; }
    if (key === "sizer") { openSizer(); return; }
    if (key === "hub-map") { Timeline.jump(hubSpace() - vh(0.6)); return; }
    if (key === "floor") { Timeline.jump(document.documentElement.scrollHeight); return; }

    if (LEGS[key]) {
      const sec = el("scene-" + key);
      Timeline.jump(sec.offsetTop + vh(0.05));
      current = key;
    }
  }

  /* beacons: click → dive → land in leg */
  let currentRegion = null;
  const MOTION = {
    hub: "assets/ambient_hub.mp4",
    coast: "assets/motion_coast.mp4",
    haven: "assets/motion_haven.mp4",
    atlantic: "assets/motion_atlantic.mp4",
    eden: "assets/motion_eden.mp4"
  };

  function setDiveMotion(key) {
    const video = el("dive-video");
    const src = MOTION[key];
    if (!src) { video.hidden = true; video.pause(); return; }
    if (video.getAttribute("src") !== src) {
      video.setAttribute("src", src);
      video.load();
    }
    video.hidden = false;
    video.play().catch(() => { video.hidden = true; });
    video.onerror = () => { video.hidden = true; video.pause(); };
  }

  function land(key) {
    buildLegs();
    currentRegion = key;
    players.dive.sceneFn = Scenes.diveScene(key,
      STILLS[key + "-0"] ? Scenes.stillScene(STILLS[key + "-0"], key) : null);
    setDiveMotion(key);

    const dive = el("scene-dive");
    const legsEl = el("legs");
    const target = el("scene-" + key);
    const start = target.offsetTop - vh(1.4);              // dive occupies the space before the leg
    dive.hidden = false;
    dive.dataset.start = start;
    const space = dive.querySelector('[data-space="dive"]');
    space.style.height = "140vh";
    dive.style.position = "absolute";
    dive.style.top = start + "px";
    dive.style.left = "0";
    dive.style.right = "0";

    current = key;
    Timeline.jump(start);

    // auto-triggered diorama unfold: plays itself on arrival, no scroll needed
    dive.classList.remove("unfold");
    void dive.offsetWidth;                                   // restart the entrance
    dive.classList.add("unfold");
  }

  document.querySelectorAll(".beacon").forEach(b => {
    b.addEventListener("click", () => land(b.dataset.region));
    b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); land(b.dataset.region); } });
  });

  /* ---------- inspection (05) — 3D when we have a model, painted assemblies otherwise ---------- */
  let viewer = null;
  function openInspect(name) {
    const A = INSPECT[name];
    if (!A) return;
    el("inspect-title").textContent = name;
    el("inspect-parts").innerHTML = A.parts.map(p =>
      `<li><b>${p[0]}</b><span>${p[1]}</span></li>`).join("");
    const glb = typeof INSPECT_3D !== "undefined" ? INSPECT_3D[name] : null;
    close3D();
    if (glb && window.ArkViewer) {
      el("inspect-kicker").textContent = "4D deep inspection — drag to orbit";
      const host = el("inspect-3d");
      host.hidden = false;
      el("explode-svg").hidden = true;
      el("explode-svg").innerHTML = "";
      viewer = ArkViewer.mount(host, glb + "?m=" + Date.now());
      viewer.load().then(() => { if (viewer) viewer.setExplode(0.6); }).catch(() => {});
    } else {
      el("inspect-kicker").textContent = "Deep inspection";
      el("inspect-3d").hidden = true;
      el("explode-svg").hidden = false;
      buildExplode(name, A.parts.length);
    }
    el("explode-range").value = 60;
    updateExplode();
    el("inspect").hidden = false;
  }
  function close3D() {
    if (viewer) { viewer.dispose(); viewer = null; }
    el("inspect-3d").hidden = true;
    el("inspect-3d").innerHTML = "";
    el("explode-svg").hidden = false;
  }
  function buildExplode(name, n) {
    const svg = el("explode-svg");
    const img = typeof INSPECT_IMG !== "undefined" ? INSPECT_IMG[name] : null;
    if (img) {
      svg.setAttribute("viewBox", "0 0 340 600");
      svg.innerHTML = `<image href="${img}" x="0" y="0" width="340" height="600" preserveAspectRatio="xMidYMid meet" data-role="assembly"/>`;
    } else {
      svg.setAttribute("viewBox", "0 0 600 340");
      svg.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", 60 + (i % 2) * 220);
        rect.setAttribute("y", 40 + i * (260 / Math.max(1, n - 1)));
        rect.setAttribute("width", 260); rect.setAttribute("height", 40);
        rect.setAttribute("rx", 4);
        rect.setAttribute("fill", i % 2 ? "#443350" : "#6a5468");
        rect.setAttribute("stroke", i % 2 ? "#4fd8e0" : "#ffc20e");
        rect.setAttribute("stroke-width", "1");
        g.appendChild(rect);
        svg.appendChild(g);
      }
    }
    el("explode-range").value = 60;
    updateExplode();
  }
  function updateExplode() {
    const t = (+el("explode-range").value) / 100;
    if (viewer) { viewer.setExplode(t); return; }
    const img = el("explode-svg").querySelector('[data-role="assembly"]');
    if (img) {  // painted assembly: drift + scale scrub
      const y = (t - 0.6) * 70;
      const s = 1.02 + 0.05 * t;
      img.setAttribute("transform", `translate(0 ${y}) scale(${s})`);
      return;
    }
    el("explode-svg").querySelectorAll("g").forEach((g, i, arr) => {
      const mid = (arr.length - 1) / 2;
      const dir = i - mid;
      g.setAttribute("transform", `translate(0 ${dir * 40 * t}) translate(${dir * 14 * t} 0)`);
    });
  }

  el("inspect").addEventListener("click", e => {
    if (e.target === el("inspect") || e.target.classList.contains("inspect-close")) {
      el("inspect").hidden = true;
      close3D();
    }
  });
  el("explode-range").addEventListener("input", updateExplode);

  /* ---------- sizer (04) ---------- */
  function openSizer() {
    Sizer.init();
    el("sizer").classList.add("on");
  }
  el("sizer").addEventListener("click", e => {
    if (e.target.classList.contains("sizer-close")) el("sizer").classList.remove("on");
  });

  /* ---------- top controls ---------- */
  el("menu-btn").addEventListener("click", () => { el("menu").hidden = !el("menu").hidden; });
  el("menu").addEventListener("click", e => {
    const a = e.target.closest("a[data-jump]");
    if (!a) return;
    e.preventDefault();
    el("menu").hidden = true;
    goToFlow(a.dataset.jump);
  });
  el("compass").addEventListener("click", () => { pauseMotion(); Timeline.jump(hubSpace() - vh(0.55)); current = "hub"; });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { el("menu").hidden = true; el("inspect").hidden = true; close3D(); } });

  /* ---------- boot ---------- */
  function boot() {
    buildLegs();
    buildPlayers();

    // space heights per flow
    document.querySelector('[data-space="hub"]').style.height = "160vh";
    document.querySelector('[data-space="map"]').style.height = "120vh";
    document.querySelector('[data-space="dive"]').style.height = "140vh";
    document.querySelectorAll(".scene-leg .segment").forEach(s => { s.style.height = "260vh"; });

    Timeline.on(frame);

    // prefetch painted stills
    Object.values(STILLS).forEach(p => Scenes.loadStill(p));

    // map intro dock visible while map is in view
    Timeline.on(scroll => {
      const on = scroll > hubSpace() - vh(0.7) && scroll < hubSpace() + mapSpace() - vh(0.8);
      el("map-intro").style.opacity = on ? 1 : 0;
    });

    // dock copy fade + ambient playback per segment
    Timeline.on(scroll => {
      const docTop = (n) => { let y = 0; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };
      document.querySelectorAll(".segment").forEach(seg => {
        const top = docTop(seg), h = seg.offsetHeight;
        const bottom = top + h;
        const dock = seg.querySelector(".copy-dock");
        const cp = seg.querySelector(".checkpoint");
        const vid = seg.querySelector("video.ambient");
        // ambient holds while the copy is up — widened so the scene carries itself
        const inView = scroll > top + h * 0.08 && scroll < bottom - h * 0.22;
        if (dock) dock.classList.toggle("on", inView);
        if (cp) cp.classList.toggle("on", scroll > bottom - h * 0.45);
        if (vid) {
          if (inView) {
            vid.hidden = false;
            if (vid.paused) vid.play().catch(() => { vid.hidden = true; });
          } else if (!vid.paused) {
            vid.pause();
          }
        }
        // scene canvas: hold band = loop authority, travel = scrub authority
        const c = seg.querySelector("canvas");
        const p = c && players[c.dataset.seq];
        if (p) {
          if (scroll > top - vh(1) && scroll < bottom + vh(0.5)) {
            p.resize();
            p.setAuto(inView ? 'pingpong' : false);
            if (!p.autoMode) p.seek(clamp01((scroll - top - vh(1)) / (h - vh(1))));
          } else p.setAuto(false);
        }
      });

      // leg gates: the last scene's final frames trigger the gate so it appears
      // seamlessly as the leg video ends, rather than after scrolling past it.
      document.querySelectorAll(".leg-gate").forEach(g => {
        const space = g.parentElement.querySelector(".gate-space");
        const seg = g.previousElementSibling;
        if (!space || !seg) return;

        const c = seg.querySelector("canvas[data-seq]");
        const p = c && players[c.dataset.seq];
        const seqProgress = p ? (p.lastFrame / p.frames) : 0;

        const gateTop = docTop(g);
        const gateH = space.offsetHeight + vh(1);
        const inGateSpace = scroll > gateTop && scroll < gateTop + gateH;
        const local = clamp01((scroll - gateTop) / gateH);

        // Gate fades in during the last ~18% of the final sequence, then holds
        // while the user travels through the gate-space.
        const triggered = seqProgress > 0.82 || inGateSpace;
        g.classList.toggle("on", triggered);
        g.classList.toggle("filled", (seqProgress > 0.92 && triggered) || (inGateSpace && local > 0.12));
      });
    });

    Sizer.init();

    // the relief map breathes: swap the painted still for its ambient render once it streams
    const mapVid = document.querySelector(".map-ambient");
    if (mapVid) {
      mapVid.addEventListener("loadeddata", () => {
        mapVid.hidden = false;
        requestAnimationFrame(() => mapVid.classList.add("on"));
      }, { once: true });
      mapVid.load();
    }

    frame(0);
  }

  document.addEventListener("DOMContentLoaded", boot);

  return { land, goToFlow };
})();
