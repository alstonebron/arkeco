/* ARK ECO — content layer. Regional legs (storyboard 02–05), inspection register (06),
   critical-load taxonomy (07). CTA phone and county list per https://arkecogreen.com. */

const ARK = {
  phone: "+1 (239) 360-5580",
  phoneHref: "tel:+12393605580",
  counties: "Broward, Collier, Lee, Hendry, and Palm Beach Counties",
  regions: {
    haven: {
      name: "ARK ECO Agricultural",
      place: "Winter Haven / Arcadia — Heartland",
      tagline: "Grown here. Powered here.",
      cred: "Polk County Heartland — dual-use land",
      cred2: "Agrivoltaic array — Growatt MID/MAC-class inverter strings",
      scenes: {
        sky: [ [10,40,30,0.35], [28,52,40,0.5], [40,40,46,0.6] ],
        land: [ [70,58,42,0.9], [86,64,46,0.85], [96,70,52,0.75] ]
      }
    },
    coast: {
      name: "ARK ECO Residential",
      place: "Fort Myers Metro — Gulf coast",
      tagline: "Every piece. One property.",
      cred: "Lee County, Florida",
      cred2: "Standing seam — impact-rated to Florida wind standards",
      scenes: {
        sky: [ [16,32,52,0.4], [30,44,62,0.5], [44,40,70,0.55] ],
        land: [ [96,72,64,0.8], [86,62,58,0.85], [72,56,58,0.85] ]
      }
    },
    atlantic: {
      name: "ARK ECO Commercial",
      place: "Miami Corridor — Atlantic",
      tagline: "Open when nothing else is.",
      cred: "Miami corridor — one design, one permit, one owner",
      cred2: "V4 lot — 500kW liquid-cooled certified posts",
      scenes: {
        sky: [ [20,24,48,0.45], [34,32,58,0.5], [48,32,66,0.5] ],
        land: [ [64,44,84,0.8], [76,52,88,0.75], [88,58,92,0.7] ]
      }
    },
    eden: {
      name: "ARK ECO Edenstead",
      place: "East of Alico Road — Estero",
      tagline: "One property. One feature.",
      cred: "East of Alico Road, Estero — closed loop",
      cred2: "Net-zero microgrid — food, water, power",
      scenes: {
        sky: [ [24,40,44,0.4], [38,52,54,0.5], [52,48,60,0.55] ],
        land: [ [72,80,48,0.8], [88,88,56,0.75], [100,96,64,0.65] ]
      }
    }
  }
};

