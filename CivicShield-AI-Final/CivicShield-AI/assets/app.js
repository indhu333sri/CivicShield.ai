/* ============================================================
   CIVICSHIELD AI — PROTOTYPE ENGINE
   Simulated data + rule-based AI triage. No real backend.
============================================================ */

// ---------- Center: Chennai ----------
const CENTER = [13.0827, 80.2707];

function rid(prefix, n){ return prefix + '-' + String(n).padStart(2,'0'); }
function jitter(base, spread){ return base + (Math.random()-0.5)*spread; }
function pad(n){ return String(n).padStart(2,'0'); }
function fmtTime(d){ return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()); }
function haversine(a,b){
  const R=6371, toRad=x=>x*Math.PI/180;
  const dLat=toRad(b[0]-a[0]), dLon=toRad(b[1]-a[1]);
  const s=Math.sin(dLat/2)**2 + Math.cos(toRad(a[0]))*Math.cos(toRad(b[0]))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
}
function uid(){ return Math.random().toString(36).slice(2,9); }

// ---------- Locations ----------
const LOCATIONS = [
  {name:'Anna Nagar Main Road', pos:[13.0850, 80.2101]},
  {name:'T. Nagar Junction', pos:[13.0418, 80.2341]},
  {name:'North Junction, Perambur', pos:[13.1132, 80.2400]},
  {name:'OMR IT Corridor', pos:[12.9698, 80.2420]},
  {name:'Adyar Bridge', pos:[13.0067, 80.2570]},
  {name:'Velachery Main Road', pos:[12.9791, 80.2183]},
  {name:'Egmore Station Road', pos:[13.0778, 80.2610]},
  {name:'Mylapore Tank Street', pos:[13.0339, 80.2695]},
  {name:'Guindy Industrial Estate', pos:[13.0067, 80.2206]},
  {name:'Kilpauk Garden Road', pos:[13.0776, 80.2422]},
  {name:'Porur Junction', pos:[13.0378, 80.1565]},
  {name:'Tambaram Bypass', pos:[12.9249, 80.1000]},
];

const HOSPITALS = [
  {id:'H-01', name:'City General Hospital', pos:[13.0801,80.2200], beds:8, icu:2, trauma:4, incoming:0, status:'accepting'},
  {id:'H-02', name:'Apex Trauma Center', pos:[13.0500,80.2450], beds:3, icu:0, trauma:1, incoming:0, status:'limited'},
  {id:'H-03', name:'St. Mary Medical College', pos:[13.0950,80.2350], beds:11, icu:4, trauma:5, incoming:0, status:'accepting'},
  {id:'H-04', name:'Riverside Hospital', pos:[12.9850,80.2350], beds:0, icu:0, trauma:0, incoming:0, status:'full'},
  {id:'H-05', name:'Southgate Community Hospital', pos:[12.9500,80.1600], beds:6, icu:1, trauma:2, incoming:0, status:'accepting'},
];

const AMB_BASE = [
  {id:'A-01', speedKmh:44}, {id:'A-04', speedKmh:41}, {id:'A-07', speedKmh:46},
  {id:'A-12', speedKmh:48}, {id:'A-15', speedKmh:39}, {id:'A-18', speedKmh:43},
  {id:'A-21', speedKmh:45}, {id:'A-24', speedKmh:40},
];
const POLICE_BASE = [{id:'P-01'},{id:'P-04'},{id:'P-07'},{id:'P-09'},{id:'P-11'}];
const FIRE_BASE = [{id:'F-02'},{id:'F-03'},{id:'F-08'},{id:'F-11'}];

const INCIDENT_TEMPLATES = [
  {type:'Road Accident', icon:'🚗', desc:'Two vehicles collided at the intersection. One person appears unconscious.', victims:2, kw:['unconscious','collision']},
  {type:'Building Fire', icon:'🔥', desc:'Smoke reported from a 3rd floor apartment. Possible trapped occupants.', victims:1, kw:['fire','trapped']},
  {type:'Medical Emergency', icon:'🏥', desc:'Elderly man collapsed, showing signs of severe chest pain and difficulty breathing.', victims:1, kw:['chest pain','breathing']},
  {type:'Road Accident', icon:'🚗', desc:'Motorcyclist hit by a car, visible bleeding from the leg, conscious but in shock.', victims:1, kw:['bleeding','shock']},
  {type:'Medical Emergency', icon:'🏥', desc:'Pedestrian collapsed suddenly, bystanders report seizure-like symptoms.', victims:1, kw:['seizure']},
  {type:'Other', icon:'⚠️', desc:'Tree fell across the road after heavy wind, partially blocking two lanes.', victims:0, kw:['obstruction']},
  {type:'Building Fire', icon:'🔥', desc:'Kitchen fire in a restaurant, staff evacuated, fire visible from the street.', victims:0, kw:['fire']},
  {type:'Road Accident', icon:'🚗', desc:'Multi-vehicle pile-up on the flyover, several people reported unconscious.', victims:4, kw:['unconscious','pile-up','multiple']},
  {type:'Medical Emergency', icon:'🏥', desc:'Construction worker fell from scaffolding, severe bleeding and unable to move legs.', victims:1, kw:['bleeding','fall','unconscious']},
];

// ---------- AI ANALYSIS (rule-based, deterministic) ----------
function analyzeIncident(inc){
  const text = (inc.description||'').toLowerCase();
  let severity = 'MODERATE', priority = 'P3', urgency='MODERATE', confidence = 78;
  const hits = [];
  const has = (w)=> text.includes(w);

  let score = 0;
  if (has('unconscious')) { score+=3; hits.push('unconsciousness reported'); }
  if (has('bleeding') || has('blood')) { score+=2; hits.push('active bleeding'); }
  if (has('trapped')) { score+=3; hits.push('possible trapped occupant(s)'); }
  if (has('fire') || has('smoke')) { score+=2; hits.push('fire/smoke hazard'); }
  if (has('breathing') || has('chest pain')) { score+=2; hits.push('cardiac/respiratory distress'); }
  if (has('seizure')) { score+=2; hits.push('seizure symptoms'); }
  if (has('multiple') || has('pile-up')) { score+=2; hits.push('multiple casualties likely'); }
  if (has('fall')) { score+=1; hits.push('fall with possible spinal injury'); }
  if ((inc.victims||0) >= 3) { score+=2; hits.push(`${inc.victims} estimated victims`); }
  else if ((inc.victims||0) >=1) { score +=1; }

  if (score >= 6) { severity='CRITICAL'; priority='P1 — IMMEDIATE'; urgency='VERY HIGH'; confidence=92+Math.floor(Math.random()*6); }
  else if (score >= 3) { severity='HIGH'; priority='P2'; urgency='HIGH'; confidence=84+Math.floor(Math.random()*8); }
  else if (score >= 1) { severity='MODERATE'; priority='P3'; urgency='MODERATE'; confidence=76+Math.floor(Math.random()*8); }
  else { severity='LOW'; priority='P4'; urgency='LOW'; confidence=70+Math.floor(Math.random()*8); }

  const resources = ['Ambulance'];
  if (inc.type === 'Building Fire') resources.push('Fire Unit');
  if (severity==='CRITICAL' || severity==='HIGH') resources.push('Police');
  if (severity==='CRITICAL') resources.push('Emergency Hospital Alert');

  let reasoning;
  if (hits.length){
    reasoning = `Reported ${hits.slice(0,3).join(', ')} indicate${hits.length===1?'s':''} a ${severity.toLowerCase()}-severity situation requiring ${severity==='CRITICAL'?'immediate':'prompt'} response.`;
  } else {
    reasoning = `No high-risk keywords detected in the report; classified as ${severity.toLowerCase()} based on incident type and estimated impact.`;
  }

  return {
    type: (inc.type||'Unclassified').toUpperCase(),
    severity, priority, urgency,
    victims: inc.victims ?? 1,
    resources, reasoning, confidence
  };
}

