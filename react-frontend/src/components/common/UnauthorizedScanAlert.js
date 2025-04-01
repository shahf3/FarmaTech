import React from 'react';
import '../../styles/UnauthorizedScanAlert.css';

const UnauthorizedScanAlert = ({ scanDetails }) => {
  if (!scanDetails) return null;

  return (
    <div className="unauthorized-scan-alert">
      <div className="alert-header">
        <span className="alert-icon">⚠️</span>
        <h3>SECURITY ALERT: Unauthorized Access Detected</h3>
      </div>
      
      <div className="alert-content">
        <p>This medicine has been automatically flagged in the system due to unauthorized access.</p>
        
        <div className="scan-details">
          <h4>Unauthorized Scan Details:</h4>
          <table>
            <tbody>
              <tr>
                <td><strong>User:</strong></td>
                <td>{scanDetails.scannerUsername}</td>
              </tr>
              <tr>
                <td><strong>Organization:</strong></td>
                <td>{scanDetails.scannerOrganization}</td>
              </tr>
              <tr>
                <td><strong>Role:</strong></td>
                <td>{scanDetails.scannerRole}</td>
              </tr>
              <tr>
                <td><strong>Location:</strong></td>
                <td>{scanDetails.location || 'Unknown'}</td>
              </tr>
              <tr>
                <td><strong>Time:</strong></td>
                <td>{new Date(scanDetails.timestamp).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="alert-warning">
          <p><strong>Warning:</strong> The integrity of this medicine may have been compromised. 
          Please contact the manufacturer or a regulator for further investigation.</p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedScanAlert;