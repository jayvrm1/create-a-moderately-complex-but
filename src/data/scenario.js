/**
 * Fictional exercise data for RESCUELINK // AEGIS.
 * All incidents, teams, places and people counts are invented for demonstration.
 */

export const EXERCISE = {
  name: 'MONSOON FLOOD RESPONSE',
  sector: 'SECTOR V-7 · KAIVA BASIN',
  exerciseId: 'EX-2261',
  grid: 'GRID 1000 × 700 · SCHEMATIC / NOT GEOGRAPHIC',
};

export const DEFAULT_NETWORK = {
  normal: 'unavailable',
  mesh: 'off',
  gateway: 'connected',
};

export const GATEWAY = {
  id: 'AEGIS-GW-01',
  label: 'AEGIS Gateway',
  sublabel: 'Ridge relay uplink',
  x: 930,
  y: 96,
  range: 430,
};

export const RELAY_NODES = [
  { id: 'N-01', label: 'AEGIS-01 Spillway', short: 'Spillway', x: 285, y: 250, radius: 170, linkRange: 300, status: 'active', power: '87%' },
  { id: 'N-02', label: 'AEGIS-02 Levee', short: 'Levee', x: 500, y: 210, radius: 180, linkRange: 300, status: 'active', power: '74%' },
  { id: 'N-03', label: 'AEGIS-03 Transit', short: 'Transit', x: 704, y: 416, radius: 160, linkRange: 300, status: 'active', power: '61%' },
  { id: 'N-04', label: 'AEGIS-04 Ridge', short: 'Ridge', x: 860, y: 300, radius: 150, linkRange: 300, status: 'standby', power: '92%' },
  { id: 'N-05', label: 'AEGIS-05 Delta', short: 'Delta', x: 430, y: 560, radius: 150, linkRange: 300, status: 'offline', power: '—' },
];

export const TEAMS = [
  {
    id: 'VOLT-01',
    name: 'Swiftwater 1',
    role: 'Swiftwater rescue',
    capacity: 12,
    x: 250,
    y: 300,
    status: 'available',
    assignment: null,
    note: 'Boat + line kit staged at Kaiva depot.',
  },
  {
    id: 'VOLT-02',
    name: 'Medic 2',
    role: 'Field medical',
    capacity: 8,
    x: 520,
    y: 470,
    status: 'en_route',
    assignment: 'RL-0402',
    note: 'Already tasked — en route to Kaiva East Culvert.',
  },
  {
    id: 'VOLT-03',
    name: 'Heavy 3',
    role: 'High-clearance transport',
    capacity: 24,
    x: 752,
    y: 258,
    status: 'available',
    assignment: null,
    note: 'Amphibious transport, slow on flooded roads.',
  },
  {
    id: 'VOLT-04',
    name: 'Kestrel 4',
    role: 'Aerial recon',
    capacity: 3,
    x: 640,
    y: 600,
    status: 'available',
    assignment: null,
    note: 'Recon crew only — no mass evacuation capacity.',
  },
  {
    id: 'VOLT-05',
    name: 'Ridge 5',
    role: 'Evacuation bus',
    capacity: 10,
    x: 906,
    y: 556,
    status: 'unavailable',
    assignment: null,
    note: 'Restocking at Ridge staging area.',
  },
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
];

export const REPORT_SOURCES = [
  'Mesh text burst',
  'Cached SMS relay',
  'Voice report (relayed)',
  'Field radio handoff',
  'Unknown — mesh ping',
];

/** Reports defined relative to scenario start, so Reset reproduces the same picture. */
export const SEED_REPORTS = [
  {
    id: 'RL-0423',
    severity: 'critical',
    people: 21,
    site: 'Greyfall Transit Shed',
    x: 840,
    y: 210,
    offsetMin: 33,
    confidence: 0.52,
    source: 'Cached SMS relay',
    status: 'open',
    note: 'Shelter roof breached; people moved to the upper platform.',
  },
  {
    id: 'RL-0419',
    severity: 'critical',
    people: 14,
    site: 'Tessel Primary Shelter',
    x: 560,
    y: 470,
    offsetMin: 41,
    confidence: 0.91,
    source: 'Voice report (relayed)',
    status: 'open',
    note: 'Water at first-floor windows, generator failing.',
  },
  {
    id: 'RL-0417',
    severity: 'critical',
    people: 9,
    site: 'Sarn Spillway Pump House',
    x: 330,
    y: 300,
    offsetMin: 12,
    confidence: 0.72,
    source: 'Mesh text burst',
    status: 'open',
    note: 'Two workers on the pump gantry, spillway still rising.',
  },
  {
    id: 'RL-0421',
    severity: 'high',
    people: 6,
    site: 'North Levee Gate 3',
    x: 690,
    y: 352,
    offsetMin: 19,
    confidence: 0.38,
    source: 'Unknown — mesh ping',
    status: 'open',
    note: 'Position uncertain; ping arrived without a text body.',
  },
  {
    id: 'RL-0418',
    severity: 'high',
    people: 4,
    site: 'Old Tessel Road Bridge',
    x: 170,
    y: 470,
    offsetMin: 26,
    confidence: 0.58,
    source: 'Cached SMS relay',
    status: 'open',
    note: 'Family stranded under the bridge approach.',
  },
  {
    id: 'RL-0424',
    severity: 'moderate',
    people: 5,
    site: 'Ostrel Row Apartments',
    x: 470,
    y: 368,
    offsetMin: 63,
    confidence: 0.77,
    source: 'Voice report (relayed)',
    status: 'open',
    note: 'Second floor dry, food and insulin running low.',
  },
  {
    id: 'RL-0420',
    severity: 'moderate',
    people: 3,
    site: 'Kaiva Market Roof',
    x: 240,
    y: 170,
    offsetMin: 8,
    confidence: 0.64,
    source: 'Mesh text burst',
    status: 'open',
    note: 'Traders on the market roof, no injuries reported.',
  },
  {
    id: 'RL-0422',
    severity: 'low',
    people: 2,
    site: 'Lorn Clinic Annex',
    x: 410,
    y: 640,
    offsetMin: 55,
    confidence: 0.83,
    source: 'Field radio handoff',
    status: 'open',
    note: 'Staff request resupply; building currently safe.',
  },
  {
    id: 'RL-0402',
    severity: 'high',
    people: 3,
    site: 'Kaiva East Culvert',
    x: 600,
    y: 520,
    offsetMin: 47,
    confidence: 0.8,
    source: 'Field radio handoff',
    status: 'assigned',
    assignedTeam: 'VOLT-02',
    assignedAtLabel: 'earlier this watch',
    note: 'Two adults and a child lifted out of the culvert channel.',
  },
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
