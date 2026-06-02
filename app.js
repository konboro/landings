
function buildPopup(a){
  const locParts = a.loc.match(/^([\uD83C][\uDDE6-\uDDFF]{2})\s*(.*)$/u);
  const flagHtml = locParts
    ? `<span class="gcloc-flag">${locParts[1]}</span>${locParts[2]}`
    : a.loc;
  const s1Style = a.s1.length > 10 ? ' style="font-size:.6rem"' : '';
  return `
    <div class="gchead">
      <div class="gcthumb" style="border:2px solid ${RARITY_COLORS[a.r]}">${a.e}</div>
      <div class="gcnr">
        <div class="gcnr-top"><span class="gcdot" style="background:#22c55e"></span><span class="gcname">${a.n}</span></div>
        <div class="gcloc">${flagHtml}</div>
      </div>
      <div class="gcbadges"><span class="gctype">${a.t}</span></div>
    </div>
    <div class="gcstats">
      <div class="gcst"><div class="gclbl">Stake</div><div class="gcval sm"${s1Style}>${a.s1}</div>${a.sub ? `<div class="gcsub">${a.sub}</div>` : ''}</div>
      <div class="gcst"><div class="gclbl">Last 24h</div><div class="gcval">${a.s2}</div></div>
      <div class="gcst"><div class="gclbl">Last 24h profit</div><div class="gcval gold">${a.s3}</div></div>
    </div>
    <div class="gcstats">
      <div class="gcst"><div class="gclbl">ROI</div><div class="gcval ${a.roi_pos ? 'pos' : 'red'} sm">${a.roi}</div></div>
      <div class="gcst"><div class="gclbl">${a.tot_lbl||'Total'}</div><div class="gcval">${a.tot}</div></div>
      <div class="gcst"><div class="gclbl">Profit</div><div class="gcval gold">${a.profit}</div></div>
    </div>
    <div class="gcmeta">
      <span>PURCHASE <span>${a.price}</span></span>
      <span>IN FLEET <span>${a.fleet}</span></span>
    </div>
    <div class="gcact">
      <div class="gcbtn s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>STATS</div>
      <div class="gcbtn sl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>SELL</div>
      <div class="gcbtn tr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l4-4 4 4M7 5v14M21 15l-4 4-4-4m4 4V5"/></svg>TRADE</div>
    </div>`;
}

// ─── METRO SIMULATION — PARIS MÉTRO L14 ─────────────────────────────────────
// Olympiades → Saint-Lazare, 7.9 km at 40 km/h avg, 9 stations, 25s dwell

const METRO_ROUTE  = [[48.82790,2.36470],[48.82855,2.36775],[48.82920,2.37080],[48.82985,2.37385],[48.83050,2.37690],[48.83118,2.37750],[48.83185,2.37810],[48.83252,2.37870],[48.83320,2.37930],[48.83500,2.37930],[48.83680,2.37930],[48.83860,2.37930],[48.84040,2.37930],[48.84148,2.37790],[48.84255,2.37650],[48.84363,2.37510],[48.84470,2.37370],[48.84659,2.37044],[48.84848,2.36718],[48.85036,2.36391],[48.85225,2.36065],[48.85414,2.35739],[48.85603,2.35412],[48.85791,2.35086],[48.85980,2.34760],[48.86095,2.34373],[48.86210,2.33985],[48.86325,2.33597],[48.86440,2.33210],[48.86575,2.33030],[48.86710,2.32850],[48.86845,2.32670],[48.86980,2.32490],[48.87115,2.32515],[48.87250,2.32540],[48.87385,2.32565],[48.87520,2.32590]];
const METRO_CUM    = [0,235,469,704,939,1026,1113,1200,1287,1487,1687,1887,2087,2245,2402,2559,2717,3035,3353,3670,3988,4306,4624,4942,5260,5571,5882,6193,6504,6703,6903,7103,7302,7453,7605,7756,7907];
const METRO_TOTAL  = 7907;
const METRO_SPEED  = 11.1111; // m/s = 40 km/h
const METRO_STOPS  = [{name:"Olympiades",lat:48.8279,lon:2.3647},{name:"Bibliothèque F.M.",lat:48.8305,lon:2.3769},{name:"Cour Saint-Emilion",lat:48.8332,lon:2.3793},{name:"Bercy",lat:48.8404,lon:2.3793},{name:"Gare de Lyon",lat:48.8447,lon:2.3737},{name:"Châtelet",lat:48.8598,lon:2.3476},{name:"Pyramides",lat:48.8644,lon:2.3321},{name:"Madeleine",lat:48.8698,lon:2.3249},{name:"Saint-Lazare",lat:48.8752,lon:2.3259}];
const METRO_SDISTS = [0,939,1287,2087,2717,5260,6504,7302,7907];
const METRO_DWELL  = 25000; // ms

