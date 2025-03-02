import React from 'react';
import HealthCheck from './components/HealthCheck';
import LedgerInit from './components/LedgerInit';
import AssetsList from './components/AssetsList';
import AssetForm from './components/AssetForm';
import './App.css';

const App = () => {
  return (
    <div className="App">
      <h1>FarmaTech Blockchain Tester</h1>
      <HealthCheck />
      <LedgerInit />
      <AssetsList />
      <AssetForm />
    </div>
  );
};

export default App;