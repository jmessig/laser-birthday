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
  // Target Practice — tighter timing, fewer targets visible, need more hits
  targetPracticeDuration: 25,     // seconds (shorter!)
  targetHitsToWin: 15,            // need 15 hits — gotta be fast
  targetVisibleTime: [1200, 2200], // ms range (faster disappear)
  maxVisibleTargets: 3,           // more on screen at once
  targetSpawnDelay: [250, 500],   // ms between spawns (faster)
  autoPassAfterFailures: 3,

  // Code Cracker — more rounds, longer sequences
  simonRounds: 5,
  simonSequenceLengths: [2, 3, 4, 5, 6],
  simonFlashDuration: 700,       // ms per flash (slightly faster)

  // Laser Maze
  mazeSize: 12,
  laserOnTime: 1500,             // ms
  laserOffTime: 1500,            // ms
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