function startMetroSim(leafletMap, leafletMarker) {
  let dist = 0, forward = true, lastTs = null, stopIdx = 0, dwellUntil = 0;
  function setClass(cls) {
    const el = leafletMarker.getElement();
    if (!el) return;
    const inner = el.querySelector('div');
    if (!inner) return;
    inner.classList.remove('map-marker-pulse');
    inner.classList.add('map-marker-pulse');
    inner.style.filter = '';
  }
  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = (ts - lastTs) / 1000; lastTs = ts;
    if (dwellUntil > 0) {
      if (ts >= dwellUntil) { dwellUntil = 0; setClass('map-marker-pulse'); }
      requestAnimationFrame(frame); return;
    }
    dist = forward ? dist + METRO_SPEED*dt : dist - METRO_SPEED*dt;
    if (dist >= METRO_TOTAL) { dist = METRO_TOTAL; forward = false; stopIdx = 0; }
    if (dist <= 0)           { dist = 0;           forward = true;  stopIdx = 0; }
    const [lat,lon] = posOnRoute(METRO_ROUTE, METRO_CUM, dist);
    leafletMarker.setLatLng([lat,lon]);
    const el = leafletMarker.getElement();
    if (el) { const inner = el.querySelector('div'); if (inner && !inner.classList.contains('map-marker-pulse') && !inner.classList.contains('map-marker-pulse')) { inner.classList.add('map-marker-pulse'); inner.style.filter=''; } }
    if (stopIdx < METRO_SDISTS.length) {
      const target = METRO_SDISTS[forward ? stopIdx : METRO_STOPS.length-1-stopIdx];
      const hit = forward ? dist >= target : dist <= target;
      if (hit) { dwellUntil = ts + METRO_DWELL; stopIdx++; setClass('map-marker-pulse'); }
    }
    requestAnimationFrame(frame);
  }
  setClass('map-marker-pulse');
  requestAnimationFrame(frame);
}
// ─── END METRO SIMULATION ─────────────────────────────────────────────────────

// ─── WORLD BUS SIMULATION — MPK LUBLIN LINIA 10 (world map marker) ────────────
// Reuses BUS_ROUTE / BUS_STOPS / BUS_SPEED defined earlier

function startWorldBusSim(leafletMap, leafletMarker) {
  let dist = 0, forward = true, lastTs = null, stopIdx = 0, dwellUntil = 0;
  function setClass(cls) {
    const el = leafletMarker.getElement();
    if (!el) return;
    const inner = el.querySelector('div');
    if (!inner) return;
    inner.classList.remove('map-marker-pulse');
    inner.classList.add('map-marker-pulse');
    inner.style.filter = '';
  }
  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = (ts - lastTs) / 1000; lastTs = ts;
    if (dwellUntil > 0) {
      if (ts >= dwellUntil) { dwellUntil = 0; setClass('map-marker-pulse'); }
      requestAnimationFrame(frame); return;
    }
    dist = forward ? dist + BUS_SPEED*dt : dist - BUS_SPEED*dt;
    if (dist >= BUS_TOTAL) { dist = BUS_TOTAL; forward = false; stopIdx = 0; }
    if (dist <= 0)         { dist = 0;         forward = true;  stopIdx = 0; }
    const [lat,lon] = posOnRoute(BUS_ROUTE, BUS_CUM, dist);
    leafletMarker.setLatLng([lat,lon]);
    const el = leafletMarker.getElement();
    if (el) { const inner = el.querySelector('div'); if (inner && !inner.classList.contains('map-marker-pulse') && !inner.classList.contains('map-marker-pulse')) { inner.classList.add('map-marker-pulse'); inner.style.filter=''; } }
    if (stopIdx < BUS_SDISTS.length) {
      const target = BUS_SDISTS[forward ? stopIdx : BUS_STOPS.length-1-stopIdx];
      const hit = forward ? dist >= target : dist <= target;
      if (hit) { dwellUntil = ts + 30000; stopIdx++; setClass('map-marker-pulse'); }
    }
    requestAnimationFrame(frame);
  }
  setClass('map-marker-pulse');
  requestAnimationFrame(frame);
}
// ─── END WORLD BUS SIMULATION ─────────────────────────────────────────────────

// ─── TRAIN SIMULATION — VR IC #2209 HELSINKI → TAMPERE ───────────────────────
// Real VR intercity route: Helsinki Central → Tampere, 177 km at 110 km/h
// Travel time: ~97 min real-time  |  10 stations

