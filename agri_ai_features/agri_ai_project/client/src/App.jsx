import React from 'react';
import Conversation from './components/Conversation.jsx';
import CropScanner from './components/CropScanner.jsx';
import './App.css'; // Assuming you have some basic CSS

function App() {
    return (
        <div className="App">
            <Conversation />
            <hr style={{ margin: '60px 0', borderColor: '#eee' }} />
            <CropScanner />
        </div>
    );
}

export default App;