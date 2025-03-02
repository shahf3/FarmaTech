import React, { useState } from 'react';
import { initLedger } from '../utils/api';

const LedgerInit = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initLedgerAction = async () => {
    try {
      const response = await initLedger();
      setMessage(response.data.message);
      setError('');
    } catch (error) {
      setError('Error initializing ledger: ' + error.message);
      setMessage('');
    }
  };

  return (
    <div className="section">
      <h2>Initialize Ledger</h2>
      <p>This will reset the ledger with sample assets.</p>
      <button onClick={initLedgerAction}>Initialize Ledger</button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default LedgerInit;