const TRAIN_ROUTE  = [[60.1719,24.9414],[60.2022,24.9670],[60.2326,24.9926],[60.2630,25.0181],[60.2933,25.0437],[60.3208,25.0591],[60.3482,25.0744],[60.3757,25.0898],[60.4031,25.1052],[60.4207,25.1010],[60.4383,25.0968],[60.4560,25.0925],[60.4736,25.0883],[60.4911,25.0669],[60.5086,25.0455],[60.5261,25.0241],[60.5436,25.0027],[60.5662,24.9682],[60.5887,24.9337],[60.6112,24.8992],[60.6338,24.8647],[60.6597,24.8419],[60.6855,24.8190],[60.7114,24.7961],[60.7373,24.7733],[60.8020,24.6960],[60.8667,24.6188],[60.9314,24.5416],[60.9961,24.4643],[61.0386,24.3137],[61.0811,24.1630],[61.1236,24.0123],[61.1661,23.8617],[61.2491,23.8402],[61.3321,23.8186],[61.4151,23.7970],[61.4981,23.7755]];
const TRAIN_CUM    = [0,3659,7317,10975,14633,17800,20968,24135,27302,29276,31249,33223,35196,37468,39739,42010,44281,47419,50555,53691,56826,59962,63096,66231,69365,77693,86016,94335,102650,112043,121426,130799,140164,149465,158765,168066,177365];
const TRAIN_TOTAL  = 177365;
const TRAIN_SPEED  = 30.5556; // m/s = 110 km/h
const TRAIN_STOPS  = [{name:"Helsinki Central",lat:60.1719,lon:24.9414},{name:"Tikkurila",lat:60.2933,lon:25.0437},{name:"Kerava",lat:60.4031,lon:25.1052},{name:"Järvenpää",lat:60.4736,lon:25.0883},{name:"Jokela",lat:60.5436,lon:25.0027},{name:"Hyvinkää",lat:60.6338,lon:24.8647},{name:"Riihimäki",lat:60.7373,lon:24.7733},{name:"Hämeenlinna",lat:60.9961,lon:24.4643},{name:"Toijala",lat:61.1661,lon:23.8617},{name:"Tampere",lat:61.4981,lon:23.7755}];
const TRAIN_SDISTS = [0,14633,27302,35196,44281,56826,69365,102650,140164,177365];
const TRAIN_DWELL  = 60000; // 60s at each station