// ---------- STATE ----------
let incidents = [];
let ambulances = [];
let police = [];
let fire = [];
let activity = [];
let incCounter = 100;
let simRunning = true;
let map, layers = { inc:L.layerGroup(), amb:L.layerGroup(), hosp:L.layerGroup(), units:L.layerGroup() };
let markerRefs = { inc:{}, amb:{}, hosp:{}, police:{}, fire:{} };
let activeNav = 'overview';
let citizenState = 'home';
let citizenIncidentId = null;

function pushActivity(text, tag){
  activity.unshift({ t: new Date(), text, tag });
  activity = activity.slice(0,60);
  renderActivityFeed();
}

function toast(title, body, kind){
  const el = document.createElement('div');
  el.className = 'toast' + (kind?' '+kind:'');
  el.innerHTML = `<div class="tt">${kind==='critical'?'🔴':kind==='success'?'✅':'🔵'} ${title}</div><div class="tb">${body}</div>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; setTimeout(()=>el.remove(),400); }, 4800);
}

// ---------- INIT DATA ----------
function initData(){
  ambulances = AMB_BASE.map((a,i)=>{
    const loc = LOCATIONS[i % LOCATIONS.length];
    return {
      ...a, status:'AVAILABLE', pos:[jitter(loc.pos[0],0.01), jitter(loc.pos[1],0.01)],
      target:null, incidentId:null, destHospital:null, speed:0, distance:null, eta:null, route:null, progress:0
    };
  });
  police = POLICE_BASE.map((p,i)=>{
    const loc = LOCATIONS[(i+3)%LOCATIONS.length];
    return {...p, status:'AVAILABLE', pos:[jitter(loc.pos[0],0.012), jitter(loc.pos[1],0.012)], incidentId:null};
  });
  fire = FIRE_BASE.map((f,i)=>{
    const loc = LOCATIONS[(i+5)%LOCATIONS.length];
    return {...f, status:'AVAILABLE', pos:[jitter(loc.pos[0],0.012), jitter(loc.pos[1],0.012)], incidentId:null};
  });

  // seed incidents: mix of active + resolved
  const seedDefs = [
    {t:0, resolved:false}, {t:1, resolved:false}, {t:2, resolved:false}, {t:3, resolved:false},
    {t:4, resolved:true}, {t:5, resolved:true}, {t:6, resolved:false}, {t:7, resolved:true},
  ];
  seedDefs.forEach((s,i)=> createIncident({ templateIndex: s.t % INCIDENT_TEMPLATES.length, forceResolved: s.resolved, silent:true }));

  // assign a couple ambulances to en-route/on-scene for a "living" demo
  const activeIncs = incidents.filter(x=>x.status!=='RESOLVED');
  if (activeIncs[0]) dispatchAmbulance(activeIncs[0].id, ambulances[0].id, {silent:true});
  if (activeIncs[1]) dispatchAmbulance(activeIncs[1].id, ambulances[2].id, {silent:true});
  if (activeIncs[2]) { dispatchAmbulance(activeIncs[2].id, ambulances[4].id, {silent:true}); ambulances[4].status='ON SCENE'; incidents.find(x=>x.id===activeIncs[2].id).status='ON SCENE'; }
}

function createIncident(opts={}){
  opts = opts||{};
  const tpl = INCIDENT_TEMPLATES[opts.templateIndex ?? Math.floor(Math.random()*INCIDENT_TEMPLATES.length)];
  const loc = LOCATIONS[Math.floor(Math.random()*LOCATIONS.length)];
  incCounter++;
  const now = new Date();
  const ai = analyzeIncident(tpl);
  const inc = {
    id: 'INC-' + incCounter,
    type: tpl.type, icon: tpl.icon, description: tpl.desc,
    location: loc.name, pos: [jitter(loc.pos[0],0.006), jitter(loc.pos[1],0.006)],
    victims: tpl.victims, reporter: 'Citizen App User',
    reportedAt: now,
    status: opts.forceResolved ? 'RESOLVED' : 'AI ANALYZING',
    ai, assignedAmbulance: null, assignedHospital: null, assignedPolice:null, assignedFire:null,
    timeline: [ { t: now, text: 'Emergency reported' } ]
  };
  if (opts.forceResolved){
    inc.status='RESOLVED';
    inc.assignedAmbulance = null;
    inc.timeline.push({t:now, text:'Incident resolved (historical)'});
  } else {
    inc.timeline.push({t: new Date(now.getTime()+2000), text:'Location verified'});
    inc.timeline.push({t: new Date(now.getTime()+4000), text:`AI analysis completed — ${ai.severity} / ${ai.priority}`});
    inc.status = 'DISPATCHED';
  }
  incidents.unshift(inc);
  if (!opts.silent){
    pushActivity(`AI classified <b>${inc.id}</b> as <b>${ai.severity}</b> (${ai.priority})`, ai.severity);
    toast(ai.severity==='CRITICAL' ? 'CRITICAL INCIDENT' : 'New Incident', `${inc.type} reported — ${inc.location}`, ai.severity==='CRITICAL'?'critical':undefined);
  }
  return inc;
}

// ---------- DISPATCH ----------
function nearestAvailableAmbulances(inc, n=3){
  return ambulances.filter(a=>a.status==='AVAILABLE')
    .map(a=>({a, dist: haversine(a.pos, inc.pos)}))
    .sort((x,y)=>x.dist-y.dist)
    .slice(0,n);
}
function nearestHospital(inc){
  const open = HOSPITALS.filter(h=>h.status!=='full');
  return open.map(h=>({h,dist:haversine(h.pos, inc.pos)})).sort((a,b)=>a.dist-b.dist)[0];
}

function dispatchAmbulance(incidentId, ambId, opts={}){
  const inc = incidents.find(i=>i.id===incidentId);
  const amb = ambulances.find(a=>a.id===ambId);
  if (!inc || !amb) return;
  amb.status = 'EN ROUTE';
  amb.incidentId = inc.id;
  amb.target = inc.pos.slice();
  amb.progress = 0;
  const dist = haversine(amb.pos, inc.pos);
  amb.distance = dist;
  amb.eta = Math.max(1, Math.round(dist / amb.speedKmh * 60));
  amb.speed = amb.speedKmh + Math.round(jitter(0,6));

  inc.assignedAmbulance = amb.id;
  inc.status = 'EN ROUTE';
  inc.timeline.push({t:new Date(), text:`Ambulance ${amb.id} selected`});
  inc.timeline.push({t:new Date(), text:`Dispatch confirmed — ${amb.id} en route`});

  const hb = nearestHospital(inc);
  if (hb){ inc.assignedHospital = hb.h.id; hb.h.incoming++; }

  if (!opts.silent){
    pushActivity(`Ambulance <b>${amb.id}</b> dispatched to <b>${inc.id}</b>`, 'DISPATCH');
    toast('RESPONSE DISPATCHED', `${amb.id} assigned to ${inc.id}`, 'success');
  }
  renderAll();
}

function markOnScene(amb){
  amb.status = 'ON SCENE';
  const inc = incidents.find(i=>i.id===amb.incidentId);
  if (inc){ inc.status='ON SCENE'; inc.timeline.push({t:new Date(), text:`${amb.id} arrived on scene`}); pushActivity(`<b>${amb.id}</b> arrived on scene at <b>${inc.id}</b>`,'ARRIVAL'); }
  setTimeout(()=>{
    if (amb.status==='ON SCENE'){
      amb.status='TRANSPORTING';
      const h = HOSPITALS.find(h=>h.id===(inc && inc.assignedHospital));
      amb.target = h ? h.pos.slice() : CENTER;
      amb.progress = 0;
      amb.distance = h ? haversine(amb.pos, h.pos) : 4;
      amb.eta = Math.max(1, Math.round(amb.distance / amb.speedKmh * 60));
      if (inc){ inc.status='TRANSPORTING'; inc.timeline.push({t:new Date(), text:`Transporting patient to ${h?h.name:'hospital'}`}); }
      pushActivity(`<b>${amb.id}</b> transporting patient to hospital`, 'TRANSPORT');
      renderAll();
    }
  }, 6000 + Math.random()*3000);
}

function markArrivedHospital(amb){
  amb.status = 'AVAILABLE';
  const inc = incidents.find(i=>i.id===amb.incidentId);
  if (inc){
    inc.status='RESOLVED';
    inc.timeline.push({t:new Date(), text:'Patient arrived at hospital — incident resolved'});
    pushActivity(`<b>${inc.id}</b> resolved — patient handed off`, 'RESOLVED');
    toast('HOSPITAL UPDATE', `${HOSPITALS.find(h=>h.id===inc.assignedHospital)?.name || 'Hospital'} received patient from ${inc.id}`, 'success');
    const h = HOSPITALS.find(h=>h.id===inc.assignedHospital);
    if (h) h.incoming = Math.max(0,h.incoming-1);
  }
  amb.incidentId = null; amb.target=null; amb.eta=null; amb.distance=null; amb.progress=0;
  renderAll();
}

function triggerRandomEmergency(){
  const inc = createIncident();
  renderAll();
  setTimeout(()=>{
    const cands = nearestAvailableAmbulances(inc,1);
    if (cands[0]){
      dispatchAmbulance(inc.id, cands[0].a.id);
    }
  }, 900);
}

// ---------- SIMULATION LOOP (movement) ----------
function simTick(){
  if (!simRunning) return;
  ambulances.forEach(amb=>{
    if (!amb.target) return;
    const dist = haversine(amb.pos, amb.target);
    const stepKm = amb.speedKmh * (1.2/3600) * simSpeed; // per tick (1.2s), scaled by sim speed
    if (dist <= stepKm || dist < 0.05){
      amb.pos = amb.target.slice();
      amb.distance = 0; amb.eta = 0;
      if (amb.status==='EN ROUTE') markOnScene(amb);
      else if (amb.status==='TRANSPORTING') markArrivedHospital(amb);
      return;
    }
    const frac = stepKm/dist;
    amb.pos = [ amb.pos[0] + (amb.target[0]-amb.pos[0])*frac, amb.pos[1] + (amb.target[1]-amb.pos[1])*frac ];
    amb.distance = haversine(amb.pos, amb.target);
    amb.eta = Math.max(0, Math.round(amb.distance/amb.speedKmh*60));
    amb.speed = Math.round(amb.speedKmh + jitter(0,4));
  });
  updateMapMarkers();
  updateTopbarStats();
  if (activeNav==='ambulances') renderAmbulancesGrid();
  if (activeNav==='incidents') renderIncidentsGrid();
  if (activeNav==='overview') renderPriorityQueue();
}
setInterval(simTick, 1200);

// occasional autonomous new incidents for "alive" feel
setInterval(()=>{
  if (!simRunning) return;
  if (Math.random() < 0.18 && incidents.filter(i=>i.status!=='RESOLVED').length < 10){
    triggerRandomEmergency();
  }
}, 14000);

setInterval(()=>{
  document.getElementById('tbTime').textContent = fmtTime(new Date());
}, 1000);

function toggleSim(){
  simRunning = !simRunning;
  document.getElementById('simState').innerHTML = simRunning ? '● LIVE SIMULATION' : '⏸ SIMULATION PAUSED';
  document.getElementById('simState').style.color = simRunning ? 'var(--green)' : 'var(--amber)';
  document.getElementById('simToggleBtn').textContent = simRunning ? '⏸' : '▶';
}
let simSpeed = 1;
function toggleSimSpeed(){
  simSpeed = simSpeed === 1 ? 2 : 1;
  document.getElementById('simSpeedBtn').textContent = simSpeed + '×';
}
function resetSimulation(){
  incidents = []; incCounter = 100; activity = [];
  initData();
  simRunning = true; simSpeed = 1;
  document.getElementById('simState').innerHTML = '● LIVE SIMULATION';
  document.getElementById('simState').style.color = 'var(--green)';
  document.getElementById('simToggleBtn').textContent = '⏸';
  document.getElementById('simSpeedBtn').textContent = '1×';
  pushActivity('Simulation reset by operator', 'SYSTEM');
  renderAll();
  updateMapMarkers();
  toast('Simulation Reset','All incidents and units restored to baseline state');
}

// ============ MAP ============
function initMap(){
  map = L.map('map', { zoomControl:false, attributionControl:true }).setView(CENTER, 12);
  L.control.zoom({position:'bottomright'}).addTo(map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution:'© OpenStreetMap contributors © CARTO', subdomains:'abcd', maxZoom:19
  }).addTo(map);
  Object.values(layers).forEach(l=>l.addTo(map));
}
function recenterMap(){ map.setView(CENTER, 12); }

// ============ LANDING MINI COMMAND MAP ============
let landingMap, landingIncMarker, landingAmbMarker, landingRoute;
let landingFeatured = null; // {inc, amb}
function pickLandingFeatured(){
  const active = incidents.filter(i=>i.status!=='RESOLVED' && i.assignedAmbulance);
  const order = {CRITICAL:0,HIGH:1,MODERATE:2,LOW:3};
  active.sort((a,b)=>order[a.ai.severity]-order[b.ai.severity]);
  const inc = active[0] || incidents.find(i=>i.status!=='RESOLVED');
  const amb = inc ? ambulances.find(a=>a.id===inc.assignedAmbulance) : null;
  return { inc, amb };
}
function initLandingMap(){
  if (landingMap) return;
  landingMap = L.map('landingMap', { zoomControl:false, attributionControl:false, dragging:true, scrollWheelZoom:false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains:'abcd', maxZoom:19 }).addTo(landingMap);
  landingMap.setView(CENTER, 12);
  updateLandingScene();
}
function updateLandingScene(){
  if (!landingMap) return;
  landingFeatured = pickLandingFeatured();
  const { inc, amb } = landingFeatured;
  if (!inc){
    document.getElementById('landingIncCard').innerHTML = `<div style="font-size:11.5px; color:var(--text-faint);">No active incidents in the simulation right now.</div>`;
    document.getElementById('landingTrace').textContent = 'Waiting for next simulated incident…';
    return;
  }
  if (landingIncMarker) landingMap.removeLayer(landingIncMarker);
  if (landingAmbMarker) landingMap.removeLayer(landingAmbMarker);
  if (landingRoute) landingMap.removeLayer(landingRoute);

  const incIcon = L.divIcon({className:'civ-marker', html:`<div class="marker-inc" style="background:${sevColor(inc.ai.severity)}"></div>`, iconSize:[18,18], iconAnchor:[9,9]});
  landingIncMarker = L.marker(inc.pos, {icon:incIcon}).addTo(landingMap);

  const bounds = [inc.pos];
  if (amb){
    const ambIcon = L.divIcon({className:'civ-marker', html:unitIconHtml('amb', ambColor(amb.status)), iconSize:[20,20], iconAnchor:[10,10]});
    landingAmbMarker = L.marker(amb.pos, {icon:ambIcon}).addTo(landingMap);
    landingRoute = L.polyline([amb.pos, inc.pos], {color:'#4cc3e8', weight:2, opacity:0.55, dashArray:'4,5'}).addTo(landingMap);
    bounds.push(amb.pos);
  }
  landingMap.fitBounds(bounds, {padding:[36,36], maxZoom:14});

  document.getElementById('landingIncCard').innerHTML = `
    <div class="l-trace-row" style="margin-bottom:6px;">
      <span class="badge ${inc.ai.severity.toLowerCase()}">${inc.ai.severity}</span>
      <span class="badge moderate">${inc.ai.priority}</span>
      <span style="color:var(--text-dim); font-size:11px; margin-left:auto;">${inc.id}</span>
    </div>
    <div style="font-size:13px; font-weight:700; margin-bottom:2px;">${inc.icon} ${inc.type}</div>
    <div style="font-size:11px; color:var(--text-dim); margin-bottom:${amb?'10px':'0'};">${inc.location} · ${inc.ai.victims} victim(s)</div>
    ${amb ? `
    <div style="display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid var(--border);">
      <div style="font-size:12px; font-weight:600;">🚑 ${amb.id}</div>
      <div style="font-size:11px; color:var(--text-dim);">ETA <b style="color:var(--text); font-family:var(--mono);">${amb.eta!=null?amb.eta:'--'} min</b></div>
      <span class="badge ${statusClass(amb.status)}">${amb.status}</span>
    </div>` : ''}
  `;

  const hasAmb = !!amb;
  const onScene = amb && (amb.status==='ON SCENE'||amb.status==='TRANSPORTING');
  const transporting = amb && amb.status==='TRANSPORTING';
  document.getElementById('landingTrace').innerHTML =
    `<span class="on">INCIDENT</span> › <span class="on">AI TRIAGE</span> › <span class="${hasAmb?'on':''}">${hasAmb?amb.id+' ':''}DISPATCHED</span> › <span class="${hasAmb?'on':''}">LIVE GPS</span> › <span class="${onScene?'on':''}">HOSPITAL</span> › <span class="${transporting?'on':''}">RESOLVED</span>`;
}
function updateLandingStatusStrip(){
  const el = document.getElementById('landingStatusStrip');
  if (!el) return;
  const active = incidents.filter(i=>i.status!=='RESOLVED');
  const crit = active.filter(i=>i.ai.severity==='CRITICAL').length;
  const availAmb = ambulances.filter(a=>a.status==='AVAILABLE').length;
  el.innerHTML = `
    <span style="color:var(--green); font-weight:700;">● SIMULATION ACTIVE</span>
    <span><b>${active.length}</b> active incidents</span>
    <span><b>${availAmb}</b> ambulances available</span>
    <span class="crit"><b>${crit}</b> critical</span>
    <span style="color:var(--green);">SYSTEM OPERATIONAL</span>
  `;
}
setInterval(()=>{
  if (document.getElementById('landing').style.display !== 'none'){
    updateLandingStatusStrip();
    if (landingMap) updateLandingScene();
  }
}, 1800);
function toggleLayer(key){
  const btn = document.getElementById('layer'+key.charAt(0).toUpperCase()+key.slice(1));
  if (map.hasLayer(layers[key])){ map.removeLayer(layers[key]); btn.classList.remove('on'); }
  else { map.addLayer(layers[key]); btn.classList.add('on'); }
}

function sevColor(sev){
  return sev==='CRITICAL' ? '#e5484d' : sev==='HIGH' ? '#f0a63c' : sev==='MODERATE' ? '#4cc3e8' : '#8b96a8';
}
function ambColor(status){
  return status==='AVAILABLE' ? '#3ecf8e' : status==='EN ROUTE' ? '#4cc3e8' : status==='ON SCENE' ? '#f0a63c' : status==='TRANSPORTING' ? '#e5484d' : '#5c6779';
}
// Shape-coded unit markers: circle=ambulance, square=hospital, diamond=police, triangle=fire
function unitIconHtml(kind, color){
  const shapes = {
    amb:  `<circle class="core" cx="11" cy="11" r="9"/><path class="glyph" d="M9 6h4v4h4v4h-4v4H9v-4H5V10h4Z"/>`,
    hosp: `<rect class="core" x="2.5" y="2.5" width="17" height="17" rx="3"/><path class="glyph" d="M9.2 6h2.6v3.2H15v2.6h-3.2V15H9.2v-3.2H6V9.2h3.2Z"/>`,
    police: `<polygon class="core" points="11,1 21,11 11,21 1,11"/><path class="glyph" d="M11 6.5c1.6 0 3 .5 3 .5v3.3c0 2.7-1.5 4.7-3 5.2-1.5-.5-3-2.5-3-5.2V7s1.4-.5 3-.5Z"/>`,
    fire: `<polygon class="core" points="11,1.5 20.5,20 1.5,20"/><path class="glyph" d="M11 9c.8 1 1.6 1.9 1.6 3.1a1.9 1.9 0 0 1-3.8 0c0-.6.2-1 .5-1.5-.7.4-1.3 1.2-1.3 2.2a2.9 2.9 0 0 0 5.8 0c0-2-1.4-3-2.8-3.8Z"/>`
  };
  return `<div class="unit-mk"><svg viewBox="0 0 22 22" style="--u-color:${color}">${shapes[kind]}</svg></div>`;
}

function updateMapMarkers(){
  layers.inc.clearLayers(); layers.amb.clearLayers(); layers.hosp.clearLayers(); layers.units.clearLayers();

  incidents.filter(i=>i.status!=='RESOLVED').forEach(inc=>{
    const icon = L.divIcon({className:'civ-marker', html:`<div class="marker-inc" style="background:${sevColor(inc.ai.severity)}"></div>`, iconSize:[20,20], iconAnchor:[10,10]});
    const m = L.marker(inc.pos, {icon}).addTo(layers.inc);
    m.bindPopup(`<b>${inc.id}</b> — ${inc.type}<br>${inc.location}<br><span style="color:${sevColor(inc.ai.severity)}">${inc.ai.severity}</span>`);
    m.on('click', ()=>openIncidentModal(inc.id));
  });

  ambulances.forEach(amb=>{
    const icon = L.divIcon({className:'civ-marker', html:unitIconHtml('amb', ambColor(amb.status)), iconSize:[22,22], iconAnchor:[11,11]});
    const m = L.marker(amb.pos, {icon}).addTo(layers.amb);
    m.bindPopup(`<b>${amb.id}</b> — Ambulance<br>${amb.status}${amb.eta!=null?'<br>ETA '+amb.eta+' min':''}`);
    m.on('click', ()=>openUnitModal('amb', amb.id));
  });

  HOSPITALS.forEach(h=>{
    const hc = h.status==='accepting' ? '#3ecf8e' : h.status==='limited' ? '#f0a63c' : '#5c6779';
    const icon = L.divIcon({className:'civ-marker', html:unitIconHtml('hosp', hc), iconSize:[20,20], iconAnchor:[10,10]});
    const m = L.marker(h.pos, {icon}).addTo(layers.hosp);
    m.bindPopup(`<b>${h.name}</b><br>Beds: ${h.beds} · ICU: ${h.icu}<br>${h.status.toUpperCase()}`);
  });

  police.forEach(p=>{
    const icon = L.divIcon({className:'civ-marker', html:unitIconHtml('police', ambColor(p.status)), iconSize:[18,18], iconAnchor:[9,9]});
    L.marker(p.pos, {icon}).addTo(layers.units).bindPopup(`<b>${p.id}</b> — Police<br>${p.status}`);
  });
  fire.forEach(f=>{
    const icon = L.divIcon({className:'civ-marker', html:unitIconHtml('fire', ambColor(f.status)), iconSize:[18,18], iconAnchor:[9,9]});
    L.marker(f.pos, {icon}).addTo(layers.units).bindPopup(`<b>${f.id}</b> — Fire<br>${f.status}`);
  });
}

// ============ NAV / RENDER ============
const NAV_ITEMS = [
  {id:'overview', label:'Overview', icon:'M3 12h4V4H3v8Zm7 8h4V4h-4v16Zm7-13h4v13h-4V7Z'},
  {id:'incidents', label:'Live Incidents', icon:'M12 2 2 20h20L12 2Zm0 6v5m0 3h.01'},
  {id:'ambulances', label:'Ambulances', icon:'M3 17h1v-6l2-4h8l2 4h4l1 3v3h-1M8 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z'},
  {id:'hospitals', label:'Hospitals', icon:'M12 3v18M3 12h18M6 3h12v18H6V3Z'},
  {id:'police', label:'Police Units', icon:'M12 2 4 5v6c0 5.2 3.4 9.6 8 11 4.6-1.4 8-5.8 8-11V5l-8-3Z'},
  {id:'fire', label:'Fire Units', icon:'M12 2c1 4-3 4-3 8a3 3 0 0 0 6 0c1 2 2 3 2 5a5 5 0 0 1-10 0c0-5 3-6 5-13Z'},
  {id:'ai', label:'AI Intelligence', icon:'M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2m-9 9-2 2m13 0-2-2m-9-9-2-2'},
  {id:'analytics', label:'Analytics', icon:'M4 20V10m6 10V4m6 16v-7'},
  {id:'system', label:'System', icon:'M12 2v4m0 12v4m10-10h-4M6 12H2m15.5-7.5-2.8 2.8m-9.4 9.4-2.8 2.8m14.8 0-2.8-2.8M6.3 6.3 3.5 3.5'},
];

function renderSidebar(){
  const counts = { incidents: incidents.filter(i=>i.status!=='RESOLVED').length, ambulances: ambulances.length };
  document.getElementById('sbNav').innerHTML = NAV_ITEMS.map(n=>`
    <button class="sb-item ${activeNav===n.id?'active':''}" onclick="setNav('${n.id}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="${n.icon}"/></svg>
      ${n.label}
      ${n.id==='incidents'?`<span class="count">${counts.incidents}</span>`:''}
      ${n.id==='ambulances'?`<span class="count">${counts.ambulances}</span>`:''}
    </button>`).join('');
}
function setNav(id){
  activeNav = id;
  renderSidebar();
  document.querySelectorAll('.main .view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  renderCurrentView();
}
function renderCurrentView(){
  if (activeNav==='overview'){ updateMapMarkers(); renderPriorityQueue(); renderActivityFeed(); }
  else if (activeNav==='incidents') renderIncidentsGrid();
  else if (activeNav==='ambulances') renderAmbulancesGrid();
  else if (activeNav==='hospitals') renderHospitalsGrid();
  else if (activeNav==='police') renderUnitsGrid('police');
  else if (activeNav==='fire') renderUnitsGrid('fire');
  else if (activeNav==='ai') renderAIIntel();
  else if (activeNav==='analytics') renderAnalytics();
  else if (activeNav==='system') renderSystem();
}

function timeAgo(d){
  const s = Math.floor((Date.now()-d.getTime())/1000);
  if (s<60) return s+'s ago';
  if (s<3600) return Math.floor(s/60)+'m ago';
  return Math.floor(s/3600)+'h ago';
}

function renderPriorityQueue(){
  const active = incidents.filter(i=>i.status!=='RESOLVED');
  const order = {CRITICAL:0,HIGH:1,MODERATE:2,LOW:3};
  active.sort((a,b)=> (order[a.ai.severity]-order[b.ai.severity]) || (b.ai.confidence-a.ai.confidence));
  document.getElementById('pqCount').textContent = active.length;
  document.getElementById('priorityQueue').innerHTML = active.length ? active.map((inc,idx)=>`
    <div class="pqueue-item" onclick="openIncidentModal('${inc.id}')">
      <div class="pq-top" style="display:flex; align-items:center; gap:8px;">
        <span class="rank">#${idx+1}</span>
        <span class="badge ${inc.ai.severity.toLowerCase()}">${inc.ai.severity}</span>
        <span class="pq-title">${inc.type}</span>
      </div>
      <div class="pq-meta">${inc.location} · ${inc.ai.priority} · ${inc.status}</div>
    </div>`).join('') : `<div class="empty" style="padding:30px 10px;"><div class="et">No active incidents</div></div>`;
}

function renderActivityFeed(){
  const el = document.getElementById('activityFeed');
  if (!el) return;
  el.innerHTML = activity.length ? activity.slice(0,30).map(a=>`
    <div class="feed-item"><div class="ft">${fmtTime(a.t)}</div><div class="fd">${a.text}</div></div>
  `).join('') : `<div class="empty" style="padding:20px 10px;"><div class="es">No recent activity</div></div>`;
}

function renderIncidentsGrid(){
  const el = document.getElementById('incidentsGrid');
  const list = incidents.slice(0,60);
  document.getElementById('incSub').textContent = `${incidents.filter(i=>i.status!=='RESOLVED').length} active · ${incidents.length} total (simulated)`;
  el.innerHTML = list.map(inc=>`
    <div class="icard" onclick="openIncidentModal('${inc.id}')">
      <div class="icard-top"><span class="icard-id">${inc.id}</span><span class="badge ${inc.status==='RESOLVED'?'resolved':inc.ai.severity.toLowerCase()}">${inc.status==='RESOLVED'?'RESOLVED':inc.ai.severity}</span></div>
      <div class="icard-title">${inc.icon} ${inc.type}</div>
      <div class="icard-loc">📍 ${inc.location}</div>
      <div class="icard-foot"><span>${inc.status}</span><span>${inc.assignedAmbulance||'—'}</span></div>
    </div>`).join('') || emptyState('No incidents');
}

function renderAmbulancesGrid(){
  const el = document.getElementById('ambulancesGrid');
  document.getElementById('ambSub').textContent = `${ambulances.filter(a=>a.status==='AVAILABLE').length} available of ${ambulances.length}`;
  el.innerHTML = ambulances.map(a=>`
    <div class="icard" onclick="openUnitModal('amb','${a.id}')">
      <div class="icard-top"><span class="icard-id">${a.id}</span><span class="badge ${statusClass(a.status)}">${a.status}</span></div>
      <div class="icard-title">🚑 Ambulance ${a.id}</div>
      <div class="icard-loc">${a.incidentId? 'Assigned: '+a.incidentId : 'Unassigned'}</div>
      <div class="icard-foot"><span>${a.eta!=null?'ETA '+a.eta+' min':'—'}</span><span>${a.distance!=null?a.distance.toFixed(1)+' km':''}</span></div>
    </div>`).join('');
}

function renderHospitalsGrid(){
  const el = document.getElementById('hospitalsGrid');
  el.innerHTML = HOSPITALS.map(h=>`
    <div class="icard" style="cursor:default;">
      <div class="icard-top"><span class="icard-id">${h.id}</span><span class="badge ${h.status==='accepting'?'available':h.status==='limited'?'high':'critical'}">${h.status==='accepting'?'ACCEPTING':h.status==='limited'?'LIMITED CAPACITY':'AT CAPACITY'}</span></div>
      <div class="icard-title">🏥 ${h.name}</div>
      <div class="icard-loc">Emergency Beds: ${h.beds} · ICU: ${h.icu} · Trauma: ${h.trauma}</div>
      <div class="icard-foot"><span>Incoming: ${h.incoming}</span><span>${h.status==='accepting'?'Open':h.status==='limited'?'Limited':'Closed'}</span></div>
    </div>`).join('');
}

function renderUnitsGrid(kind){
  const list = kind==='police'?police:fire;
  const el = document.getElementById(kind==='police'?'policeGrid':'fireGrid');
  el.innerHTML = list.map(u=>`
    <div class="icard" style="cursor:default;">
      <div class="icard-top"><span class="icard-id">${u.id}</span><span class="badge ${statusClass(u.status)}">${u.status}</span></div>
      <div class="icard-title">${kind==='police'?'👮':'🚒'} ${u.id}</div>
      <div class="icard-loc">${u.incidentId? 'Assigned: '+u.incidentId : 'Patrol / standby'}</div>
      <div class="icard-foot"><span>Simulated GPS</span><span>—</span></div>
    </div>`).join('');
}

function statusClass(s){
  if (s==='AVAILABLE') return 'available';
  if (s==='EN ROUTE') return 'enroute';
  if (s==='ON SCENE'||s==='TRANSPORTING') return 'onscene';
  if (s==='OFFLINE') return 'offline';
  return 'moderate';
}
function emptyState(msg){ return `<div class="empty"><div class="et">${msg}</div></div>`; }

function renderAIIntel(){
  const active = incidents.filter(i=>i.status!=='RESOLVED');
  const crit = active.filter(i=>i.ai.severity==='CRITICAL').length;
  const el = document.getElementById('aiIntelBody');
  el.innerHTML = `
    <div class="stat-row">
      <div class="stat-card"><div class="val">${active.length}</div><div class="lbl">Incidents under AI triage</div></div>
      <div class="stat-card"><div class="val" style="color:var(--red)">${crit}</div><div class="lbl">Classified critical</div></div>
      <div class="stat-card"><div class="val">${(active.reduce((s,i)=>s+i.ai.confidence,0)/(active.length||1)).toFixed(0)}%</div><div class="lbl">Avg. classification confidence</div></div>
      <div class="stat-card"><div class="val">${ambulances.filter(a=>a.status==='AVAILABLE').length}</div><div class="lbl">Units available for allocation</div></div>
    </div>
    <div class="chart-box">
      <h4>CIVIC INTELLIGENCE — SIMULATED ANALYTICAL INSIGHTS</h4>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div class="civic-insight"><span class="ci-tag">EMERGENCY HOTSPOT</span><div class="ci-text">Road accident activity is concentrated around North Junction, Perambur — 23% above the simulated 7-day baseline.</div></div>
        <div class="civic-insight"><span class="ci-tag">RESOURCE RECOMMENDATION</span><div class="ci-text">Consider additional ambulance coverage in the OMR corridor during simulated high-risk hours (18:00–21:00).</div></div>
        <div class="civic-insight"><span class="ci-tag">HOSPITAL LOAD</span><div class="ci-text">${(HOSPITALS.find(h=>h.status==='limited')||HOSPITALS[1]).name} is approaching high emergency-capacity utilization.</div></div>
        <div class="civic-insight"><span class="ci-tag">RESPONSE BOTTLENECK</span><div class="ci-text">Average response time is trending upward near Tambaram Bypass in the simulated data set.</div></div>
        <div class="civic-insight"><span class="ci-tag">RECURRING INCIDENT</span><div class="ci-text">Repeated medical-emergency reports detected near Mylapore Tank Street over the last simulated period.</div></div>
      </div>
      <div style="font-size:10.5px; color:var(--text-faint); margin-top:12px;">These are simulated analytical insights generated from prototype data — not connected to a real government or municipal database.</div>
    </div>
    <div class="chart-box">
      <h4>RISK PATTERN DETECTION (SIMULATED)</h4>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div class="ai-reason">Road accident reports have increased 23% around North Junction over the last simulated 7-day period.</div>
        <div class="ai-reason">Three simultaneous medical emergencies detected in the OMR corridor may exceed current ambulance availability in that zone.</div>
        <div class="ai-reason">Building fire incidents cluster around older commercial blocks reported between 18:00–21:00 simulated time.</div>
      </div>
    </div>
    <div class="chart-box">
      <h4>AI CLASSIFICATION LOG</h4>
      ${active.slice(0,8).map(i=>`
        <div class="mrow"><span class="k">${i.id} — ${i.type}</span><span class="v"><span class="badge ${i.ai.severity.toLowerCase()}">${i.ai.severity}</span> ${i.ai.confidence}%</span></div>
      `).join('') || '<div class="es" style="color:var(--text-faint); font-size:12px;">No active classifications</div>'}
    </div>
  `;
}

function renderAnalytics(){
  const total = incidents.length;
  const critical = incidents.filter(i=>i.ai.severity==='CRITICAL').length;
  const resolved = incidents.filter(i=>i.status==='RESOLVED').length;
  const activeN = total - resolved;
  const avgResp = (4 + Math.random()*3).toFixed(1);
  const typeCounts = {};
  incidents.forEach(i=>{ typeCounts[i.type]=(typeCounts[i.type]||0)+1; });
  const maxT = Math.max(1,...Object.values(typeCounts));
  const el = document.getElementById('analyticsBody');
  el.innerHTML = `
    <div class="stat-row">
      <div class="stat-card"><div class="val">${total}</div><div class="lbl">Total incidents (simulated period)</div></div>
      <div class="stat-card"><div class="val" style="color:var(--red)">${critical}</div><div class="lbl">Critical incidents</div></div>
      <div class="stat-card"><div class="val">${avgResp}m</div><div class="lbl">Avg. response time</div></div>
      <div class="stat-card"><div class="val" style="color:var(--green)">${resolved}</div><div class="lbl">Resolved</div></div>
    </div>
    <div class="chart-box">
      <h4>INCIDENTS BY TYPE</h4>
      <div class="bars">
        ${Object.entries(typeCounts).map(([k,v])=>`
          <div class="bar-col"><div class="bar" style="height:${(v/maxT*100)}px;"></div><div class="bl">${k.split(' ')[0]}</div></div>
        `).join('')}
      </div>
    </div>
    <div class="chart-box">
      <h4>FLEET UTILIZATION</h4>
      <div class="mrow"><span class="k">Ambulances active</span><span class="v">${ambulances.filter(a=>a.status!=='AVAILABLE').length} / ${ambulances.length}</span></div>
      <div class="mrow"><span class="k">Active incidents</span><span class="v">${activeN}</span></div>
      <div class="mrow"><span class="k">Hospitals accepting</span><span class="v">${HOSPITALS.filter(h=>h.status==='accepting').length} / ${HOSPITALS.length}</span></div>
    </div>
  `;
}

function renderSystem(){
  document.getElementById('systemBody').innerHTML = `
    <div class="chart-box">
      <h4>PLATFORM STATUS</h4>
      <div class="mrow"><span class="k">Simulation engine</span><span class="v"><span class="dot green"></span> ${simRunning?'Running':'Paused'}</span></div>
      <div class="mrow"><span class="k">AI triage module</span><span class="v"><span class="dot green"></span> Operational (rule-based)</span></div>
      <div class="mrow"><span class="k">Map service</span><span class="v"><span class="dot green"></span> OpenStreetMap / CARTO</span></div>
      <div class="mrow"><span class="k">Data mode</span><span class="v" style="color:var(--amber);">SIMULATED — no live feeds</span></div>
    </div>
    <div class="chart-box">
      <h4>ABOUT THIS DEMO</h4>
      <div class="es" style="font-size:12.5px; color:var(--text-dim); line-height:1.7;">
        CivicShield AI is a working prototype. All incidents, units, hospitals and locations are simulated for demonstration purposes and are not connected to real emergency services, real people, or real vehicle GPS data. AI classification is performed by a deterministic rules engine designed to be replaceable with a production model.
      </div>
    </div>
  `;
}

// ============ TOPBAR ============
function updateTopbarStats(){
  document.getElementById('tbActiveCount').textContent = incidents.filter(i=>i.status!=='RESOLVED').length;
  document.getElementById('tbAmbCount').textContent = ambulances.filter(a=>a.status==='AVAILABLE').length;
}

function renderAll(){
  renderSidebar();
  updateTopbarStats();
  renderCurrentView();
}

// ============ INCIDENT MODAL ============
function openIncidentModal(id){
  const inc = incidents.find(i=>i.id===id);
  if (!inc) return;
  const amb = ambulances.find(a=>a.id===inc.assignedAmbulance);
  const hosp = HOSPITALS.find(h=>h.id===inc.assignedHospital);
  const candidates = inc.status==='AI ANALYZING' || (!inc.assignedAmbulance && inc.status!=='RESOLVED') ? nearestAvailableAmbulances(inc,3) : [];

  document.getElementById('incidentModal').innerHTML = `
    <div class="modal-head">
      <div><div class="mid">${inc.id} · Reported ${inc.reportedAt.toLocaleTimeString()}</div>
      <h2>${inc.icon} ${inc.type}</h2></div>
      <button class="modal-close" onclick="closeOverlay('incidentModalOverlay')">×</button>
    </div>
    <div class="modal-body">
      <div style="display:flex; gap:8px; margin-bottom:14px;">
        <span class="badge ${inc.ai.severity.toLowerCase()}">${inc.ai.severity}</span>
        <span class="badge moderate">${inc.status}</span>
      </div>
      <div class="mrow"><span class="k">Location</span><span class="v">${inc.location}</span></div>
      <div class="mrow"><span class="k">Victims (est.)</span><span class="v">${inc.ai.victims}</span></div>
      <div class="mrow"><span class="k">AI Priority</span><span class="v">${inc.ai.priority}</span></div>
      <div class="mrow"><span class="k">Reporter</span><span class="v">${inc.reporter}</span></div>
      <div style="font-size:12.5px; color:var(--text-dim); margin-top:12px; line-height:1.6;">"${inc.description}"</div>

      <div class="ai-block" style="margin-top:16px;">
        <h4>⚡ AI INCIDENT ANALYSIS</h4>
        <div class="mrow"><span class="k">Medical urgency</span><span class="v">${inc.ai.urgency}</span></div>
        <div class="mrow"><span class="k">Recommended response</span><span class="v">${inc.ai.resources.join(', ')}</span></div>
        <div class="ai-reason">"${inc.ai.reasoning}"</div>
        <div style="font-size:11px; color:var(--text-dim); margin-top:10px; display:flex; justify-content:space-between;"><span>Confidence</span><span>${inc.ai.confidence}%</span></div>
        <div class="conf-bar"><div class="conf-fill" style="width:${inc.ai.confidence}%;"></div></div>
      </div>

      ${candidates.length ? `
      <div class="ai-block">
        <h4>🚑 AVAILABLE UNITS — AI RECOMMENDATION</h4>
        ${candidates.map((c,idx)=>`
          <div class="unit-pick ${idx===0?'best':''}">
            <div class="up-l"><div class="up-id">${c.a.id}</div><div class="up-meta">${c.dist.toFixed(1)} km · ETA ${Math.round(c.dist/c.a.speedKmh*60)} min · AVAILABLE</div></div>
            ${idx===0? `<button class="btn primary" onclick="dispatchFromModal('${inc.id}','${c.a.id}')">Dispatch</button>` : `<button class="btn secondary" onclick="dispatchFromModal('${inc.id}','${c.a.id}')">Select</button>`}
          </div>`).join('')}
        <div class="ai-reason">Recommending ${candidates[0].a.id} — shortest estimated response time among available medical units.</div>
      </div>` : ''}

      ${amb ? `
      <div class="ai-block">
        <h4>🚑 ASSIGNED UNIT</h4>
        <div class="mrow"><span class="k">Ambulance</span><span class="v">${amb.id} — ${amb.status}</span></div>
        <div class="mrow"><span class="k">ETA</span><span class="v">${amb.eta!=null? amb.eta+' min':'—'}</span></div>
        <div class="mrow"><span class="k">Distance</span><span class="v">${amb.distance!=null? amb.distance.toFixed(1)+' km':'—'}</span></div>
      </div>` : ''}

      ${hosp ? `<div class="mrow"><span class="k">Assigned hospital</span><span class="v">${hosp.name}</span></div>` : ''}

      <div style="margin-top:18px;">
        <h4 style="font-size:11px; letter-spacing:0.04em; color:var(--text-dim); margin-bottom:10px;">TIMELINE</h4>
        <div class="timeline">
          ${inc.timeline.map(t=>`<div class="tl-item"><div class="tl-dot"></div><div><div class="tl-time">${t.t.toLocaleTimeString()}</div><div class="tl-text">${t.text}</div></div></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn secondary" onclick="closeOverlay('incidentModalOverlay')">Close</button>
      ${inc.status!=='RESOLVED' && amb ? `<button class="btn primary" onclick="forceResolve('${inc.id}')">Mark Resolved</button>` : ''}
    </div>
  `;
  document.getElementById('incidentModalOverlay').classList.remove('hidden');
}
function dispatchFromModal(incId, ambId){
  dispatchAmbulance(incId, ambId);
  openIncidentModal(incId);
}
function forceResolve(incId){
  const inc = incidents.find(i=>i.id===incId);
  if (!inc) return;
  const amb = ambulances.find(a=>a.id===inc.assignedAmbulance);
  if (amb){ amb.status='AVAILABLE'; amb.target=null; amb.incidentId=null; amb.eta=null; amb.distance=null; }
  inc.status='RESOLVED';
  inc.timeline.push({t:new Date(), text:'Manually marked resolved by operator'});
  pushActivity(`<b>${inc.id}</b> marked resolved by operator`, 'RESOLVED');
  closeOverlay('incidentModalOverlay');
  renderAll();
}

function openUnitModal(kind, id){
  if (kind!=='amb') return;
  const amb = ambulances.find(a=>a.id===id);
  const inc = incidents.find(i=>i.id===amb.incidentId);
  document.getElementById('unitModal').innerHTML = `
    <div class="modal-head"><div><div class="mid">AMBULANCE</div><h2>${amb.id}</h2></div><button class="modal-close" onclick="closeOverlay('unitModalOverlay')">×</button></div>
    <div class="modal-body">
      <span class="badge ${statusClass(amb.status)}">${amb.status}</span>
      <div class="mrow" style="margin-top:12px;"><span class="k">Assigned incident</span><span class="v">${amb.incidentId||'—'}</span></div>
      <div class="mrow"><span class="k">Current speed</span><span class="v">${amb.speed? amb.speed+' km/h':'—'}</span></div>
      <div class="mrow"><span class="k">Distance</span><span class="v">${amb.distance!=null? amb.distance.toFixed(1)+' km':'—'}</span></div>
      <div class="mrow"><span class="k">ETA</span><span class="v">${amb.eta!=null? amb.eta+' min':'—'}</span></div>
      <div class="mrow"><span class="k">Destination</span><span class="v">${inc? inc.location : '—'}</span></div>
    </div>
    <div class="modal-foot"><button class="btn secondary" onclick="closeOverlay('unitModalOverlay')">Close</button>${inc?`<button class="btn primary" onclick="closeOverlay('unitModalOverlay'); openIncidentModal('${inc.id}')">View Incident</button>`:''}</div>
  `;
  document.getElementById('unitModalOverlay').classList.remove('hidden');
}

function closeOverlay(id){ document.getElementById(id).classList.add('hidden'); }

function handleSearch(q){
  q = q.trim().toUpperCase();
  if (!q) return;
  const inc = incidents.find(i=>i.id===q || i.id.includes(q));
  if (inc){ setNav('incidents'); openIncidentModal(inc.id); return; }
  const amb = ambulances.find(a=>a.id===q);
  if (amb){ setNav('ambulances'); openUnitModal('amb', amb.id); return; }
  const h = HOSPITALS.find(h=>h.id===q || h.name.toUpperCase().includes(q));
  if (h){ setNav('hospitals'); }
}

// ============ CITIZEN EXPERIENCE ============
function renderCitizen(){
  const body = document.getElementById('citizenBody');
  if (citizenState==='home'){
    body.innerHTML = `
      <div class="sos-wrap">
        <button class="sos-btn" onclick="openOverlay('sosConfirmOverlay')">
          <div class="sos-t">EMERGENCY SOS</div>
          <div class="sos-s">TAP TO REQUEST HELP</div>
        </button>
        <div class="sos-hint">Tap to request immediate assistance</div>
      </div>
      <div class="sec-label">REPORT AN EMERGENCY</div>
      <div class="report-grid">
        <button class="rep-opt" onclick="citizenReport('Road Accident')"><span class="emo">🚗</span>Accident</button>
        <button class="rep-opt" onclick="citizenReport('Building Fire')"><span class="emo">🔥</span>Fire</button>
        <button class="rep-opt" onclick="citizenReport('Medical Emergency')"><span class="emo">🏥</span>Medical</button>
        <button class="rep-opt" onclick="citizenReport('Other')"><span class="emo">⚠️</span>Other</button>
      </div>
      <div class="sec-label">MORE</div>
      <div>
        <div class="link-row" onclick="toast('Location shared','Live location shared with CivicShield AI')"><div class="lr-l">📍 Share Live Location</div><span class="arrow">›</span></div>
        <div class="link-row" onclick="citizenViewActive()"><div class="lr-l">🚑 My Active Emergency</div><span class="arrow">›</span></div>
        <div class="link-row" onclick="toast('Emergency Contacts','Feature available in full release')"><div class="lr-l">👥 Emergency Contacts</div><span class="arrow">›</span></div>
        <div class="link-row" onclick="citizenNearbyHospitals()"><div class="lr-l">🏥 Nearby Hospitals</div><span class="arrow">›</span></div>
      </div>
    `;
  } else if (citizenState==='report'){
    body.innerHTML = `
      <button class="lbtn ghost" style="padding:0; margin-bottom:16px; font-size:12px;" onclick="citizenState='home'; renderCitizen();">← Back</button>
      <div class="sec-label" style="margin-top:0;">REPORT EMERGENCY</div>
      <div class="form-row"><label>Emergency Type</label>
        <div class="chip-row" id="typeChips">
          ${['Road Accident','Building Fire','Medical Emergency','Other'].map(t=>`<button type="button" class="chip ${t===citizenReportType?'sel':''}" onclick="selectChip('${t}')">${t}</button>`).join('')}
        </div>
      </div>
      <div class="form-row"><label>Location</label><input value="Anna Nagar Main Road, Chennai" readonly></div>
      <div class="form-row"><label>Description</label><textarea id="repDesc" rows="3" placeholder="Describe what happened...">Two vehicles collided at the intersection. One person appears unconscious.</textarea></div>
      <div class="form-row"><label>Number of people affected</label><input id="repVictims" type="number" value="1" min="0"></div>
      <div class="form-row"><label>Attachments (optional)</label>
        <div style="display:flex; gap:8px;"><button class="btn secondary" style="flex:1;" onclick="toast('Photo attached','Simulated upload complete')">📷 Add Photo</button><button class="btn secondary" style="flex:1;" onclick="toast('Voice note added','Simulated recording saved')">🎙 Voice Note</button></div>
      </div>
      <button class="btn danger" style="width:100%; padding:13px; margin-top:8px;" onclick="submitCitizenReport()">REPORT EMERGENCY</button>
    `;
  } else if (citizenState==='active'){
    const inc = incidents.find(i=>i.id===citizenIncidentId);
    renderCitizenActive(inc);
  } else if (citizenState==='nearby'){
    body.innerHTML = `
      <button class="lbtn ghost" style="padding:0; margin-bottom:16px; font-size:12px;" onclick="citizenState='home'; renderCitizen();">← Back</button>
      <div class="sec-label" style="margin-top:0;">NEARBY HOSPITALS</div>
      ${HOSPITALS.map(h=>`
        <div class="icard" style="margin-bottom:10px; cursor:default;">
          <div class="icard-top"><span class="icard-id">${h.id}</span><span class="badge ${h.status==='accepting'?'available':h.status==='limited'?'high':'critical'}">${h.status==='accepting'?'ACCEPTING':h.status==='limited'?'LIMITED':'FULL'}</span></div>
          <div class="icard-title">${h.name}</div>
          <div class="icard-loc">Beds: ${h.beds} · ICU: ${h.icu}</div>
        </div>`).join('')}
    `;
  }
}
let citizenReportType = 'Road Accident';
function selectChip(t){ citizenReportType=t; renderCitizen(); }
function citizenReport(type){ citizenReportType=type; citizenState='report'; renderCitizen(); }
function citizenViewActive(){
  if (!citizenIncidentId){ toast('No active emergency','You have no ongoing emergency report'); return; }
  citizenState='active'; renderCitizen();
}
function citizenNearbyHospitals(){ citizenState='nearby'; renderCitizen(); }

function openOverlay(id){ document.getElementById(id).classList.remove('hidden'); }

function sendSOS(){
  closeOverlay('sosConfirmOverlay');
  const inc = createIncident({ templateIndex: 3 }); // road accident w/ bleeding
  citizenIncidentId = inc.id;
  citizenState = 'active';
  citizenSOSStage = 0;
  renderCitizen();
  runCitizenSOSSequence(inc);
  renderAll();
}

let citizenSOSStage = 0;
function runCitizenSOSSequence(inc){
  const stages = [700, 1600, 1600, 1400, 1200]; // ms between steps
  let i = 0;
  function next(){
    citizenSOSStage = i+1;
    renderCitizenActive(inc);
    if (i < stages.length-1){ i++; setTimeout(next, stages[i-1]); }
    else {
      // dispatch after analysis complete
      setTimeout(()=>{
        const cands = nearestAvailableAmbulances(inc,1);
        if (cands[0]) dispatchAmbulance(inc.id, cands[0].a.id);
        if (citizenState==='active') renderCitizenActive(incidents.find(x=>x.id===inc.id));
      }, 900);
    }
  }
  setTimeout(next, stages[0]);
}

function citizenSubmitReportSequence(inc){
  citizenSOSStage = 5; // skip straight to analysis view since it's a form report
  setTimeout(()=>{
    const cands = nearestAvailableAmbulances(inc,1);
    if (cands[0]) dispatchAmbulance(inc.id, cands[0].a.id);
    if (citizenState==='active') renderCitizenActive(incidents.find(x=>x.id===inc.id));
  }, 1800);
}

function submitCitizenReport(){
  const desc = document.getElementById('repDesc').value || 'Emergency reported via app.';
  const victims = parseInt(document.getElementById('repVictims').value)||1;
  const tplIndex = INCIDENT_TEMPLATES.findIndex(t=>t.type===citizenReportType);
  const inc = createIncident({ templateIndex: tplIndex>=0?tplIndex:5 });
  inc.description = desc; inc.victims = victims;
  inc.ai = analyzeIncident({type:citizenReportType, description:desc, victims});
  citizenIncidentId = inc.id;
  citizenState = 'active';
  citizenSOSStage = 5;
  renderCitizen();
  citizenSubmitReportSequence(inc);
  renderAll();
}

const SOS_STEPS = ['Alert received','Location verified','AI analysis complete','Response unit selected','Unit dispatched'];
function renderCitizenActive(inc){
  const body = document.getElementById('citizenBody');
  if (!inc){ citizenState='home'; renderCitizen(); return; }
  const amb = ambulances.find(a=>a.id===inc.assignedAmbulance);
  body.innerHTML = `
    <div class="ea-wrap">
      <div class="ea-id">${inc.id}</div>
      <div class="ea-title">${amb ? 'RESPONSE EN ROUTE' : 'EMERGENCY ACTIVE'}</div>
      <div style="font-size:12px; color:var(--text-dim); margin-bottom:14px;">📍 ${inc.location}</div>
      <div class="ea-steps">
        ${SOS_STEPS.map((s,idx)=>`
          <div class="ea-step ${idx < citizenSOSStage ? 'on':''} ${idx===citizenSOSStage-1 && !amb ?'active':''}">
            <div class="chk">${idx<citizenSOSStage?'✓':''}</div>${s}
          </div>`).join('')}
      </div>
      ${amb ? `
      <div class="ea-unit">
        <div class="ea-unit-top"><div class="u-name">🚑 Ambulance ${amb.id}</div><span class="badge ${statusClass(amb.status)}">${amb.status}</span></div>
        <div class="ea-eta">
          <div><div class="n">${amb.eta!=null?amb.eta:'--'}</div><div class="l">ETA (MIN)</div></div>
          <div><div class="n">${amb.distance!=null?amb.distance.toFixed(1):'--'}</div><div class="l">KM AWAY</div></div>
        </div>
      </div>
      <button class="btn primary" style="width:100%; margin-top:14px; padding:12px;" onclick="toast('Live Response','Tracking view synced with Command Center map')">VIEW LIVE RESPONSE</button>
      ` : `<div style="text-align:center; color:var(--text-faint); font-size:12px; margin-top:10px;">Finding nearest response unit…</div>`}
      ${inc.status==='RESOLVED' ? `<div class="badge resolved" style="margin-top:16px;">INCIDENT RESOLVED</div>` : ''}
      <button class="lbtn ghost" style="padding:0; margin-top:20px; font-size:12px;" onclick="citizenState='home'; renderCitizen();">← Back to home</button>
    </div>
  `;
}
// keep citizen active screen synced with sim
setInterval(()=>{ if (citizenState==='active' && citizenIncidentId){ const inc = incidents.find(i=>i.id===citizenIncidentId); if (inc) renderCitizenActive(inc); } }, 1200);

// ============ ENTRY / NAV ============
function enterCommand(){
  document.getElementById('landing').style.display='none';
  document.getElementById('citizen').classList.remove('active');
  document.getElementById('command').classList.add('active');
  if (!map) initMap();
  setNav('overview');
  updateMapMarkers();
  renderAll();
}
function enterCitizen(){
  document.getElementById('landing').style.display='none';
  document.getElementById('command').classList.remove('active');
  document.getElementById('citizen').classList.add('active');
  citizenState='home';
  renderCitizen();
}
function enterDemo(){
  enterCommand();
  setTimeout(()=>toast('Demo Mode','Simulated live activity in progress',undefined), 500);
}
function exitToLanding(){
  document.getElementById('command').classList.remove('active');
  document.getElementById('citizen').classList.remove('active');
  document.getElementById('landing').style.display='flex';
  updateLandingStatusStrip();
  if (landingMap){ setTimeout(()=>{ landingMap.invalidateSize(); updateLandingScene(); }, 60); }
}

// ============ BOOT ============
initData();
renderSidebar();
updateLandingStatusStrip();
initLandingMap();
