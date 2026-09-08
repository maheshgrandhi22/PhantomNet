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
          {['Overview', 'Sessions', 'Network Flows', 'Honey/SSH', 'SQLi Guard', 'AI Status'].map((item, index) => (
            <a href="#_top" key={item} style={{ 
              padding: '0.6rem 0.75rem', 
              borderRadius: '6px', 
              background: index === 0 ? `${COL_PLASMA_BLUE}1a` : 'transparent',
              color: index === 0 ? COL_PLASMA_BLUE : '#9ca3af', 
              textDecoration: 'none',
              fontWeight: index === 0 ? 'bold' : 'normal'
            }}>
              {item}
            </a>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: '#4b5563' }}>
          PHANTOMNET / WEEK 03
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
        
        <div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Security / Overview</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>Overview</h1>
        </div>

        {/* 4 Top Metric Cards */}
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

        {/* Middle Section: Timeline & AI Status */}
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

        {/* Bottom Section: Network Flows Table & Event Inspector */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
          
          <div style={cardStyle}>
            <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.2rem' }}>NETWORK FLOWS</div>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>eBPF Flow Telemetry</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', fontSize: '0.7rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
              <span>SOURCE</span>
              <span>DESTINATION</span>
              <span>SERVICE</span>
              <span>DECISION</span>
              <span>SEVERITY</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {telemetry.flows.map((flow, idx) => (
                <div key={idx} onClick={() => setSelectedEvent(flow)} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', fontSize: '0.7rem', padding: '0.4rem 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: '#9ca3af' }}>{flow.source}</span>
                  <span style={{ color: '#9ca3af' }}>{flow.dest}</span>
                  <span style={{ color: '#fff' }}>{flow.service}</span>
                  <span style={{ color: flow.decision === 'BLOCKED' ? '#ef4444' : '#34d399' }}>{flow.decision}</span>
                  <span style={{ color: '#f59e0b' }}>{flow.severity}</span>
                </div>
              ))}
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

      </main>
    </div>
  );
}