/* Regional legs. Each segment: headline, body, overlay buttons (pin/pin/pin → credentials). */
const LEGS = {
  haven: {
    title: "ARK ECO Agricultural",
    no: "Leg 1",
    segments: [
      { headline: "The fields woke up before you did.",
        body: "Dawn over the Heartland. Mist between the citrus rows; pump lights blinking on acreage that runs on localized clean generation.",
        overlays: [ {t:"t", l:"Polk County Heartland"}, {t:"t", l:"dual-use land"} ] },
      { headline: "Grown here. Powered here.",
        body: "Agrivoltaic rows on stilted racking float above mature citrus. The same rows shade the fruit and feed the grid.",
        overlays: [ {t:"t", l:"dual-use land"}, {t:"t", l:"Agrivoltaic row"} ] },
      { headline: "The line runs on the roof above it.",
        body: "The automated packhouse under a massive solar canopy: the biggest roof in the county is the biggest power plant in the county.",
        overlays: [ {t:"t", l:"Commercial canopy array"} ] },
      { headline: "The freezer that never stops.",
        body: "Cold storage on stacking-module battery: refrigeration on the rack, solar on the roof, every circuit on one screen. Your inventory never knows.",
        overlays: [ {t:"t", l:"Cold-storage ESS"} ] },
      { headline: "Grown here. Powered here. Storm after storm.",
        body: "Groves, rows, packhouse, cold store, pumps — one microgrid, visibly linked. The storm rolls in from the Gulf; the farm stays lit.",
        overlays: [ {t:"t", l:"Irrigation + microgrid"}, {t:"t", l:"Master Electrical License"} ] }
    ],
    checkpoint: true
  },
  coast: {
    title: "ARK ECO Residential",
    no: "Leg 2",
    segments: [
      { headline: "Every piece. One property.",
        body: "Gulf-coast dusk. One property, readable in a single look: standing seam array, driveway pergola with EV, garage battery stack, standby generator on its pad.",
        overlays: [ {t:"t", l:"Lee County, Florida"} ] },
      { headline: "Hardened from the top down.",
        body: "Storm sheeting off a standing seam metal roof — impact-rated, engineered to Florida's toughest wind standards. Seam detail, fastener detail, hardening detail.",
        overlays: [ {t:"t", l:"impact-rated"}, {t:"t", l:"Standing seam system"} ] },
      { headline: "One structure, three jobs.",
        body: "A hurricane-rated solar pergola over the vehicles: it shades, powers, and charges. Your fuel is free — charge on the power generated above your driveway.",
        overlays: [ {t:"t", l:"Solar pergola"}, {t:"t", l:"EV charger"} ] },
      { headline: "Stackable power. Room to grow.",
        body: "Step inside the power room. Modular battery stacks — start with what you need, stack more as you grow. LFP chemistry, 100% DoD, 98% round-trip.",
        overlays: [ {t:"t", l:"Battery stack"}, {t:"t", l:"25-yr / 8,000-cycle warranty"} ] },
      { headline: "Fuel for the days the sun can't.",
        body: "A propane standby generator on its pad — automatic power through a week of storms. Automatic transfer, aluminum enclosure, quiet-test at night.",
        overlays: [ {t:"t", l:"Standby generator"}, {t:"t", l:"LP / NG dual fuel"} ] },
      { headline: "Every circuit. One tap.",
        body: "See and control everything from your phone. Circuit priorities on the fly; backup life extended; storm mode, one touch — the house holds.",
        overlays: [ {t:"t", l:"Smart panel"}, {t:"t", l:"40% longer backup"} ] },
      { headline: "Every piece. One property.",
        body: "Array, pergola, power room, generator, panel — one system, linked. One design, one permit, one owner. Roofing, solar, battery, EV charging, smart controls: one company, every layer.",
        overlays: [ {t:"t", l:"Get your free assessment"} ] }
    ],
    checkpoint: true
  },
  atlantic: {
    title: "ARK ECO Commercial",
    no: "Leg 3",
    segments: [
      { headline: "Open when nothing else is.",
        body: "Dusk is coming down the street. Neon ignites one by one; windows flicker on; the street holds under a dark sky. Solar canopy over the pumps, batteries out front.",
        overlays: [ {t:"t", l:"Miami corridor"} ] },
      { headline: "The lights hold.",
        body: "A car charging under the canopy; a gold trace from array to charger. The station is steady under the storm sky.",
        overlays: [ {t:"t", l:"Station array + charger"} ] },
      { headline: "The freezer that never stops.",
        body: "Freezer aisle glowing at night; compressors humming on the refrigeration rack. Refrigeration on battery, solar on the roof above.",
        overlays: [ {t:"t", l:"Refrigeration microgrid"} ] },
      { headline: "The big box, always on.",
        body: "The manager locks the doors; the building keeps the lights on. Next door the hotel: pool deck lit, every guest charging, comfortable all night.",
        overlays: [ {t:"t", l:"Multi-tenant array"} ] },
      { headline: "The vault never blinks.",
        body: "The vault on its own dedicated circuit — the ATM answering, the doors open. Next door, a church shelter with the lights on: solar on the roof, power in reserve.",
        overlays: [ {t:"t", l:"Dedicated circuit"} ] },
      { headline: "500kW. Liquid-cooled. Certified.",
        body: "V4 posts igniting over the lot; arcs of cyan. Your lot becomes the destination — and the quiet battery room runs the street.",
        overlays: [ {t:"t", l:"V4 post"}, {t:"t", l:"Battery room stack"} ] },
      { headline: "The street stayed on. Yours can too.",
        body: "Every building lit, one design, one permit, one owner — the street runs itself. One company. Every layer.",
        overlays: [ {t:"t", l:"Get your free assessment"} ] }
    ],
    checkpoint: true
  },
  eden: {
    title: "ARK ECO Edenstead",
    no: "Leg 4",
    segments: [
      { headline: "One property. One feature.",
        body: "Southwest Florida dusk east of Alico Road: scrub flat, pine flat, one homestead glowing. A sustainable ecosystem home where every component works together.",
        overlays: [ {t:"t", l:"East of Alico Road, Estero"} ] },
      { headline: "Powered above. Watered above.",
        body: "The pergola shades, powers, and charges; the roof catches every drop. Gutter channels route rain to holding tanks.",
        overlays: [ {t:"t", l:"Homestead array"}, {t:"t", l:"rain catchment"} ] },
      { headline: "Cleaned all the way down.",
        body: "Particulate filter, mineralization tank, potable storage — rain cleaned down to water the plants and supply the hydroponics and the home.",
        overlays: [ {t:"t", l:"Filtration train"} ] },
      { label: "Not only greenery. A food system.", headline: "A food system that feeds itself.",
        body: "Aquaponic fish tanks bubbling; biological waste converting into bio-available fertilizer; emerald effluent spraying the grow beds. Runoff fertilizing the gardens directly.",
        overlays: [ {t:"t", l:"Aquaponic core"} ] },
      { headline: "Anything a life fully off-grid would need.",
        body: "Automated vertical towers cycling clean water back to the tanks. Whole-property net-zero rise: gold loops + emerald loops closing. The storm rolls in; the homestead holds. Food, water, sustainable electricity.",
        overlays: [ {t:"t", l:"Vertical towers"}, {t:"t", l:"net-zero microgrid"} ] }
    ],
    checkpoint: true
  }
};

