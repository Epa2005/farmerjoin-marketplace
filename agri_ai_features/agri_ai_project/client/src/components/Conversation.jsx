import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Conversation() {
    const [sessionId, setSessionId] = useState(localStorage.getItem('agri_session') || null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionId) fetchHistory(sessionId);
    }, [sessionId]);

    async function fetchHistory(sid) {
        try {
            const res = await axios.get(`http://localhost:3001/api/conversation/${sid}`);
            if (res.data && res.data.history) setMessages(res.data.history);
        } catch (e) {
            console.warn('Failed to load history', e.message || e);
        }
    }

    async function send() {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:3001/api/conversation', { sessionId, message: input, language });
            const sid = res.data.sessionId;
            setSessionId(sid);
            localStorage.setItem('agri_session', sid);
            if (res.data.history) setMessages(res.data.history);
            setInput('');
        } catch (e) {
            console.error('Conversation send error', e.message || e);
            alert('Failed to send message');
        } finally { setLoading(false); }
    }

    return (
        <div style={{ maxWidth: 780, margin: '20px auto', padding: 12 }}>
            <h2>Conversation</h2>
            <div style={{ marginBottom: 8 }}>
                <label>Language: </label>
                <select value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="rw">Kinyarwanda</option>
                </select>
            </div>

            <div style={{ border: '1px solid #ddd', padding: 12, minHeight: 180, maxHeight: 360, overflow: 'auto' }}>
                {messages.length === 0 && <div className="muted">No messages yet.</div>}
                {messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{m.role}</div>
                        {m.role === 'assistant' && m.structured ? (
                            <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e6f0ea' }}>
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>{m.structured.summary || m.text}</div>
                                {m.structured.recommendations && m.structured.recommendations.length > 0 && (
                                    <div style={{ marginBottom: 8 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>Recommendations</div>
                                        <ul style={{ margin: '6px 0 0 18px' }}>
                                            {m.structured.recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {m.structured.steps && m.structured.steps.length > 0 && (
                                    <div style={{ marginBottom: 8 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>Steps</div>
                                        <ol style={{ margin: '6px 0 0 18px' }}>
                                            {m.structured.steps.map((s, idx) => <li key={idx}>{s}</li>)}
                                        </ol>
                                    </div>
                                )}
                                {m.structured.details && (
                                    <div style={{ marginTop: 8, color: '#333' }}>{m.structured.details}</div>
                                )}
                                {m.structured.sources && m.structured.sources.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 12, color: '#666' }}>Sources:</div>
                                        <ul style={{ margin: '4px 0 0 18px' }}>
                                            {m.structured.sources.map((s, idx) => (
                                                <li key={idx}><a href={s.link} target="_blank" rel="noreferrer">{s.title || s.link}</a></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ background: m.role === 'user' ? '#eef' : '#efe', padding: 8, borderRadius: 6 }}>{m.text}</div>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 10 }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} style={{ width: '100%', padding: 8 }} />
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={send} disabled={loading} style={{ padding: '8px 14px' }}>{loading ? 'Sending...' : 'Send'}</button>
                    <button onClick={() => { setInput(''); localStorage.removeItem('agri_session'); setSessionId(null); setMessages([]); }}>New Session</button>
                </div>
            </div>
        </div>
    );
}
