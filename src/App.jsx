import { useState, useCallback, useRef } from 'react';
import { initAudio, setMuted } from './audio';
import ParticleOverlay from './components/ParticleOverlay';
import TitleScreen from './components/TitleScreen';
import MissionHub from './components/MissionHub';
import TargetPractice from './components/TargetPractice';
import CodeCracker from './components/CodeCracker';
import LaserMaze from './components/LaserMaze';
import InvitationReveal from './components/InvitationReveal';

/*
  SCREENS:
  'title'       — Title screen with agent name input
  'hub'         — Mission select HQ
  'mission1'    — Target Practice
  'mission2'    — Code Cracker
  'mission3'    — Laser Maze
  'invitation'  — Final invitation reveal
*/

export default function App() {
  const [screen, setScreen] = useState('title');
  const [agentName, setAgentName] = useState('');
  const [missions, setMissions] = useState([false, false, false]); // completed flags
  const [muted, setMutedState] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const audioInitRef = useRef(false);

  const ensureAudio = useCallback(() => {
    if (!audioInitRef.current) {
      initAudio();
      audioInitRef.current = true;
    }
  }, []);

  const navigateTo = useCallback((target) => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen(target);
      setTransitioning(false);
    }, 300);
  }, []);

  const completeMission = useCallback((index) => {
    setMissions(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    navigateTo('hub');
  }, [navigateTo]);

  const toggleMute = useCallback(() => {
    setMutedState(prev => {
      const next = !prev;
      setMuted(next);
      return next;
    });
  }, []);

  const handleStart = useCallback((name) => {
    ensureAudio();
    setAgentName(name || 'Agent');
    navigateTo('hub');
  }, [ensureAudio, navigateTo]);

  const handleSkipToInvite = useCallback(() => {
    ensureAudio();
    setAgentName(agentName || 'Agent');
    navigateTo('invitation');
  }, [ensureAudio, agentName, navigateTo]);

  return (
    <>
      {/* Global particle overlay */}
      <ParticleOverlay />

      {/* Mute button */}
      <button className="mute-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
        {muted ? '\u{1F507}' : '\u{1F50A}'}
      </button>

      {/* Screen transition overlay */}
      {transitioning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0a1a',
          zIndex: 998,
          animation: 'fadeInUp 0.3s ease-out',
        }} />
      )}

      {/* Screens */}
      {screen === 'title' && (
        <TitleScreen
          onStart={handleStart}
          onSkip={handleSkipToInvite}
          ensureAudio={ensureAudio}
        />
      )}
      {screen === 'hub' && (
        <MissionHub
          missions={missions}
          agentName={agentName}
          onSelectMission={(i) => navigateTo(`mission${i + 1}`)}
          onDecrypt={() => navigateTo('invitation')}
        />
      )}
      {screen === 'mission1' && (
        <TargetPractice
          onComplete={() => completeMission(0)}
          onBack={() => navigateTo('hub')}
        />
      )}
      {screen === 'mission2' && (
        <CodeCracker
          onComplete={() => completeMission(1)}
          onBack={() => navigateTo('hub')}
        />
      )}
      {screen === 'mission3' && (
        <LaserMaze
          onComplete={() => completeMission(2)}
          onBack={() => navigateTo('hub')}
        />
      )}
      {screen === 'invitation' && (
        <InvitationReveal agentName={agentName} />
      )}
    </>
  );
}
