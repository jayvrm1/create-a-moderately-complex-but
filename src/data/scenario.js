/**
 * Fictional exercise data for RESCUELINK.
 * Every incident, team, drone, place and people count is invented for demonstration.
 * Map coordinates live in a 1000 x 700 schematic grid — not geographic coordinates.
 */

export const EXERCISE = {
  name: 'MONSOON FLOOD RESPONSE',
  mapTitle: 'RESPONSE MAP · KAIVA BASIN',
  sector: 'SECTOR V-7',
  id: 'EX-2261',
  grid: 'SCHEMATIC GRID 1000 × 700 · NOT GEOGRAPHIC',
};

export const DEFAULT_NETWORK = {
  normal: 'unavailable',
  mesh: 'on',
  gateway: 'connected',
};

export const GATEWAY = {
  id: 'GW-01',
  label: 'AEGIS GATEWAY',
  sub: 'RIDGE UPLINK',
  x: 930,
  y: 96,
  range: 300,
};

export const STAGING = { x: 930, y: 330, label: 'STAGING PAD' };

/**
 * Relay drones. Each active drone follows a fixed waypoint route at a fixed
 * simulated speed, so its position is a pure function of elapsed sim time.
 * speed is in map units per simulated second.
 */
export const DRONES = [
  {
    id: 'HRN-1',
    callsign: 'HERON 1',
    status: 'active',
    range: 170,
    linkRange: 265,
    speed: 22,
    batteryStart: 78,
    drain: 0.09,
    start: { x: 168, y: 142 },
    labelSide: 'left',
    labelDy: 14,
    routeName: 'WEST COVERAGE SWEEP',
    legs: [
      { to: { x: 288, y: 236 }, task: 'REPOSITION · SARN GAP' },
      { to: { x: 412, y: 302 }, task: 'HOLD SPACING · OSTREL' },
      { to: { x: 812, y: 292 }, task: 'RTB STAGING' },
    ],
    holdTask: 'RECOVERING · STAGING',
    recoverAtStaging: true,
  },
  {
    id: 'HRN-2',
    callsign: 'HERON 2',
    status: 'active',
    range: 170,
    linkRange: 265,
    speed: 20,
    batteryStart: 64,
    drain: 0.11,
    start: { x: 700, y: 600 },
    routeName: 'GREYFALL RELAY CLIMB',
    legs: [
      { to: { x: 800, y: 430 }, task: 'CLIMB · GREYFALL LINE' },
      { to: { x: 862, y: 268 }, task: 'COVER GREYFALL' },
    ],
    holdTask: 'HOLDING · GREYFALL',
  },
  {
    id: 'HRN-3',
    callsign: 'HERON 3',
    status: 'active',
    range: 165,
    linkRange: 265,
    speed: 18,
    batteryStart: 88,
    drain: 0.07,
    start: { x: 396, y: 524 },
    labelSide: 'left',
    labelDy: -18,
    routeName: 'TESSEL RELAY CHAIN',
    legs: [
      { to: { x: 452, y: 548 }, task: 'SPACING · TESSEL' },
      { to: { x: 724, y: 424 }, task: 'REINFORCE TESSEL CHAIN' },
    ],
    holdTask: 'HOLDING · TESSEL CHAIN',
  },
  {
    id: 'HRN-4',
    callsign: 'HERON 4',
    status: 'offline',
    range: 165,
    linkRange: 265,
    speed: 0,
    batteryStart: 9,
    drain: 0,
    start: { x: 432, y: 566 },
    routeName: 'GROUNDED — NO POWER',
    standbyTask: 'HOLDING · PAD',
    legs: [],
  },
  {
    id: 'HRN-5',
    callsign: 'HERON 5',
    status: 'standby',
    range: 165,
    linkRange: 265,
    speed: 0,
    batteryStart: 100,
    drain: 0,
    start: { x: 930, y: 400 },
    labelSide: 'left',
    routeName: 'STANDBY — STAGING PAD',
    standbyTask: 'HOLDING · STAGING PAD',
    legs: [],
  },
];

export const TEAMS = [
  { id: 'VOLT-01', name: 'Swiftwater 1', role: 'Swiftwater rescue', capacity: 12, x: 250, y: 300, status: 'available', assignment: null, labelSide: 'left', note: 'Boat and line kit staged at Kaiva depot.' },
  { id: 'VOLT-02', name: 'Medic 2', role: 'Field medical', capacity: 8, x: 520, y: 470, status: 'en_route', assignment: 'RL-0402', labelSide: 'left', note: 'Already tasked to Kaiva East Culvert.' },
  { id: 'VOLT-03', name: 'Heavy 3', role: 'High-clearance transport', capacity: 24, x: 730, y: 208, status: 'available', assignment: null, labelSide: 'left', note: 'Amphibious transport, slow on flooded roads.' },
  { id: 'VOLT-04', name: 'Kestrel 4', role: 'Aerial recon', capacity: 3, x: 640, y: 600, status: 'available', assignment: null, labelSide: 'left', note: 'Recon crew only — no mass evacuation capacity.' },
  { id: 'VOLT-05', name: 'Ridge 5', role: 'Evacuation bus', capacity: 10, x: 906, y: 556, status: 'unavailable', assignment: null, labelSide: 'left', labelDy: 12, note: 'Restocking at Ridge staging area.' },
];

