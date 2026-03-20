// Sound utility – plays Web Audio API tones (no external files needed)
const ctx = () => new (window.AudioContext || window.webkitAudioContext)();

export const playNotif = () => {
  try {
    const ac = ctx(); const o = ac.createOscillator(); const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(880, ac.currentTime);
    g.gain.setValueAtTime(0.3, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    o.start(); o.stop(ac.currentTime + 0.3);
  } catch {}
};

export const playRing = (stopRef) => {
  let running = true;
  stopRef.stop = () => { running = false; };
  const ring = () => {
    if (!running) return;
    try {
      const ac = ctx(); const o = ac.createOscillator(); const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(440, ac.currentTime);
      o.frequency.setValueAtTime(660, ac.currentTime + 0.2);
      g.gain.setValueAtTime(0.4, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
      o.start(); o.stop(ac.currentTime + 0.5);
    } catch {}
    setTimeout(() => { if (running) ring(); }, 1200);
  };
  ring();
};

export const playCallEnd = () => {
  try {
    const ac = ctx(); const o = ac.createOscillator(); const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(220, ac.currentTime);
    g.gain.setValueAtTime(0.3, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
    o.start(); o.stop(ac.currentTime + 0.6);
  } catch {}
};
