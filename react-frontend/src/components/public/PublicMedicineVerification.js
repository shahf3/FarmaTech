import React, { useState, useEffect, useCallback } from 'react';
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
  const [claimStatus, setClaimStatus] = useState(null);
  const [userLocation, setUserLocation] = useState('Unknown');

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
        setError(null); // Clear any previous errors
      } catch (err) {
        setClaimStatus('error');
        const errorMessage = err.response?.data?.error || 'Failed to claim medicine. Please try again.';
        if (errorMessage.includes('already been claimed')) {
          setClaimStatus('already_claimed');
          // Do not overwrite medicine state; retain from verifyMedicine
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

  return (
    <div className="public-verification-container">
      <div className="verification-header">
        <h1>Medicine Verification Portal</h1>
        <p>Verify and claim your medicine by scanning the QR code or entering it manually</p>
      </div>

      {!verified && (
        <div className="verification-methods">
          <div className="manual-entry">
            <h2>Manual Verification</h2>
            <form onSubmit={handleManualSubmit}>
              <textarea
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
                placeholder="Enter QR code (e.g., QR-PCL-2025-001)"
                rows={6}
                disabled={loading}
              />
              <button type="submit" className="verify-btn" disabled={loading || !qrContent.trim()}>
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
                  onError={handleError}
                  scanDelay={300}
                  style={{ width: '100%' }}
                />
                <button onClick={() => setScanning(false)} className="cancel-btn">
                  Cancel Scan
                </button>
              </div>
            ) : (
              <button onClick={() => setScanning(true)} className="scan-btn" disabled={loading}>
                Start Scanner
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Processing...</p>
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
            {medicine.flagged
              ? 'WARNING: Product flagged for issues'
              : medicine.status === 'Claimed' && claimStatus === 'success'
              ? 'CLAIMED: Product registered to you'
              : medicine.status === 'Claimed'
              ? 'WARNING: Medicine already claimed'
              : new Date(medicine.expirationDate) < new Date()
              ? 'WARNING: Product expired'
              : 'VERIFIED: Product is genuine'}
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
              <label>Current Status:</label>
              <span className="status-badge">{medicine.status}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
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
            <div className="success-box">
              <h3>
                <i className="fas fa-check-circle"></i> Medicine Successfully Claimed
              </h3>
              <p>
                This medicine has been registered at{' '}
                {new Date(medicine.claimTimestamp).toLocaleString()}.
              </p>
              <p>You can now use this product with confidence.</p>
            </div>
          )}

          {claimStatus === 'already_claimed' && medicine && medicine.supplyChain && (
            <div className="warning-box">
              <h3>
                <i className="fas fa-exclamation-triangle"></i> Medicine Already Claimed
              </h3>
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
          )}

          {medicine.flagged && (
            <div className="warning-box">
              <h3>
                <i className="fas fa-exclamation-triangle"></i> Safety Warning
              </h3>
              <p>This medicine has been flagged for the following reason:</p>
              <p className="flag-reason">"{medicine.flagNotes}"</p>
              <p>Please consult with a healthcare professional before use.</p>
            </div>
          )}

          {medicine.status !== 'Order Complete' &&
            medicine.status !== 'Claimed' &&
            !medicine.flagged &&
            new Date(medicine.expirationDate) > new Date() && (
              <div className="warning-box">
                <h3>
                  <i className="fas fa-exclamation-triangle"></i> Not Ready for Claiming
                </h3>
                <p>
                  This medicine is not yet marked as "Order Complete" and cannot be
                  claimed.
                </p>
              </div>
            )}

          <div className="verification-actions">
            <button onClick={resetVerification} className="verify-another-btn">
              <i className="fas fa-redo"></i> Verify Another Medicine
            </button>
            {medicine.status === 'Order Complete' &&
              claimStatus !== 'success' &&
              claimStatus !== 'already_claimed' &&
              !medicine.flagged &&
              new Date(medicine.expirationDate) > new Date() && (
                <button
                  onClick={() => claimMedicine(medicine.qrCode)}
                  className="claim-btn"
                  disabled={loading}
                >
                  {loading ? 'Claiming...' : 'Claim This Medicine'}
                </button>
              )}
          </div>
        </div>
      )}

      <div className="footer">
        <p>© {new Date().getFullYear()} Pharmaceutical Verification System</p>
        <p>For assistance, please contact the Health Service Executive (HSE)</p>
      </div>
    </div>
  );
};

export default PublicMedicineVerification;