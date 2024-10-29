import React from 'react';
import { useState, useEffect} from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/test')
    .then(response => response.json())
    .then(data => setMessage(data.message))
    .catch(error => console.error('Error:', error))
  }, []);

  return (
    <div className='App'>
      <h1>React + Node.js connection test</h1>
      <p>Message from backend: {message}</p>
    </div>
  )
}

export default App
