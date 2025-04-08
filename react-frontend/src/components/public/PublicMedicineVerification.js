import React, { useState } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';
import './PublicMedicineVerification.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const PublicMedicineVerification = () => {
  const [scanning, setScanning] = useState(false);
  const [qrContent, setQrContent] = useState('');
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  React.useEffect(() => {
    // Check if there's a QR code in the URL (for direct links)
    const params = new URLSearchParams(window.location.search);
    const qrFromUrl = params.get('qr');
    
    if (qrFromUrl) {
      setQrContent(qrFromUrl);
      verifyMedicine(qrFromUrl);
    }
  }, []);

  const handleScan = (result) => {
    if (result) {
      setScanning(false);
      setQrContent(result.text);
      verifyMedicine(result.text);
    }
  };

  const verifyMedicine = async (content) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use GET request like in the working example
      const response = await axios.get(`${API_URL}/public/verify/${encodeURIComponent(content)}`, {
        headers: {
          'X-User-Location': navigator.geolocation ? 'Browser' : 'Unknown'
        }
      });
      
      console.log('Verification response:', response.data);
      
      if (response.data) {
        setMedicine(response.data);
        setVerified(true);
      } else {
        setError('Invalid QR code. Medicine could not be verified.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.error || 'Failed to verify medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (qrContent) {
      verifyMedicine(qrContent);
    } else {
      setError('Please enter a QR code content');
    }
  };

  return (
    <div className="public-verification-container">
      <div className="verification-header">
        <h1>FarmaTech Public Medicine Verification</h1>
        <p>Verify the authenticity of your medicine by scanning the QR code or entering it manually</p>
      </div>
      
      {!verified && (
        <div className="verification-methods">
          <div className="manual-entry">
            <h2>Manual Verification</h2>
            <form onSubmit={handleManualSubmit}>
              <textarea
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
                placeholder="Paste QR code content here..."
                rows={6}
              />
              <button 
                type="submit" 
                className="verify-btn"
                disabled={loading || !qrContent}
              >
                {loading ? 'Verifying...' : 'Verify Medicine'}
              </button>
            </form>
          </div>
          
          <div className="divider">OR</div>
          
          <div className="scan-section">
            <h2>Scan QR Code</h2>
            {scanning ? (
              <div className="scanner-container">
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={handleScan}
                  scanDelay={300}
                  videoStyle={{ width: '100%' }}
                />
                <button 
                  onClick={() => setScanning(false)}
                  className="cancel-btn"
                >
                  Cancel Scan
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setScanning(true)}
                className="scan-btn"
                disabled={loading}
              >
                Start Scanner
              </button>
            )}
          </div>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {verified && medicine && (
        <div className="medicine-details">
          <div className="verification-result">
            <div className={`status-indicator ${!medicine.flagged && new Date(medicine.expirationDate) > new Date() ? 'safe' : 'warning'}`}>
              {medicine.flagged
                ? "WARNING: Product flagged for issues"
                : new Date(medicine.expirationDate) < new Date()
                ? "WARNING: Product expired"
                : "SAFE: Product verified"}
            </div>
          </div>
          
          <h2>{medicine.name}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Manufacturer:</label>
              <span>{medicine.manufacturer}</span>
            </div>
            <div className="detail-item">
              <label>Batch Number:</label>
              <span>{medicine.batchNumber}</span>
            </div>
            <div className="detail-item">
              <label>Manufacturing Date:</label>
              <span>{new Date(medicine.manufacturingDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <label>Expiration Date:</label>
              <span>{new Date(medicine.expirationDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span>{medicine.status}</span>
            </div>
            <div className="detail-item">
              <label>Verification Time:</label>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
          
          {medicine.flagged && (
            <div className="warning-box">
              <h3>Warning: This medicine has been flagged</h3>
              <p>This medicine has been reported with potential issues. Please consult with a healthcare professional before use.</p>
            </div>
          )}
          
          <div className="verification-actions">
            <button onClick={() => setVerified(false)} className="verify-another-btn">
              Verify Another Medicine
            </button>
          </div>
        </div>
      )}
      
      <div className="footer">
        <p>© {new Date().getFullYear()} FarmaTech Blockchain - Secure Medicine Verification</p>
        <p>For more information, please contact your healthcare provider or visit our website.</p>
      </div>
    </div>
  );
};

export default PublicMedicineVerification;