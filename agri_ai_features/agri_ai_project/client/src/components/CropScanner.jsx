import React, { useState } from 'react';
import axios from 'axios';

function CropScanner() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [language, setLanguage] = useState('en');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result); // Base64 encoded image
            };
            reader.readAsDataURL(file);
        }
    };

    const handleScanSubmit = async () => {
        if (!selectedImage) {
            alert('Please select an image first.');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await axios.post('http://localhost:3001/api/crop-scan', { image: selectedImage, language });
            setResponse(res.data);
        } catch (err) {
            console.error('Error during crop scan:', err);
            setError('Failed to perform crop scan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', marginTop: '40px' }}>
            <h1>Crop Scanner</h1>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {selectedImage && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Selected Image:</h3>
                    <img src={selectedImage} alt="Selected Crop" style={{ maxWidth: '100%', height: 'auto' }} />
                </div>
            )}
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ margin: '10px 0', padding: '5px' }}
            >
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
            </select>
            <button onClick={handleScanSubmit} disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer', display: 'block', marginTop: '10px' }}>
                {loading ? 'Scanning...' : 'Scan Crop'}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {response && (
                <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
                    <h2>Scan Result:</h2>
                    <p><strong>Query:</strong> {response.query}</p>
                    <p><strong>Language:</strong> {response.language === 'en' ? 'English' : 'Kinyarwanda'}</p>
                    <p><strong>Intent:</strong> {response.intent}</p>
                    <p><strong>Answer:</strong> {response.answer}</p>
                    {response.note && <p><strong>Note:</strong> {response.note}</p>}
                </div>
            )}
        </div>
    );
}

export default CropScanner;
