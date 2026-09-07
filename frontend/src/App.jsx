import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Shield, Activity, Terminal, Database, Cpu, AlertTriangle } from 'lucide-react';

const socket = io('http://localhost:5050');

export default function App() {
  const [events, setEvents] = useState([]);
  const [threatScore, setThreatScore] = useState(0);
  const [activeSession] = useState('hacker_session_001');
  const [modelStatus] = useState({
    lore_model: { name: 'qwen2.5:1.5b', status: 'READY', confidence: 0.98 },
    sql_model: { name: 'mock_pg_v1', status: 'ACTIVE', confidence: 0.95 },
    threat_model: { name: 'heuristic_v2', status: 'EVALUATING', confidence: 0.99 }
  });

  useEffect(() => {
    socket.on('telemetry_event', (data) => {
      setEvents((prev) => [data, ...prev.slice(0, 49)]);
      if (data.threat_score) setThreatScore(data.threat_score);
    });

    return () => socket.off('telemetry_event');
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-100 font-mono p-6">
      {/* Header */}
      <header className="flex justify-between items-center pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-wider text-emerald-400">PHANTOMNET // SOC V2.0</h1>
            <p className="text-xs text-slate-400">Generative Cyber-Deception Operations Center</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl border border-slate-800 px-3 py-2 rounded">
            STATUS: <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl border border-slate-800 px-3 py-2 rounded">
            SESSION: <span className="text-cyan-400 font-bold">{activeSession}</span>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        
        {/* Metric Cards */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          <div className="bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl border border-slate-800 p-4 rounded-lg">
            <div className="text-slate-400 text-xs flex justify-between">RISK SCORE <AlertTriangle className="w-4 h-4 text-amber-400" /></div>
            <div className="text-2xl font-bold mt-2 text-amber-400">{threatScore} / 100</div>
          </div>
          <div className="bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl border border-slate-800 p-4 rounded-lg">
            <div className="text-slate-400 text-xs flex justify-between">CAPTURED EVENTS <Activity className="w-4 h-4 text-cyan-400" /></div>
            <div className="text-2xl font-bold mt-2 text-cyan-400">{events.length}</div>
          </div>
          <div className="bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl border border-slate-800 p-4 rounded-lg">
            <div className="text-slate-400 text-xs flex justify-between">SQL INTERCEPTIONS <Database className="w-4 h-4 text-purple-400" /></div>
            <div className="text-2xl font-bold mt-2 text-purple-400">
              {events.filter(e => e.event_type === 'SQL_QUERY').length}
            </div>
          </div>
          <div className="bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl border border-slate-800 p-4 rounded-lg">
            <div className="text-slate-400 text-xs flex justify-between">TARPIT DELAY <Cpu className="w-4 h-4 text-rose-400" /></div>
            <div className="text-2xl font-bold mt-2 text-rose-400">
              {events[0]?.tarpit_delay ? `${events[0].tarpit_delay}s` : '0.0s'}
            </div>
          </div>
        </div>

        {/* Live Stream */}
        <div className="col-span-8 bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" /> LIVE TELEMETRY STREAM
          </h2>
          <div className="h-96 overflow-y-auto space-y-2 pr-2">
            {events.length === 0 ? (
              <div className="text-slate-600 text-xs text-center pt-32">Awaiting network & syscall events...</div>
            ) : (
              events.map((ev, i) => (
                <div key={i} className="bg-black border border-slate-800/60 p-3 rounded text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-500">[{ev.timestamp}]</span>{' '}
                    <span className="text-emerald-400 font-semibold">{ev.event_type}</span>{' '}
                    <span className="text-slate-300">{ev.path}</span>
                  </div>
                  <span className="bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl text-slate-400 px-2 py-1 rounded text-[10px] border border-slate-800">
                    {ev.session_id}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Engine Status */}
        <div className="col-span-4 bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> GENAI ENGINES STATUS
          </h2>
          <div className="space-y-4 text-xs">
            {Object.entries(modelStatus).map(([key, m]) => (
              <div key={key} className="bg-black border border-slate-800 p-3 rounded">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>{key}</span>
                  <span className="text-emerald-400 text-[10px]">{m.status}</span>
                </div>
                <div className="text-slate-500 text-[10px] mt-1">Engine: {m.name}</div>
                <div className="w-full bg-black/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]/60 backdrop-blur-xl border-white/10 shadow-2xl h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${m.confidence * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