function startTrainSim(leafletMap, leafletMarker, color) {
  let dist    = 0; // fixed: always start at Helsinki Central
  let forward = true;
  let lastTs  = null;
  let stopIdx = 0;
  let dwellUntil = 0;

  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (dwellUntil > 0) {
      if (ts >= dwellUntil) {
        dwellUntil = 0;
        const el = leafletMarker.getElement();
        if (el) { const d = el.querySelector('div'); if(d) d.classList.add('map-marker-pulse'); d && d.classList.remove('map-marker-pulse'); }
      }
      requestAnimationFrame(frame);
      return;
    }

    dist = forward ? dist + TRAIN_SPEED * dt : dist - TRAIN_SPEED * dt;
    if (dist >= TRAIN_TOTAL) { dist = TRAIN_TOTAL; forward = false; stopIdx = TRAIN_STOPS.length - 1; }
    if (dist <= 0)           { dist = 0;           forward = true;  stopIdx = 0; }

    const [lat, lon] = posOnRoute(TRAIN_ROUTE, TRAIN_CUM, dist);
    leafletMarker.setLatLng([lat, lon]);

    // Activate pulsing on first frame
    const el = leafletMarker.getElement();
    if (el) {
      const inner = el.querySelector('div');
      if (inner && !inner.classList.contains('map-marker-pulse')) {
        inner.classList.add('map-marker-pulse');
        inner.style.filter = '';
      }
    }

    // Stop check
    if (stopIdx < TRAIN_STOPS.length) {
      const target = TRAIN_SDISTS[forward ? stopIdx : TRAIN_STOPS.length - 1 - stopIdx];
      const hit = forward ? dist >= target : dist <= target;
      if (hit) {
        const sIdx = forward ? stopIdx : TRAIN_STOPS.length - 1 - stopIdx;
        dwellUntil = ts + TRAIN_DWELL;
        stopIdx = Math.min(stopIdx + 1, TRAIN_STOPS.length - 1);
        const inner = el && el.querySelector('div');
        if (inner) { inner.classList.remove('map-marker-pulse'); inner.classList.add('map-marker-pulse'); }
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
// ─── END TRAIN SIMULATION ─────────────────────────────────────────────────────

// ─── PLANE SIMULATION — EMIRATES EK003 DXB→LHR ──────────────────────────────
// Great-circle route: Dubai (DXB) → London Heathrow (LHR), 5497 km at 900 km/h
// Flight time: ~6.1h real-time  |  Spawns at eastern Europe (Black Sea, 43°N 29°E)

const PLANE_ROUTE = [[25.2532,55.3657],[25.7066,54.9005],[26.1584,54.4317],[26.6088,53.9592],[27.0575,53.4831],[27.5047,53.0031],[27.9502,52.5192],[28.3940,52.0313],[28.8360,51.5393],[29.2762,51.0432],[29.7146,50.5427],[30.1511,50.0379],[30.5856,49.5286],[31.0182,49.0147],[31.4486,48.4961],[31.8770,47.9728],[32.3032,47.4446],[32.7272,46.9114],[33.1489,46.3731],[33.5683,45.8296],[33.9853,45.2809],[34.3998,44.7267],[34.8118,44.1671],[35.2212,43.6018],[35.6279,43.0308],[36.0320,42.4540],[36.4332,41.8713],[36.8316,41.2826],[37.2270,40.6877],[37.6195,40.0865],[38.0088,39.4791],[38.3950,38.8651],[38.7780,38.2446],[39.1576,37.6174],[39.5339,36.9834],[39.9066,36.3426],[40.2758,35.6948],[40.6414,35.0399],[41.0032,34.3778],[41.3611,33.7084],[41.7152,33.0317],[42.0652,32.3476],[42.4112,31.6559],[42.7529,30.9565],[43.0903,30.2495],[43.4234,29.5347],[43.7519,28.8120],[44.0758,28.0814],[44.3950,27.3428],[44.7094,26.5962],[45.0189,25.8415],[45.3234,25.0787],[45.6227,24.3076],[45.9168,23.5284],[46.2055,22.7410],[46.4888,21.9453],[46.7665,21.1413],[47.0385,20.3292],[47.3047,19.5087],[47.5650,18.6801],[47.8193,17.8433],[48.0674,16.9983],[48.3093,16.1453],[48.5448,15.2843],[48.7738,14.4153],[48.9963,13.5384],[49.2120,12.6539],[49.4209,11.7616],[49.6229,10.8619],[49.8179,9.9548],[50.0057,9.0406],[50.1863,8.1193],[50.3596,7.1911],[50.5254,6.2563],[50.6836,5.3150],[50.8343,4.3675],[50.9772,3.4141],[51.1123,2.4549],[51.2395,1.4902],[51.3588,0.5204],[51.4700,-0.4543]];
const PLANE_CUM   = [0,68718,137436,206154,274872,343591,412309,481027,549745,618463,687181,755899,824617,893335,962054,1030772,1099490,1168208,1236926,1305644,1374362,1443080,1511798,1580517,1649235,1717953,1786671,1855389,1924107,1992825,2061543,2130261,2198980,2267698,2336416,2405134,2473852,2542570,2611288,2680006,2748724,2817443,2886161,2954879,3023597,3092315,3161033,3229751,3298469,3367187,3435906,3504624,3573342,3642060,3710778,3779496,3848214,3916932,3985650,4054369,4123087,4191805,4260523,4329241,4397959,4466677,4535395,4604113,4672832,4741550,4810268,4878986,4947704,5016422,5085140,5153858,5222576,5291295,5360013,5428731,5497449];
const PLANE_TOTAL = 5497449;
const PLANE_SPEED = 250.0; // m/s = 900 km/h
const PLANE_SPAWN = 3161033; // fixed spawn: eastern Europe (Black Sea, 43°N 29°E)

function posOnRoute(routePts, cum, dist) {
  for (let i = 1; i < cum.length; i++) {
    if (dist <= cum[i]) {
      const seg = cum[i] - cum[i-1];
      const t   = seg > 0 ? (dist - cum[i-1]) / seg : 0;
      return [
        routePts[i-1][0] + t * (routePts[i][0] - routePts[i-1][0]),
        routePts[i-1][1] + t * (routePts[i][1] - routePts[i-1][1]),
      ];
    }
  }
  return routePts[routePts.length - 1];
}

function startPlaneSim(leafletMap, leafletMarker, color) {
  let dist  = PLANE_SPAWN; // fixed: eastern Europe (Black Sea, 43°N 29°E)
  let forward = true;
  let lastTs  = null;

  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    dist = forward ? dist + PLANE_SPEED * dt : dist - PLANE_SPEED * dt;
    if (dist >= PLANE_TOTAL) { dist = PLANE_TOTAL; forward = false; }
    if (dist <= 0)           { dist = 0;           forward = true;  }

    const [lat, lon] = posOnRoute(PLANE_ROUTE, PLANE_CUM, dist);
    leafletMarker.setLatLng([lat, lon]);

    const el = leafletMarker.getElement();
    if (el) {
      const inner = el.querySelector('div');
      if (inner && !inner.classList.contains('map-marker-pulse')) {
        inner.classList.add('map-marker-pulse');
        inner.style.filter = '';
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
// ─── END PLANE SIMULATION ─────────────────────────────────────────────────────

function initWorldMap(){
  const map = L.map('world-map', {
    center: [54, 15],
    zoom: 5,
    minZoom: 3,
    maxZoom: 14,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer('https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=gVLyar0EiT75LpMPvAGQ', {
    maxZoom: 19, tileSize: 256
  }).addTo(map);

  ASSETS.forEach(a => {
    const typeKey = TYPE_MAP[a.t] || 'bus';
    const color   = RARITY_COLORS[a.r] || '#aaa';
    const svg     = ASSET_SVGS[typeKey]   || ASSET_SVGS.bus;
    const isLegendary = a.r === 'rl';
    const glow = isLegendary
      ? `drop-shadow(0 0 5px ${color}cc) drop-shadow(0 0 2px ${color}88)`
      : `drop-shadow(0 1px 3px rgba(0,0,0,.9))`;

    const html = `<div style="width:36px;height:36px;color:${color};filter:${glow};display:flex;align-items:center;justify-content:center;">${svg}</div>`;

    const icon = L.divIcon({
      html,
      className: '',
      iconSize:   [36, 36],
      iconAnchor: [18, 18],
      popupAnchor:[0, -20]
    });

    const marker = L.marker([a.lat, a.lon], {icon})
      .addTo(map)
      .bindPopup(buildPopup(a), {
        maxWidth: 320,
        className: 'tc-popup',
        closeButton: true,
        autoPan: true,
      });

    // Start plane simulation for ANA B787
    if(typeKey === 'plane') startPlaneSim(map, marker, color);
    // Start train simulation for VR IC
    if(typeKey === 'train') startTrainSim(map, marker, color);
    // Start metro simulation for Paris L14
    if(typeKey === 'tube')  startMetroSim(map, marker);
    // Start bus simulation for MPK Lublin on world map
    if(typeKey === 'bus')   startWorldBusSim(map, marker);
  });
}

// init map when section scrolls into view
const mapObs = new IntersectionObserver(entries => {
  if(entries[0].isIntersecting){
    initWorldMap();
    mapObs.disconnect();
  }
}, {threshold: 0.1});
mapObs.observe(document.getElementById('world-map'));
// ─── END WORLD MAP ────────────────────────────────────────────────────────────

// ─── BUS SIMULATION — LINIA 10 MPK LUBLIN ────────────────────────────────────
const BUS_STOPS = [
  { name:'Dworzec PKS',           lat:51.24720, lon:22.57300 },
  { name:'Dworzec Główny 01',     lat:51.24810, lon:22.57060 },
  { name:'Dworzec Główny 02',     lat:51.24890, lon:22.56720 },
  { name:'1 Maja',                lat:51.24960, lon:22.56440 },
  { name:'Centrum',               lat:51.25110, lon:22.56220 },
  { name:'Pl. Lecha Kaczyńsk.',   lat:51.25290, lon:22.56180 },
  { name:'Krakowskie Przedm.',    lat:51.25470, lon:22.56310 },
  { name:'Lipowa',                lat:51.25710, lon:22.56490 },
  { name:'Al. Racławickie 01',    lat:51.25890, lon:22.56710 },
  { name:'Al. Racławickie 02',    lat:51.26040, lon:22.56980 },
  { name:'Narutowicza',           lat:51.26180, lon:22.57280 },
  { name:'Politechnika',          lat:51.26340, lon:22.57610 },
];

// ~56 GPS points tracing real Lublin streets
const BUS_ROUTE = [
  [51.24720,22.57300],[51.24740,22.57240],[51.24760,22.57170],[51.24790,22.57100],
  [51.24810,22.57060],[51.24840,22.56980],[51.24860,22.56870],[51.24890,22.56720],
  [51.24910,22.56640],[51.24930,22.56560],[51.24960,22.56440],
  [51.24990,22.56370],[51.25030,22.56310],[51.25070,22.56270],[51.25110,22.56220],
  [51.25150,22.56200],[51.25190,22.56190],[51.25230,22.56185],[51.25290,22.56180],
  [51.25330,22.56200],[51.25370,22.56230],[51.25410,22.56260],[51.25470,22.56310],
  [51.25510,22.56340],[51.25550,22.56370],[51.25590,22.56400],[51.25630,22.56430],
  [51.25670,22.56460],[51.25710,22.56490],
  [51.25750,22.56530],[51.25790,22.56570],[51.25830,22.56610],[51.25860,22.56650],
  [51.25890,22.56710],[51.25920,22.56760],[51.25950,22.56810],[51.25980,22.56870],
  [51.26010,22.56920],[51.26040,22.56980],
  [51.26070,22.57040],[51.26090,22.57100],[51.26120,22.57160],[51.26150,22.57220],
  [51.26180,22.57280],
  [51.26210,22.57350],[51.26240,22.57420],[51.26280,22.57510],[51.26310,22.57570],
  [51.26340,22.57610],
];

// Cumulative distances for world map bus sim (reuses BUS_ROUTE above)
const BUS_CUM = (()=>{
  function hav(a,b){ const R=6371000,d2r=Math.PI/180,φ1=a[0]*d2r,φ2=b[0]*d2r,dφ=(b[0]-a[0])*d2r,dλ=(b[1]-a[1])*d2r,x=Math.sin(dφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
  const c=[0]; for(let i=1;i<BUS_ROUTE.length;i++) c.push(c[c.length-1]+hav(BUS_ROUTE[i-1],BUS_ROUTE[i])); return c;
})();
const BUS_TOTAL  = BUS_CUM[BUS_CUM.length-1];
const BUS_SPEED  = 5.5556; // m/s = 20 km/h city bus
const BUS_SDISTS = BUS_STOPS.map(s=>{ let best=Infinity,bc=0; BUS_ROUTE.forEach(([rlat,rlon],i)=>{ const d=Math.hypot(rlat-s.lat,rlon-s.lon); if(d<best){best=d;bc=BUS_CUM[i];} }); return bc; });

// Map each stop to nearest route index
function nearestIdx(lat,lon){
  let best=0,d=Infinity;
  BUS_ROUTE.forEach(([a,b],i)=>{const dd=Math.hypot(a-lat,b-lon);if(dd<d){d=dd;best=i;}});
  return best;
}
const STOP_IDX = BUS_STOPS.map(s=>nearestIdx(s.lat,s.lon));

let _busTimer=null, _busReverse=false, _busRouteIdx=0, _busStopIdx=0, _busStopped=false, _busStopMs=0;

function startBusSim(leafletMap, leafletMarker, markerEl){
  if(_busTimer) { cancelAnimationFrame(_busTimer); _busTimer=null; }

  // Pre-computed cumulative distances along route (metres)
  const CUM = [0.00,47.31,100.87,159.92,195.55,260.46,340.19,449.79,509.75,569.71,659.64,718.69,779.70,832.17,888.64,935.25,980.27,1024.88,1091.69,1138.29,1187.43,1236.56,1311.81,1360.94,1410.08,1459.21,1508.34,1557.48,1606.61,1659.08,1711.55,1764.02,1807.47,1860.91,1909.11,1957.31,2010.75,2058.95,2112.39,2165.83,2213.14,2266.58,2320.02,2373.46,2432.49,2491.53,2568.34,2621.77,2665.22];
  const TOTAL = 2665.22;          // total route length in metres
  // Distance at which each stop sits
  const STOP_DISTS = [0.00,195.55,449.79,659.64,888.64,1091.69,1311.81,1606.61,1860.91,2112.39,2373.46,2665.22];
  const BUS_SPEED  = 20 * 1000 / 3600; // 20 km/h in m/s
  const DWELL_MS   = 30000;             // 30 s dwell at each stop (real time)

  // Find lat/lon at arbitrary distance along route via linear interpolation
  function posAtDist(d) {
    for (let i = 1; i < CUM.length; i++) {
      if (d <= CUM[i]) {
        const seg   = CUM[i] - CUM[i-1];
        const t     = seg > 0 ? (d - CUM[i-1]) / seg : 0;
        const lat   = BUS_ROUTE[i-1][0] + t * (BUS_ROUTE[i][0] - BUS_ROUTE[i-1][0]);
        const lon   = BUS_ROUTE[i-1][1] + t * (BUS_ROUTE[i][1] - BUS_ROUTE[i-1][1]);
        return [lat, lon];
      }
    }
    return BUS_ROUTE[BUS_ROUTE.length - 1];
  }

  let dist       = 0;          // current position in metres along route
  let forward    = true;       // direction
  let stopIdx    = 0;          // next stop to hit
  let dwellUntil = 0;          // timestamp when dwell ends (0 = not dwelling)
  let lastTs     = null;       // previous rAF timestamp

  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    const dtMs  = ts - lastTs;
    lastTs = ts;

    if (dwellUntil > 0) {
      // dwelling at stop
      if (ts >= dwellUntil) {
        dwellUntil = 0;
        markerEl.className = 'bus-marker-moving';
      }
      _busTimer = requestAnimationFrame(frame);
      return;
    }

    // advance position
    const dtS  = dtMs / 1000;
    const move = BUS_SPEED * dtS;
    dist = forward ? dist + move : dist - move;

    // direction reversal at ends
    if (dist >= TOTAL) { dist = TOTAL; forward = false; stopIdx = STOP_DISTS.length - 1; }
    if (dist <= 0)     { dist = 0;     forward = true;  stopIdx = 0; }

    // move marker + pan map
    const [lat, lon] = posAtDist(dist);
    leafletMarker.setLatLng([lat, lon]);
    leafletMap.panTo([lat, lon], { animate: false });

    // stop trigger
    if (forward && stopIdx < STOP_DISTS.length && dist >= STOP_DISTS[stopIdx]) {
      markerEl.className = 'bus-marker-stopped';
      dwellUntil = ts + DWELL_MS;
      stopIdx++;
    } else if (!forward && stopIdx > 0 && dist <= STOP_DISTS[stopIdx - 1]) {
      stopIdx--;
      markerEl.className = 'bus-marker-stopped';
      dwellUntil = ts + DWELL_MS;
    }

    _busTimer = requestAnimationFrame(frame);
  }

  dist = 0; forward = true; stopIdx = 0; dwellUntil = 0; lastTs = null;
  markerEl.className = 'bus-marker-moving';
  _busTimer = requestAnimationFrame(frame);
}
// ─── END BUS SIMULATION ───────────────────────────────────────────────────────

const maps = new WeakMap();
function tog(el){
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.cat.open').forEach(c => c.classList.remove('open'));
  if(wasOpen && _busTimer){ cancelAnimationFrame(_busTimer); _busTimer=null; }

  if(!wasOpen){
    el.classList.add('open');
    if(window.innerWidth >= 768 && !maps.has(el)){
      const lat     = parseFloat(el.dataset.lat);
      const lon     = parseFloat(el.dataset.lon);
      const typeKey = el.dataset.type || 'bus';
      const color   = ASSET_COLORS[typeKey] || '#eab308';
      const svg     = ASSET_SVGS[typeKey]   || ASSET_SVGS.bus;
      const rarity  = el.dataset.rarity || 'rc';
      const isBus   = typeKey === 'bus';
      const isLeg   = rarity === 'rl';
      const glow    = isLeg
        ? `drop-shadow(0 0 7px ${color}cc) drop-shadow(0 0 3px ${color}88)`
        : `drop-shadow(0 1px 4px rgba(0,0,0,.95))`;

      const startLat = isBus ? BUS_ROUTE[0][0] : lat;
      const startLon = isBus ? BUS_ROUTE[0][1] : lon;

      setTimeout(() => {
        const mapEl = isBus
          ? document.getElementById('bus-minimap-el')
          : el.querySelector('.minimap-el');

        const m = L.map(mapEl, {
          center: [startLat, startLon],
          zoom: isBus ? 14 : 13,
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false, keyboard: false, tap: false,
        });

        L.tileLayer(
          'https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=gVLyar0EiT75LpMPvAGQ',
          { maxZoom:19, tileSize:256 }
        ).addTo(m);

        if(isBus){
          // route polyline
          L.polyline(BUS_ROUTE,{color:'#6ee7b7',weight:2.5,opacity:.5}).addTo(m);
          // stop markers
          BUS_STOPS.forEach((s,i)=>{
            const term=i===0||i===BUS_STOPS.length-1;
            L.circleMarker([s.lat,s.lon],{
              radius:term?5:3,
              color:term?'#eab308':'#6ee7b7',
              fillColor:term?'#eab308':'#080a0f',
              fillOpacity:1, weight:term?2:1.5
            }).addTo(m);
          });
          // bus marker — wrapper div for class toggling
          const wrapHtml=`<div class="bus-marker-moving" style="width:36px;height:36px;color:${color};display:flex;align-items:center;justify-content:center;">${svg}</div>`;
          const busIcon=L.divIcon({html:wrapHtml,className:'',iconSize:[36,36],iconAnchor:[18,18]});
          const busMarker=L.marker([startLat,startLon],{icon:busIcon,zIndexOffset:1000}).addTo(m);
          m.invalidateSize();
          maps.set(el,m);
          // get live DOM ref after Leaflet inserts it
          requestAnimationFrame(()=>{
            const live=mapEl.querySelector('.bus-marker-moving,.bus-marker-stopped');
            if(live) startBusSim(m, busMarker, live);
          });
        } else {
          const icon=L.divIcon({
            html:`<div style="width:36px;height:36px;color:${color};filter:${glow};display:flex;align-items:center;justify-content:center;">${svg}</div>`,
            className:'', iconSize:[36,36], iconAnchor:[18,18]
          });
          L.marker([lat,lon],{icon}).addTo(m);
          m.invalidateSize();
          maps.set(el,m);
        }
      }, 500);
    }
  }
}
function doWL(eid, sid, wid){
  const inp = document.getElementById(eid);
  const v   = inp.value.trim();
  const ok  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if(!ok){ inp.style.borderColor='#f87171'; inp.focus(); return; }

  inp.style.borderColor = '';
  const btn = inp.parentElement ? inp.parentElement.querySelector('button') : null;
  if(btn){ btn.textContent = '…'; btn.disabled = true; }

  fetch('https://waitlist.tycoon.live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: v, source: wid ? 'hero' : 'bottom' }),
  })
  .then(r => r.json())
  .then(() => {
    if(wid){ const r = document.getElementById(wid).querySelector('.wlr'); if(r) r.style.display='none'; }
    document.getElementById(sid).style.display = 'block';
  })
  .catch(() => {
    if(btn){ btn.textContent = 'Get Early Access'; btn.disabled = false; }
    inp.style.borderColor = '#f87171';
  });
}

const obs = new IntersectionObserver(es => {
  es.forEach(e => { if(e.isIntersecting) e.target.classList.add('v'); });
}, {threshold: .06});
document.querySelectorAll('.fi').forEach(el => obs.observe(el));
// ── TC COUNTER ───────────────────────────────────────────────────────────────
(function(){
  // Tick amounts per asset type based on real earnings visible in ticker
  // Total per 15s = ~proportional slice of 24h earnings across all assets on map
  let total = 0;
  const el = document.getElementById('tc-counter');

  function fmt(n) {
    return Math.floor(n).toLocaleString('en-US').replace(/,/g,' ') + ' TC';
  }

  function doTick() {
    total += Math.floor(Math.random() * 29001) + 1000;
    if(el) {
      el.textContent = fmt(total);
      el.classList.add('tick');
      setTimeout(() => el && el.classList.remove('tick'), 400);
    }
  }

  // Start after map section is visible
  setTimeout(() => {
    doTick();
    setInterval(doTick, 15000);
  }, 2000);
})();
// ── END TC COUNTER ────────────────────────────────────────────────────────────

// ── FLAG EMOJI → IMAGE ────────────────────────────────────────────────────────
(function(){
  function flagToCode(e){
    const pts=[...e].map(c=>c.codePointAt(0));
    if(pts.length===2 && pts[0]>=0x1F1E6 && pts[0]<=0x1F1FF)
      return String.fromCharCode(pts[0]-0x1F1E6+65)+String.fromCharCode(pts[1]-0x1F1E6+65);
    return null;
  }
  function replaceFlag(el){
    if(el.dataset.flagDone) return;
    el.dataset.flagDone = '1';
    const code = flagToCode(el.textContent.trim());
    if(code){
      const img = document.createElement('img');
      img.src = `https://flagcdn.com/16x12/${code.toLowerCase()}.png`;
      img.alt = el.textContent.trim();
      img.style.cssText = 'width:16px;height:12px;object-fit:cover;border-radius:1px;flex-shrink:0;vertical-align:middle';
      el.innerHTML = '';
      el.appendChild(img);
    }
  }
  function replaceFlagSpans(){
    document.querySelectorAll('.gcloc-flag:not([data-flag-done])').forEach(replaceFlag);
  }
  // Run on load
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded', replaceFlagSpans);
  else replaceFlagSpans();
  // Watch for dynamically added flags (Leaflet popups)
  new MutationObserver(mutations=>{
    mutations.forEach(m=>{
      m.addedNodes.forEach(node=>{
        if(node.nodeType!==1) return;
        if(node.classList && node.classList.contains('gcloc-flag')) replaceFlag(node);
        node.querySelectorAll && node.querySelectorAll('.gcloc-flag:not([data-flag-done])').forEach(replaceFlag);
      });
    });
  }).observe(document.body, {childList:true, subtree:true});
})();
// ── END FLAG EMOJI → IMAGE ────────────────────────────────────────────────────