/* Inspection register (storyboard 05). Parts: [name, spec]. Every spec docks from real research. */
const INSPECT = {
  "Agrivoltaic row": {
    parts: [
      ["Stilted racking", "Elevated racking — rows repeat to the horizon, shade bands tracking"],
      ["Module", "Bifacial module-class panel over mature citrus"],
      ["Energy footing", "Gold-trace path — feeds the grid while shading the fruit"],
      ["Credential", "Dual-use land: the same rows do both"]
    ]
  },
  "Cold-storage ESS": {
    parts: [
      ["Module stacks", "Stacking-module battery stacks sized to the building"],
      ["Chemistry cells", "LFP — 100% DoD, 98% round-trip efficiency"],
      ["Harness", "Wiring to the rack, circuits on one screen"],
      ["Credential", "25-year / 8,000-cycle warranty; stack 1–12 inverters, up to 168 modules"]
    ]
  },
  "Canopy string": {
    parts: [
      ["Commercial rack", "Massive canopy rack over the truck yard"],
      ["Module array", "Array-class modules across the biggest roof in the county"],
      ["String screen", "Growatt MID/MAC-class C&I inverter strings — 15–50kW, up to 98.5% efficiency"],
      ["Credential", "The biggest roof in the county is the biggest power plant in the county"]
    ]
  },
  "Pump station": {
    parts: [
      ["High-volume pumps", "High-volume irrigation pumps"],
      ["Screen", "Localized clean generation — pump lights blink at dawn"],
      ["Clean-generation trace", "Gold path from microgrid to pump"],
      ["Credential", "The fields ran on the sun that rose this morning"]
    ]
  },
  "Standing seam system": {
    parts: [
      ["Standing seam", "Metal seam detail — storm sheeting off cleanly"],
      ["Fastener", "Engineered to Florida's toughest wind standards"],
      ["Hardening layer", "Impact-rated metal over the structure"],
      ["Solar-vent layer", "Solar-ready vent layer under the array"],
      ["Credential", "Impact-rated: hardened from the top down"]
    ]
  },
  "Solar pergola": {
    parts: [
      ["Hurricane-rated racking", "Rated structure over the vehicles"],
      ["Modules", "Array modules above the driveway"],
      ["Charger", "EV charger — gold trace from pergola to charger"],
      ["Credential", "Shades, powers, and charges: your fuel is free"]
    ]
  },
  "Battery stack": {
    parts: [
      ["Wall-mount cabinet", "Cabinet in the garage power room"],
      ["Modules", "Stacking modules — start with what you need, stack more as you grow"],
      ["LFP cells", "100% DoD, 98% round-trip efficiency"],
      ["Screen", "Circuits and backup life on one screen"],
      ["Credential", "25-year / 8,000-cycle warranty; stack 1–12 inverters, up to 168 modules"]
    ]
  },
  "Standby generator": {
    parts: [
      ["G-Force engine", "G-Force 1000-class air-cooled engine"],
      ["Enclosure", "Aluminum enclosure — sloped roof, rear air intake"],
      ["Dual-fuel plumbing", "LP or NG — LP consumption 3.71 gal/hr at 100%"],
      ["Controller", "Power Zone 200 controller; quiet-test at night"],
      ["Credential", "Automatic power through a week of storms"]
    ]
  },
  "Smart panel": {
    parts: [
      ["Panel family", "Whole-home, room, and circuit data"],
      ["Circuits", "Priorities on the fly — backup life extended"],
      ["Phone screen", "Storm mode, one touch"],
      ["Credential", "40% longer backup; UL 1741 PCS; NEMA 3R"]
    ]
  },
  "Station array + charger": {
    parts: [
      ["Canopy modules", "Solar canopy over the pumps"],
      ["Charger", "Car charging under the canopy"],
      ["Gold trace", "Array to charger, visibly linked"],
      ["Credential", "The lights hold — open when nothing else is"]
    ]
  },
  "Refrigeration microgrid": {
    parts: [
      ["Compressors", "Rack compressors humming through the night"],
      ["Microgrid stacks", "Microgrid-class stacks sized to the store"],
      ["String", "Inverter-class string, 97–98.5% efficiency"],
      ["Credential", "Your inventory never knows"]
    ]
  },
  "Dedicated circuit": {
    parts: [
      ["Dedicated circuit", "The vault on its own circuit"],
      ["ATM", "Answering when the town needs it"],
      ["Reserve power", "Power in reserve behind the shelter lights"],
      ["Credential", "The vault never blinks; the doors open"]
    ]
  },
  "V4 post": {
    parts: [
      ["Liquid-cooled harness", "Liquid-cooled cable — flexible at temperature extremes"],
      ["Screen", "Plug & Charge — the act of charging disappears"],
      ["Buswork", "8 posts per cabinet; 16 stalls ship per truck"],
      ["Credential", "500kW post-class; 1.2MW cabinet for the Semi"]
    ]
  },
  "Battery room stack": {
    parts: [
      ["Module stacks", "Modular stacks sized to the street"],
      ["HV modules", "High-voltage module class — 0.5C"],
      ["Cabinet", "IP55-class outdoor cabinet"],
      ["Credential", "The quiet room that runs the street — 261kWh-class"]
    ]
  },
  "Homestead array": {
    parts: [
      ["Array modules", "Standing-seam + pergola array"],
      ["Enclosure", "Battery enclosure in the smart panel bay"],
      ["Panel", "Circuits visibly balanced between house and charger"],
      ["Credential", "Gold loops closing over the property"]
    ]
  },
  "Filtration train": {
    parts: [
      ["Particulate filter", "First stage — particulate out of the rain"],
      ["Mineralization tank", "Second stage — minerals balanced"],
      ["Potable storage", "Potable storage feeding the home"],
      ["Greywater split", "Line to the garden and the hydroponics"],
      ["Credential", "Cleaned all the way down"]
    ]
  },
  "Aquaponic core": {
    parts: [
      ["Fish tanks", "Submersible aerators bubbling"],
      ["Mineralization", "Biological waste into bio-available fertilizer"],
      ["Root basins", "Emerald effluent spraying the grow beds"],
      ["Yield credential", "Sustainable greenery, sustainable food — operational yield"]
    ]
  },
  "Vertical towers": {
    parts: [
      ["Automated towers", "Vertical towers feeding produce"],
      ["Cycle plumbing", "Clean water cycling back to the tanks"],
      ["Basin", "Grow beds at the base of every tower"],
      ["Credential", "Food, water, power — off-grid and unbothered"]
    ]
  }
};

