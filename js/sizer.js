/* ARK ECO — system sizer. ALL math computed in code with pinned constants (SPEC).
   The semantic layer classifies free text behind an interface; when the wired
   Typesafe endpoint is unavailable, the safe fallback returns 'none' and the
   checklist alone sizes the system. Numbers always render from SPEC — the
   model never computes numbers. Concept estimate only, not a quote. */

const Sizer = (() => {
  const state = { profile: "residential", loads: new Set(), autonomy: 3, wiring: "unwired" };
  let loaded = false;

  const affinityProfile = { residential: null, agricultural: "agricultural", commercial: "commercial", edenstead: "edenstead" };

  const visibleLoads = () => LOADS.filter(l => l.affinity == null || l.affinity === affinityProfile[state.profile]);

  const defaults = profile => {
    const d = { residential: ["fridge","lights","router","phone","medical","central_ac","garage"],
                agricultural: ["fridge","lights","router","irrigation","cold","packhouse"],
                commercial: ["refrig","lighting_c","hvac_c","security"],
                edenstead: ["fridge","lights","router","towers","fish","growbeds","wellhouse"] };
    return new Set(d[profile] || []);
  };

  const fmt = n => n >= 100 ? Math.round(n).toLocaleString() : (Math.round(n * 10) / 10).toLocaleString();

  function compute() {
    const chosen = LOADS.filter(l => state.loads.has(l.id));
    const dailyKwh = chosen.reduce((s, l) => s + l.kwh, 0);
    const surge = chosen.reduce((s, l) => s + l.surge, 0);
    const steady = chosen.reduce((s, l) => s + l.w, 0);
    const concurrent = steady * 0.6 + surge;               // 60% diversity on steady draw
    const hours = state.autonomy * 24;

    const storageKwh = dailyKwh * (hours / 24);
    const usableKwh = storageKwh / 0.95;                   // round-trip margin
    const modules = Math.ceil(usableKwh / SPEC.moduleKwhUsable);
    const capKwh = modules * SPEC.moduleKwh;               // nameplate
    const modulesCapped = Math.min(modules, 168);

    const inverterKw = SPEC.inverterKwOptions.find(k => k * 1000 >= concurrent) || 15;
    const inverters = Math.max(1, Math.ceil(concurrent / (inverterKw * 1000)));

    const pvKw = Math.max(0, Math.ceil((dailyKwh / SPEC.sunHours / SPEC.pvDerate) * 10) / 10);
    const panels = Math.ceil(pvKw * 1000 / SPEC.panelW);

    const generator = capKwh > SPEC.generatorFlagKwh || concurrent > SPEC.generatorFlagSurge;

    const costLow = modules * SPEC.costPerModuleLow + pvKw * SPEC.costPerPvKw;
    const costHigh = modules * SPEC.costPerModuleHigh + pvKw * SPEC.costPerPvKw;
    const costLowNet = costLow * (1 - SPEC.incentive);
    const costHighNet = costHigh * (1 - SPEC.incentive);
    const r = SPEC.rate / 12, n = SPEC.years * 12;
    const monthly = v => v === 0 ? 0 : (v * r) / (1 - Math.pow(1 + r, -n));

    return { chosen, dailyKwh, hours, storageKwh, usableKwh, modules, modulesCapped, capKwh,
             inverterKw, inverters, concurrent, pvKw, panels, generator,
             costLowNet, costHighNet, mLow: monthly(costLowNet), mHigh: monthly(costHighNet) };
  }

  function render() {
    const s = compute();
    const spec = document.getElementById("spec");
    const rows = [];
    if (s.chosen.length === 0) {
      rows.push(`<div class="row"><b>Pick loads to size the system</b></div>`);
    } else {
      rows.push(`<div class="row"><span>Daily demand</span><b>${fmt(s.dailyKwh)} kWh</b></div>`);
      rows.push(`<div class="row"><span>Autonomy target</span><b>${s.hours}h</b></div>`);
      rows.push(`<div class="row"><span>Storage (nameplate)</span><b>${fmt(s.capKwh)} kWh</b></div>`);
      rows.push(`<div class="row"><span>Stacking modules</span><b>${s.modulesCapped}${s.modules > 168 ? "+" : ""} × 15kWh</b></div>`);
      rows.push(`<div class="row"><span>Inverters</span><b>${s.inverters} × ${s.inverterKw}kW hybrid</b></div>`);
      rows.push(`<div class="row"><span>PV array</span><b>${s.pvKw} kW DC · ${s.panels} × 425W</b></div>`);
      if (state.profile !== "residential")
        rows.push(`<div class="row"><span>Peak concurrent draw</span><b>${fmt(s.concurrent / 1000)} kW</b></div>`);
      if (s.generator)
        rows.push(`<div class="row warn"><span>High demand</span><b>+ LP standby 26kW-class</b></div>`);
      rows.push(`<div class="row"><span>Concept, after incentives</span><b>$${fmt(s.costLowNet)} – $${fmt(s.costHighNet)}</b></div>`);
      rows.push(`<div class="row"><span>Financed (20yr @ 7%)</span><b>$${fmt(s.mLow)} – $${fmt(s.mHigh)}/mo</b></div>`);
      rows.push(`<div class="note">Concept estimate only, not a quote. Government tax incentives apply. Financing partners on secured and non-secured options. Stacks of 1–12 inverters, up to 168 modules; nameplate ${fmt(s.capKwh)} kWh.</div>`);
    }
    spec.innerHTML = rows.join("");
  }

  function buildChecklist() {
    const box = document.getElementById("loads");
    box.innerHTML = "";
    for (const l of visibleLoads()) {
      const row = document.createElement("label");
      row.className = "load-row";
      row.innerHTML = `<input type="checkbox" data-id="${l.id}" ${state.loads.has(l.id) ? "checked" : ""}><span>${l.label}</span>`;
      row.querySelector("input").addEventListener("change", e => {
        e.target.checked ? state.loads.add(l.id) : state.loads.delete(l.id);
        render();
      });
      box.appendChild(row);
    }
  }

  async function classify(text) {
    if (!text || !text.trim()) return null;
    // Wired when the Typesafe endpoint is available (server-side). Safe fallback:
    state.wiring = "fallback";
    const note = document.getElementById("semantic-note");
    note.textContent = "";
    return { district: "none", confidence: 0, fallback: true };
  }

  async function onText() {
    const t = document.getElementById("visitor-text").value;
    const r = await classify(t);
    if (r && r.district !== "none" && r.confidence >= 0.8 && ARK.regions[r.district]) {
      const note = document.getElementById("semantic-note");
      note.textContent = `Suggested region: ${ARK.regions[r.district].name}`;
    }
  }

  function init() {
    if (loaded) return;
    loaded = true;
    state.loads = defaults("residential");

    document.getElementById("profile").addEventListener("change", e => {
      state.profile = e.target.value;
      state.loads = defaults(state.profile);
      buildChecklist();
      render();
    });
    document.getElementById("visitor-text").addEventListener("input", onText);
    document.getElementById("autonomy").addEventListener("input", e => {
      state.autonomy = +e.target.value;
      document.getElementById("autonomy-days").textContent = e.target.value;
      render();
    });

    buildChecklist();
    render();
  }

  return { init };
})();
