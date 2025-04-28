import React, { useState, useEffect, useCallback } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './PublicMedicineVerification.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const PublicMedicineVerification = () => {
  const [scanning, setScanning] = useState(false);
  const [qrContent, setQrContent] = useState('');
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);
  const [userLocation, setUserLocation] = useState('Unknown');
  const [darkMode, setDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const claimMedicine = useCallback(
    async (qrCode) => {
      setLoading(true);
      setError(null);
      setClaimStatus(null);
      try {
        const response = await axios.post(`${API_URL}/public/claim`, {
          qrCode,
          location: userLocation,
          timestamp: new Date().toISOString(),
        });
        setClaimStatus('success');
        setMedicine(response.data.medicine);
        setError(null);
      } catch (err) {
        setClaimStatus('error');
        const errorMessage = err.response?.data?.error || 'Failed to claim medicine. Please try again.';
        if (errorMessage.includes('already been claimed')) {
          setClaimStatus('already_claimed');
          setError('This medicine has already been claimed.');
        } else if (errorMessage.includes('not found')) {
          setError('Medicine not found for the provided QR code.');
        } else if (errorMessage.includes('cannot be claimed')) {
          setError('Medicine cannot be claimed at this time.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );

  const verifyMedicine = useCallback(
    async (content) => {
      setLoading(true);
      setError(null);
      setClaimStatus(null);
      setMedicine(null);

      try {
        const response = await axios.get(`${API_URL}/public/verify/${encodeURIComponent(content)}`, {
          headers: {
            'X-User-Location': userLocation,
          },
        });
        setMedicine(response.data);
        setVerified(true);

        if (response.data.status === 'Order Complete') {
          await claimMedicine(content);
        } else if (response.data.status === 'Claimed') {
          setClaimStatus('already_claimed');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to verify medicine. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [userLocation, claimMedicine]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrFromUrl = params.get('qr');

    if (qrFromUrl) {
      setQrContent(qrFromUrl);
      verifyMedicine(qrFromUrl);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(`${position.coords.latitude},${position.coords.longitude}`);
        },
        () => {
          setUserLocation('Location permission denied');
        }
      );
    }
  }, [verifyMedicine]);

  const handleScan = (result) => {
    if (result) {
      setScanning(false);
      setQrContent(result.text);
      verifyMedicine(result.text);
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    setError('Failed to scan QR code. Please try manual entry.');
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (qrContent.trim() && qrContent.startsWith('QR-')) {
      verifyMedicine(qrContent);
    } else {
      setError('Please enter a valid QR code starting with "QR-"');
    }
  };

  const resetVerification = () => {
    setVerified(false);
    setMedicine(null);
    setClaimStatus(null);
    setError(null);
    setQrContent('');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header />
      
      <main className="verification-main">
        <div className="verification-container">
          <div className="theme-toggle">
            <button onClick={toggleDarkMode} className="theme-toggle-btn">
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>

          <div className="verification-header">
            <h1>Medicine Verification Portal</h1>
            <p>Verify and claim your medicine by scanning the QR code or entering it manually</p>
          </div>

          {!verified && (
            <div className="verification-methods">
              <div className="method-card manual-entry">
                <h2>
                  <span className="method-icon">📝</span>
                  Manual Verification
                </h2>
                <form onSubmit={handleManualSubmit}>
                  <div className="form-group">
                    <label htmlFor="qrInput">QR Code Text</label>
                    <textarea
                      id="qrInput"
                      value={qrContent}
                      onChange={(e) => setQrContent(e.target.value)}
                      placeholder="Enter QR code (e.g., QR-PCL-2025-001)"
                      rows={4}
                      disabled={loading}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn verify-btn" 
                    disabled={loading || !qrContent.trim()}
                  >
                    {loading ? 'Verifying...' : 'Verify Medicine'}
                  </button>
                </form>
              </div>

              <div className="divider">
                <span>OR</span>
              </div>

              <div className="method-card scan-section">
                <h2>
                  <span className="method-icon">📱</span>
                  Scan QR Code
                </h2>
                {scanning ? (
                  <div className="scanner-container">
                    <QrReader
                      constraints={{ facingMode: 'environment' }}
                      onResult={handleScan}
                      onError={handleError}
                      scanDelay={300}
                      className="qr-reader"
                    />
                    <button onClick={() => setScanning(false)} className="btn cancel-btn">
                      Cancel Scan
                    </button>
                  </div>
                ) : (
                  <div className="scan-placeholder">
                    <div className="qr-placeholder"></div>
                    <button onClick={() => setScanning(true)} className="btn scan-btn" disabled={loading}>
                      Start Scanner
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="message error-message">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="message-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Processing your request...</p>
            </div>
          )}

          {verified && medicine && (
            <div className="medicine-details">
              <div
                className={`verification-result ${
                  medicine.flagged
                    ? 'warning'
                    : medicine.status === 'Claimed' && claimStatus !== 'success'
                    ? 'warning'
                    : new Date(medicine.expirationDate) > new Date()
                    ? 'safe'
                    : 'warning'
                }`}
              >
                {medicine.flagged ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="result-icon warning-icon">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    WARNING: Product flagged for issues
                  </>
                ) : medicine.status === 'Claimed' && claimStatus === 'success' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="result-icon success-icon">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    CLAIMED: Product registered to you
                  </>
                ) : medicine.status === 'Claimed' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="result-icon warning-icon">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    WARNING: Medicine already claimed
                  </>
                ) : new Date(medicine.expirationDate) < new Date() ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="result-icon warning-icon">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    WARNING: Product expired
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="result-icon success-icon">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    VERIFIED: Product is genuine
                  </>
                )}
              </div>

              <h2>{medicine.name}</h2>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Manufacturer</label>
                  <span>{medicine.manufacturer}</span>
                </div>
                <div className="detail-item">
                  <label>Batch Number</label>
                  <span>{medicine.batchNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Manufacturing Date</label>
                  <span>{new Date(medicine.manufacturingDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Expiration Date</label>
                  <span className={new Date(medicine.expirationDate) < new Date() ? 'expired-date' : ''}>
                    {new Date(medicine.expirationDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Current Status</label>
                  <span className="status-badge">{medicine.status}</span>
                </div>
                <div className="detail-item">
                  <label>Last Updated</label>
                  <span>
                    {medicine.supplyChain &&
                    Array.isArray(medicine.supplyChain) &&
                    medicine.supplyChain.length > 0
                      ? new Date(
                          medicine.supplyChain[medicine.supplyChain.length - 1].timestamp
                        ).toLocaleString()
                      : 'No updates available'}
                  </span>
                </div>
              </div>

              {claimStatus === 'success' && (
                <div className="info-box success-box">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div className="info-content">
                    <h3>Medicine Successfully Claimed</h3>
                    <p>
                      This medicine has been registered at{' '}
                      {new Date(medicine.claimTimestamp).toLocaleString()}.
                    </p>
                    <p>You can now use this product with confidence.</p>
                  </div>
                </div>
              )}

              {claimStatus === 'already_claimed' && medicine && medicine.supplyChain && (
                <div className="info-box warning-box">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <div className="info-content">
                    <h3>Medicine Already Claimed</h3>
                    <p>
                      This medicine was claimed on{' '}
                      {medicine.supplyChain.find((entry) => entry.status === 'Claimed')?.timestamp
                        ? new Date(
                            medicine.supplyChain.find((entry) => entry.status === 'Claimed').timestamp
                          ).toLocaleString()
                        : 'an earlier date'}.
                    </p>
                    <p>If you believe this is an error, please contact the HSE immediately.</p>
                  </div>
                </div>
              )}

              {medicine.flagged && (
                <div className="info-box warning-box">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <div className="info-content">
                    <h3>Safety Warning</h3>
                    <p>This medicine has been flagged for the following reason:</p>
                    <p className="flag-reason">"{medicine.flagNotes}"</p>
                    <p>Please consult with a healthcare professional before use.</p>
                  </div>
                </div>
              )}

              {medicine.status !== 'Order Complete' &&
                medicine.status !== 'Claimed' &&
                !medicine.flagged &&
                new Date(medicine.expirationDate) > new Date() && (
                  <div className="info-box info-box-neutral">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div className="info-content">
                      <h3>Not Ready for Claiming</h3>
                      <p>
                        This medicine is not yet marked as "Order Complete" and cannot be
                        claimed.
                      </p>
                    </div>
                  </div>
                )}

              <div className="verification-actions">
                <button onClick={resetVerification} className="btn secondary-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <polyline points="23 20 23 14 17 14"></polyline>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                  </svg>
                  Verify Another Medicine
                </button>
                {medicine.status === 'Order Complete' &&
                  claimStatus !== 'success' &&
                  claimStatus !== 'already_claimed' &&
                  !medicine.flagged &&
                  new Date(medicine.expirationDate) > new Date() && (
                    <button
                      onClick={() => claimMedicine(medicine.qrCode)}
                      className="btn primary-btn"
                      disabled={loading}
                    >
                      {loading ? 'Claiming...' : 'Claim This Medicine'}
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PublicMedicineVerification;