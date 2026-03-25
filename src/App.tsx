import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Cpu, Activity, Terminal, Zap, AlertTriangle } from 'lucide-react';

// --- SYSTEM_TYPES ---
type GridCoord = { x: number; y: number };
type Vector = 'U' | 'D' | 'L' | 'R';

interface AudioStream {
  id: string;
  label: string;
  source: string;
  bitrate: string;
}

// --- SYSTEM_CONSTANTS ---
const GRID_DIM = 20;
const CORE_SNAKE: GridCoord[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const TICK_RATE = 120;

const STREAMS: AudioStream[] = [
  {
    id: "0x01",
    label: "VOID_SIGNAL",
    source: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    bitrate: "128kbps"
  },
  {
    id: "0x02",
    label: "NEURAL_STATIC",
    source: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    bitrate: "256kbps"
  },
  {
    id: "0x03",
    label: "GHOST_PROTOCOL",
    source: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    bitrate: "320kbps"
  }
];

export default function App() {
  // --- AUDIO_SUBSYSTEM ---
  const [streamIndex, setStreamIndex] = useState(0);
  const [active, setActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- LOGIC_SUBSYSTEM ---
  const [segments, setSegments] = useState<GridCoord[]>(CORE_SNAKE);
  const [vector, setVector] = useState<Vector>('U');
  const [target, setTarget] = useState<GridCoord>({ x: 5, y: 5 });
  const [dataHarvested, setDataHarvested] = useState(0);
  const [criticalFailure, setCriticalFailure] = useState(false);
  const [suspended, setSuspended] = useState(true);
  const cycleRef = useRef<NodeJS.Timeout | null>(null);

  // --- AUDIO_CONTROL ---
  useEffect(() => {
    if (audioRef.current) {
      if (active) {
        audioRef.current.play().catch(() => setActive(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [active, streamIndex]);

  const toggleStream = () => setActive(!active);
  
  const shiftStream = (dir: 1 | -1) => {
    setStreamIndex((prev) => (prev + dir + STREAMS.length) % STREAMS.length);
    setActive(true);
  };

  // --- LOGIC_ENGINE ---
  const relocateTarget = useCallback((currentSegments: GridCoord[]): GridCoord => {
    let nextTarget: GridCoord;
    while (true) {
      nextTarget = {
        x: Math.floor(Math.random() * GRID_DIM),
        y: Math.floor(Math.random() * GRID_DIM),
      };
      if (!currentSegments.some(s => s.x === nextTarget.x && s.y === nextTarget.y)) break;
    }
    return nextTarget;
  }, []);

  const initializeSystem = () => {
    setSegments(CORE_SNAKE);
    setVector('U');
    setTarget(relocateTarget(CORE_SNAKE));
    setDataHarvested(0);
    setCriticalFailure(false);
    setSuspended(false);
  };

  const processCycle = useCallback(() => {
    if (criticalFailure || suspended) return;

    setSegments(prev => {
      const head = prev[0];
      const nextHead = { ...head };

      switch (vector) {
        case 'U': nextHead.y -= 1; break;
        case 'D': nextHead.y += 1; break;
        case 'L': nextHead.x -= 1; break;
        case 'R': nextHead.x += 1; break;
      }

      if (nextHead.x < 0 || nextHead.x >= GRID_DIM || nextHead.y < 0 || nextHead.y >= GRID_DIM ||
          prev.some(s => s.x === nextHead.x && s.y === nextHead.y)) {
        setCriticalFailure(true);
        return prev;
      }

      const nextSegments = [nextHead, ...prev];
      if (nextHead.x === target.x && nextHead.y === target.y) {
        setDataHarvested(d => d + 64);
        setTarget(relocateTarget(nextSegments));
      } else {
        nextSegments.pop();
      }
      return nextSegments;
    });
  }, [vector, target, criticalFailure, suspended, relocateTarget]);

  useEffect(() => {
    const captureInput = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (vector !== 'D') setVector('U'); break;
        case 'ArrowDown': if (vector !== 'U') setVector('D'); break;
        case 'ArrowLeft': if (vector !== 'R') setVector('L'); break;
        case 'ArrowRight': if (vector !== 'L') setVector('R'); break;
        case 'Enter': setSuspended(s => !s); break;
      }
    };
    window.addEventListener('keydown', captureInput);
    return () => window.removeEventListener('keydown', captureInput);
  }, [vector]);

  useEffect(() => {
    if (!criticalFailure && !suspended) {
      cycleRef.current = setInterval(processCycle, TICK_RATE);
    } else {
      if (cycleRef.current) clearInterval(cycleRef.current);
    }
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, [processCycle, criticalFailure, suspended]);

  return (
    <div className="min-h-screen bg-void-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="scanline" />
      <div className="noise" />

      {/* SYSTEM_HEADER */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-12 text-center z-10"
      >
        <h1 className="text-6xl font-bold tracking-widest glitch-text text-glitch-cyan" data-text="VOID_RUNNER_v0.9">
          VOID_RUNNER_v0.9
        </h1>
        <div className="flex items-center justify-center gap-4 mt-2 text-glitch-magenta text-xs">
          <span className="animate-pulse flex items-center gap-1"><Activity size={12}/> SYSTEM_LIVE</span>
          <span className="flex items-center gap-1"><Cpu size={12}/> CORE_TEMP: 42°C</span>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[300px_1fr_300px] gap-8 w-full max-w-7xl z-10">
        
        {/* AUDIO_MODULE */}
        <div className="pixel-border p-4 bg-void-black/80 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-glitch-cyan pb-2 mb-2">
            <Terminal size={16} className="text-glitch-magenta" />
            <span className="text-sm uppercase">Audio_Link</span>
          </div>
          
          <div className="h-40 bg-glitch-magenta/10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-around opacity-20">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [20, 80, 40, 100, 20] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 bg-glitch-cyan"
                />
              ))}
            </div>
            <Zap size={48} className={active ? "text-glitch-cyan animate-bounce" : "text-glitch-magenta opacity-50"} />
          </div>

          <div className="text-xs space-y-1">
            <p className="text-glitch-cyan">STREAM: {STREAMS[streamIndex].label}</p>
            <p className="text-glitch-magenta">BITRATE: {STREAMS[streamIndex].bitrate}</p>
            <p className="opacity-50">STATUS: {active ? "STREAMING..." : "IDLE"}</p>
          </div>

          <audio ref={audioRef} src={STREAMS[streamIndex].source} onEnded={() => shiftStream(1)} />

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button onClick={() => shiftStream(-1)} className="pixel-button text-xs">PREV</button>
            <button onClick={toggleStream} className="pixel-button text-xs">
              {active ? <Pause size={14} className="mx-auto" /> : <Play size={14} className="mx-auto" />}
            </button>
            <button onClick={() => shiftStream(1)} className="pixel-button text-xs">NEXT</button>
          </div>
        </div>

        {/* LOGIC_CORE */}
        <div className="flex flex-col items-center">
          <div className="pixel-border p-1 bg-glitch-magenta/20 relative">
            <div 
              className="grid bg-void-black"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_DIM}, 1fr)`,
                width: 'min(85vw, 500px)',
                height: 'min(85vw, 500px)'
              }}
            >
              {Array.from({ length: GRID_DIM * GRID_DIM }).map((_, i) => {
                const x = i % GRID_DIM;
                const y = Math.floor(i / GRID_DIM);
                const isSnake = segments.some(s => s.x === x && s.y === y);
                const isHead = segments[0].x === x && segments[0].y === y;
                const isTarget = target.x === x && target.y === y;

                return (
                  <div 
                    key={i} 
                    className={`border-[0.5px] border-white/5 ${
                      isHead ? 'bg-glitch-cyan shadow-[0_0_15px_#00ffff]' :
                      isSnake ? 'bg-glitch-cyan/40' :
                      isTarget ? 'bg-glitch-magenta animate-pulse shadow-[0_0_15px_#ff00ff]' :
                      ''
                    }`}
                  />
                );
              })}
            </div>

            <AnimatePresence>
              {criticalFailure && (
                <motion.div 
                  initial={{ opacity: 0, scale: 1.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-glitch-magenta/90 flex flex-col items-center justify-center p-8 text-void-black"
                >
                  <AlertTriangle size={64} className="mb-4 animate-ping" />
                  <h2 className="text-4xl font-bold mb-2">CRITICAL_FAILURE</h2>
                  <p className="text-xl mb-8">DATA_LOST: {dataHarvested}MB</p>
                  <button onClick={initializeSystem} className="pixel-button !bg-void-black !text-glitch-magenta !shadow-none hover:scale-110">
                    REBOOT_SYSTEM
                  </button>
                </motion.div>
              )}

              {suspended && !criticalFailure && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-void-black/60 backdrop-blur-sm flex flex-col items-center justify-center"
                >
                  <button onClick={() => setSuspended(false)} className="pixel-button">
                    RESUME_PROCESS
                  </button>
                  <p className="mt-4 text-[10px] tracking-widest opacity-50">INPUT_REQUIRED: [ENTER]</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DATA_MONITOR */}
        <div className="flex flex-col gap-4">
          <div className="pixel-border p-4 bg-void-black/80 flex-1">
            <div className="flex items-center gap-2 border-b border-glitch-magenta pb-2 mb-4">
              <Activity size={16} className="text-glitch-cyan" />
              <span className="text-sm uppercase">Data_Monitor</span>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-[10px] text-glitch-cyan/60 uppercase mb-1">Harvested_Data</p>
                <p className="text-5xl font-bold text-glitch-magenta">{dataHarvested}<span className="text-xs ml-1">MB</span></p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-glitch-cyan/60 uppercase">System_Log</p>
                <div className="bg-glitch-cyan/5 p-2 text-[9px] h-32 overflow-hidden font-mono leading-tight">
                  <p className="text-glitch-cyan">[OK] CORE_INITIALIZED</p>
                  <p className="text-glitch-cyan">[OK] AUDIO_LINK_ESTABLISHED</p>
                  <p className={dataHarvested > 0 ? "text-glitch-cyan" : "hidden"}>[DATA] HARVESTING_BLOCK_0x{dataHarvested.toString(16)}</p>
                  <p className={criticalFailure ? "text-glitch-magenta animate-pulse" : "hidden"}>[ERR] SEGMENTATION_FAULT</p>
                  <p className="animate-pulse">_</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pixel-border p-2 bg-glitch-cyan/10 text-[8px] leading-none">
            <p className="mb-1">ENCRYPTION: AES-256-GCM</p>
            <p>LOCATION: [REDACTED]</p>
          </div>
        </div>
      </div>

      {/* SYSTEM_FOOTER */}
      <div className="mt-12 text-[10px] opacity-30 flex gap-8">
        <span>GHOST_IN_THE_SHELL_v0.9</span>
        <span>(C) 199X NEURAL_NETWORKS</span>
        <span>REMAIN_CALM</span>
      </div>
    </div>
  );
}