/* Painted exploded assemblies (deep inspection). */
const INSPECT_IMG = {
  "Agrivoltaic row": "assets/insp_agri.png",
  "Cold-storage ESS": "assets/insp_cold.png",
  "Canopy string": "assets/insp_canopy.png",
  "Pump station": "assets/insp_pump.png",
  "Standing seam system": "assets/insp_seam.png",
  "Solar pergola": "assets/insp_pergola.png",
  "Battery stack": "assets/insp_battery.png",
  "Standby generator": "assets/insp_generator.png",
  "Smart panel": "assets/insp_panel.png",
  "Station array + charger": "assets/insp_station.png",
  "Refrigeration microgrid": "assets/insp_refrig.png",
  "Dedicated circuit": "assets/insp_reserve.png",
  "V4 post": "assets/insp_v4.png",
  "Battery room stack": "assets/insp_room.png",
  "Homestead array": "assets/insp_homestead.png",
  "Filtration train": "assets/insp_filtration.png",
  "Aquaponic core": "assets/insp_aqua.png",
  "Vertical towers": "assets/insp_towers.png"
};

/* 3D deep-inspection models (Meshy 4K masters, remeshed + meshopt web builds).
   Grows as models land — painted INSPECT_IMG stays as fallback. */
const INSPECT_3D = {
  "Agrivoltaic row": "assets/models/web/agrivoltaic_row_web.glb",
  "Cold-storage ESS": "assets/models/web/cold_storage_ess_web.glb",
  "Canopy string": "assets/models/web/canopy_string_web.glb",
  "Pump station": "assets/models/web/pump_station_web.glb",
  "Standing seam system": "assets/models/web/standing_seam_system_web.glb",
  "Solar pergola": "assets/models/web/solar_pergola_web.glb",
  "Battery stack": "assets/models/web/battery_stack_web.glb",
  "Standby generator": "assets/models/web/standby_generator_web.glb",
  "Smart panel": "assets/models/web/smart_panel_web.glb",
  "Station array + charger": "assets/models/web/station_array_charger_web.glb",
  "Refrigeration microgrid": "assets/models/web/refrigeration_microgrid_web.glb",
  "Dedicated circuit": "assets/models/web/dedicated_circuit_web.glb",
  "V4 post": "assets/models/charger_v4_web.glb",
  "Battery room stack": "assets/models/web/battery_room_stack_web.glb",
  "Homestead array": "assets/models/web/homestead_array_web.glb",
  "Filtration train": "assets/models/web/filtration_train_web.glb",
  "Aquaponic core": "assets/models/web/aquaponic_core_web.glb",
  "Vertical towers": "assets/models/web/vertical_towers_web.glb"
};

