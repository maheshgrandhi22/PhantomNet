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

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const socket = io('http://localhost:5050');
    socket.on('telemetry_update', (data) => {
      setTelemetry(prev => ({ ...prev, ...data }));
    });
    return () => socket.disconnect();
  }, []);

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

        {/* 1. OVERVIEW TAB */}
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
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${COL_PLASMA_BLUE}1a` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <span>sql_model</span><span style={{ color: '#34d399' }}>READY</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.2rem' }}>Database Generation</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${COL_PLASMA_BLUE}1a` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <span>lore_model</span><span style={{ color: '#34d399' }}>READY</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.2rem' }}>Corporate Environment</div>
                </div>
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

        {/* 2. SESSIONS TAB */}
        {activeTab === 'Sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem' }}>TOTAL ACTIVE SESSIONS</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>{telemetry.active_sessions}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem' }}>INTERCEPTED SESSIONS</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#f59e0b' }}>{telemetry.high_severity}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem' }}>TARPIT DELAY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: COL_PLASMA_BLUE }}>{telemetry.tarpit_delay}</div>
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.8rem' }}>ACTIVE CONNECTION TABLE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: '0.7rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
                <span>CLIENT IP</span>
                <span>TARGET SERVICE</span>
                <span>STATE</span>
                <span>DURATION</span>
              </div>
              {telemetry.flows.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: '0.7rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: '#9ca3af' }}>{f.source}</span>
                  <span style={{ color: '#fff' }}>{f.dest}</span>
                  <span style={{ color: f.decision === 'TARPIT' ? '#f59e0b' : '#34d399' }}>{f.decision}</span>
                  <span style={{ color: '#6b7280' }}>04m {12 + i}s</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. NETWORK FLOWS TAB */}
        {activeTab === 'Network Flows' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.2rem' }}>eBPF PACKET TELEMETRY STREAM</div>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Complete real-time packet inspection log</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', fontSize: '0.7rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
              <span>SOURCE IP</span>
              <span>DESTINATION</span>
              <span>PROTOCOL</span>
              <span>ACTION</span>
              <span>RISK LEVEL</span>
            </div>
            {telemetry.flows.map((flow, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', fontSize: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#9ca3af' }}>{flow.source}</span>
                <span style={{ color: '#9ca3af' }}>{flow.dest}</span>
                <span style={{ color: '#fff' }}>{flow.service}</span>
                <span style={{ color: flow.decision === 'BLOCKED' ? '#ef4444' : '#34d399' }}>{flow.decision}</span>
                <span style={{ color: flow.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{flow.severity}</span>
              </div>
            ))}
          </div>
        )}

        {/* 4. HONEY/SSH TAB */}
        {activeTab === 'Honey/SSH' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>ATTACKER PAYLOAD CAPTURES</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Recent brute-force attempts</span>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <strong style={{ color: '#ef4444' }}>203.0.113.42</strong>: Brute-force auth attack detected
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <strong style={{ color: '#f59e0b' }}>192.168.1.105</strong>: Unauthorized shell probe
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SQLi GUARD TAB */}
        {activeTab === 'SQLi Guard' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SQL INJECTION DEFENDER</div>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Real-time query sanitizer and firewall</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}1a` }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.3rem' }}>TOTAL SQLi NEUTRALIZED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{telemetry.sql_interceptions}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}1a` }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.3rem' }}>FIREWALL STATUS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>ACTIVE</div>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', color: COL_PLASMA_BLUE, fontSize: '0.75rem', border: `1px solid ${COL_PLASMA_BLUE}22` }}>
              SQL Injection payload neutralized on /api/v1/search. (Param: ' OR 1=1 --)
            </div>
          </div>
        )}

        {/* 6. AI STATUS TAB */}
        {activeTab === 'AI Status' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>sql_model</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Database Generation Engine</span>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>Status: <span style={{ color: '#34d399', fontWeight: 'bold' }}>READY</span></div>
                <div>Inference Latency: 42ms</div>
                <div>Model Weight Checksum: 0x8F9C...</div>
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>lore_model</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Corporate Environment Simulator</span>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>Status: <span style={{ color: '#34d399', fontWeight: 'bold' }}>READY</span></div>
                <div>Inference Latency: 65ms</div>
                <div>Model Weight Checksum: 0x3A2B...</div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
