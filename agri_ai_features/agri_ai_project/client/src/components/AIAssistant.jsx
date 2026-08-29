import React, { useState } from 'react';
import axios from 'axios';

function AIAssistant() {
    const [query, setQuery] = useState('');
    const [language, setLanguage] = useState('en');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await axios.post('http://localhost:3001/api/ask-ai', { query, language });
            setResponse(res.data);
        } catch (err) {
            console.error('Error fetching AI response:', err);
            setError('Failed to get response from AI assistant. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1>Agricultural AI Assistant</h1>
            <form onSubmit={handleQuerySubmit}>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question about agriculture in Rwanda... (e.g., 'What are the symptoms of potato blight?' or 'Ikirere i Kigali?')"
                    rows="5"
                    style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
                />
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ marginBottom: '10px', padding: '5px' }}
                >
                    <option value="en">English</option>
                    <option value="rw">Kinyarwanda</option>
                </select>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    {loading ? 'Loading...' : 'Ask AI'}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {response && (
                <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
                    <h2>AI Response:</h2>
                    <p><strong>Query:</strong> {response.query}</p>
                    <p><strong>Language:</strong> {response.language === 'en' ? 'English' : 'Kinyarwanda'}</p>
                    <p><strong>Intent:</strong> {response.intent}</p>
                    <p><strong>Answer:</strong> {response.answer}</p>
                    {response.relatedTopics && response.relatedTopics.length > 0 && (
                        <p><strong>Related Topics:</strong> {response.relatedTopics.join(', ')}</p>
                    )}
                    {response.searchResults && response.searchResults.length > 0 && (
                        <div>
                            <p><strong>Web Search Results:</strong></p>
                            <ul>
                                {response.searchResults.map((result, index) => (
                                    <li key={index}><a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AIAssistant;