/* Critical loads (07). surge: watts at start; kwh: daily kWh. affinity narrows by profile. */
const LOADS = [
  { id:"fridge",      label:"Fridge",              w:150,  kwh:1.5,  surge:900,   all:true },
  { id:"freezer",     label:"Freezer",             w:100,  kwh:1.2,  surge:600,   all:true },
  { id:"lights",      label:"Lights (whole home)", w:100,  kwh:1.0,  surge:0,     all:true },
  { id:"fans",        label:"Fans",                w:80,   kwh:1.0,  surge:300,   all:true },
  { id:"router",      label:"Internet / router",   w:10,   kwh:0.25, surge:0,     all:true },
  { id:"security",    label:"Security system",     w:30,   kwh:0.75, surge:0,     all:true },
  { id:"phone",       label:"Phones / devices",    w:5,    kwh:0.05, surge:0,     all:true },
  { id:"tv",          label:"TV",                  w:100,  kwh:0.5,  surge:0,     all:true },
  { id:"computer",    label:"Computer",            w:200,  kwh:1.0,  surge:0,     all:true },
  { id:"garage",      label:"Garage door",         w:300,  kwh:0.1,  surge:1200,  all:true },
  { id:"sump",        label:"Sump pump",           w:600,  kwh:1.0,  surge:1800,  all:true },
  { id:"well",        label:"Well pump",           w:750,  kwh:2.0,  surge:3000,  all:true },
  { id:"medical",     label:"Medical equipment",   w:300,  kwh:3.0,  surge:600,   all:true },
  { id:"central_ac",  label:"Central AC",          w:3500, kwh:12,   surge:6000,  all:true },
  { id:"window_ac",   label:"Window AC",           w:1200, kwh:6,    surge:2600,  all:true },
  { id:"water_heat",  label:"Water heater",        w:4500, kwh:10,   surge:0,     all:true },
  { id:"washer",      label:"Washer",              w:500,  kwh:0.5,  surge:1200,  all:true },
  { id:"dryer",       label:"Dryer",               w:3000, kwh:3,    surge:4000,  all:true },
  { id:"oven",        label:"Oven",                w:4000, kwh:4,    surge:0,     all:true },
  { id:"coffee",      label:"Coffee maker",        w:900,  kwh:0.2,  surge:0,     all:true },
  { id:"microwave",   label:"Microwave",           w:1200, kwh:0.5,  surge:0,     all:true },
  { id:"pool",        label:"Pool pump",           w:1200, kwh:6,    surge:3600,  all:true },
  { id:"hot_tub",     label:"Hot tub",             w:5000, kwh:8,    surge:0,     all:true },
  { id:"furnace",     label:"Furnace fan",         w:600,  kwh:4,    surge:1200,  all:true },
  { id:"treatment",   label:"Water treatment",     w:400,  kwh:1.5,  surge:900,   all:true },
  { id:"ev_l2",       label:"EV charging (L2)",    w:7200, kwh:12,   surge:0,     all:true },
  { id:"irrigation",  label:"Irrigation pump",     w:1500, kwh:6,    surge:4500,  affinity:"agricultural" },
  { id:"aeration",    label:"Aeration",            w:100,  kwh:2.4,  surge:200,   affinity:"agricultural" },
  { id:"cold",        label:"Cold storage",        w:2000, kwh:20,   surge:0,     affinity:"agricultural" },
  { id:"packhouse",   label:"Packhouse line",      w:5000, kwh:30,   surge:0,     affinity:"agricultural" },
  { id:"refrig",      label:"Refrigeration rack",  w:4000, kwh:40,   surge:0,     affinity:"commercial" },
  { id:"lighting_c",  label:"Store lighting",      w:6000, kwh:50,   surge:0,     affinity:"commercial" },
  { id:"hvac_c",      label:"Building HVAC",       w:12000,kwh:90,   surge:0,     affinity:"commercial" },
  { id:"chargers_c",  label:"Customer chargers",   w:12000,kwh:60,   surge:0,     affinity:"commercial" },
  { id:"towers",      label:"Vertical towers",     w:400,  kwh:8,    surge:0,     affinity:"edenstead" },
  { id:"fish",        label:"Fish tanks / pumps",  w:300,  kwh:5,    surge:600,   affinity:"edenstead" },
  { id:"growbeds",    label:"Grow-bed pumps",      w:200,  kwh:3,    surge:400,   affinity:"edenstead" },
  { id:"wellhouse",   label:"Wellhouse + pumps",   w:600,  kwh:3,    surge:2400,  affinity:"edenstead" }
];

/* Pinned constants (pinned in code). Concept estimate only. */
const SPEC = {
  moduleKwh: 15,          // stacking-module 15kWh-class
  moduleKwhUsable: 14,    // discharge margin
  panelW: 425,            // 425W-class module
  sunHours: 4.5,          // Florida average
  pvDerate: 0.85,
  inverterKwOptions: [8, 12, 15],   // hybrid inverter 8/12/15kW-class
  generatorKw: 26,        // LP standby 26kW-class
  generatorFlagKwh: 60,   // recommend LP standby beyond this
  generatorFlagSurge: 8000,
  costPerModuleLow: 8000, costPerModuleHigh: 11000,  // concept, installed
  costPerPvKw: 2600,
  incentive: 0.30,        // federal tax credit class
  rate: 0.07, years: 20
};
