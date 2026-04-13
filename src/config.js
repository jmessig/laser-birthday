// ============================================
// PARTY CONFIGURATION — Edit these values!
// ============================================
export const PARTY_CONFIG = {
  birthdayKidName: "Colton Essig",
  kidAge: 6,
  partyDate: "Saturday, May 30th, 2026",
  partyTimeStart: "11:00 AM",
  partyTimeEnd: "2:00 PM",
  venueName: "Apex Entertainment",
  venueAddress: "Albany, NY",
  rsvpName: "Shana",
  rsvpPhone: "201-519-4933",
  rsvpEmail: "smg6980@gmail.com",
  rsvpDeadline: "May 18th",
  missionDetails: "Laser Tag \u2022 Pizza \u2022 Cake \u2022 Fun!",
};

// ============================================
// GAME SETTINGS
// ============================================
export const GAME_CONFIG = {
  // Target Practice
  targetPracticeDuration: 30,     // seconds
  targetHitsToWin: 10,            // need 10 hits
  targetVisibleTime: [1500, 2800], // ms range
  maxVisibleTargets: 3,
  targetSpawnDelay: [250, 500],   // ms between spawns
  autoPassAfterFailures: 3,

  // Code Cracker
  simonRounds: 4,
  simonSequenceLengths: [2, 3, 4, 5],
  simonFlashDuration: 850,       // ms per flash

  // Laser Maze
  mazeSize: 12,
  laserOnTime: 1200,             // ms
  laserOffTime: 2000,            // ms
  laserWarningTime: 500,         // ms before activation
};

// ============================================
// THEME COLORS
// ============================================
export const COLORS = {
  bgDeep: '#0a0a1a',
  neonGreen: '#39FF14',
  electricCyan: '#00FFFF',
  hotMagenta: '#FF00FF',
  laserRed: '#FF073A',
  electricPurple: '#BF00FF',
  warmGold: '#FFD700',
};