export const REPORT_SITES = [
  { label: 'Sarn Spillway Pump House', x: 330, y: 300 },
  { label: 'Old Tessel Road Bridge', x: 170, y: 470 },
  { label: 'Tessel Primary Shelter', x: 560, y: 470 },
  { label: 'Kaiva Market Roof', x: 240, y: 170 },
  { label: 'North Levee Gate 3', x: 690, y: 352 },
  { label: 'Lorn Clinic Annex', x: 410, y: 640 },
  { label: 'Greyfall Transit Shed', x: 840, y: 210 },
  { label: 'Ostrel Row Apartments', x: 470, y: 368 },
  { label: 'Kaiva East Culvert', x: 600, y: 520 },
  { label: 'Delta Ferry Landing', x: 300, y: 580 },
  { label: 'Ostrel Footbridge', x: 560, y: 300 },
  { label: 'Ridge Water Tower', x: 780, y: 520 },
];

export const REPORT_SOURCES = [
  'Mesh text burst',
  'Cached SMS relay',
  'Voice report (relayed)',
  'Field radio handoff',
  'Unknown — mesh ping',
];

/** seedAgeMin = report age at T+0. Age grows only while the simulation runs. */
export const SEED_REPORTS = [
  { id: 'RL-0423', severity: 'critical', people: 21, site: 'Greyfall Transit Shed', x: 840, y: 210, seedAgeMin: 33, confidence: 0.52, source: 'Cached SMS relay', status: 'open', note: 'Shelter roof breached; people moved to the upper platform.' },
  { id: 'RL-0419', severity: 'critical', people: 14, site: 'Tessel Primary Shelter', x: 560, y: 470, seedAgeMin: 41, confidence: 0.91, source: 'Voice report (relayed)', status: 'open', note: 'Water at first-floor windows, generator failing.' },
  { id: 'RL-0417', severity: 'critical', people: 9, site: 'Sarn Spillway Pump House', x: 330, y: 300, seedAgeMin: 12, confidence: 0.72, source: 'Mesh text burst', status: 'open', note: 'Two workers on the pump gantry, spillway still rising.' },
  { id: 'RL-0421', severity: 'high', people: 6, site: 'North Levee Gate 3', x: 690, y: 352, seedAgeMin: 19, confidence: 0.38, source: 'Unknown — mesh ping', status: 'open', note: 'Position uncertain; ping arrived without a text body.' },
  { id: 'RL-0418', severity: 'high', people: 4, site: 'Old Tessel Road Bridge', x: 170, y: 470, seedAgeMin: 26, confidence: 0.58, source: 'Cached SMS relay', status: 'open', note: 'Family stranded under the bridge approach.' },
  { id: 'RL-0424', severity: 'moderate', people: 5, site: 'Ostrel Row Apartments', x: 470, y: 368, seedAgeMin: 63, confidence: 0.77, source: 'Voice report (relayed)', status: 'open', note: 'Second floor dry, food and insulin running low.' },
  { id: 'RL-0420', severity: 'moderate', people: 3, site: 'Kaiva Market Roof', x: 240, y: 170, seedAgeMin: 8, confidence: 0.64, source: 'Mesh text burst', status: 'open', note: 'Traders on the market roof, no injuries reported.' },
  { id: 'RL-0422', severity: 'low', people: 2, site: 'Lorn Clinic Annex', x: 410, y: 616, seedAgeMin: 55, confidence: 0.83, source: 'Field radio handoff', status: 'open', note: 'Staff request resupply; building currently safe.' },
  { id: 'RL-0402', severity: 'high', people: 3, site: 'Kaiva East Culvert', x: 600, y: 520, seedAgeMin: 47, confidence: 0.8, source: 'Field radio handoff', status: 'assigned', assignedTeam: 'VOLT-02', assignedAtSim: -1260, note: 'Two adults and a child lifted out of the culvert channel.' },
];

export const SEED_EVENTS = [
  { atSim: -840, kind: 'network', tone: 'warn', text: 'Normal network simulated unavailable across the Kaiva Basin.' },
  { atSim: -760, kind: 'report', tone: 'warn', text: 'RL-0402 received via field radio handoff — 3 people at Kaiva East Culvert.' },
  { atSim: -700, kind: 'dispatch', tone: 'ok', text: 'DISPATCH — VOLT-02 Medic 2 tasked to RL-0402 (operator approved).' },
  { atSim: -620, kind: 'report', tone: 'warn', text: 'RL-0419 received via relayed voice report — 14 people at Tessel Primary Shelter.' },
  { atSim: -480, kind: 'report', tone: 'warn', text: 'RL-0423 received via cached SMS relay — 21 people at Greyfall Transit Shed.' },
  { atSim: -180, kind: 'network', tone: 'warn', text: 'Relay mesh engaged and gateway connected — three drones at launch positions.' },
];

export const FLOOD_BOUNDARY = [
  [70, 430], [150, 360], [255, 385], [330, 425], [410, 400], [500, 430],
  [585, 405], [660, 445], [745, 430], [820, 480], [900, 505], [960, 600],
  [905, 665], [800, 690], [665, 675], [520, 690], [370, 665], [235, 690],
  [120, 640], [55, 540],
];

export const RIVER_PATH = [
  [10, 470], [120, 455], [220, 500], [310, 540], [420, 505], [520, 540],
  [620, 520], [720, 560], [830, 545], [940, 590], [995, 585],
];
