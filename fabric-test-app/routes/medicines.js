const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { verifyToken, checkRole, checkOrganization } = require('../middleware/auth');
const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
const { isAuthorizedToScan, flagMedicineForUnauthorizedAccess, recordSecurityIncident } = require('../utils/securityUtils');

// Helper function to generate secure QR code
function generateSecureQRCode(medicine, secretKey) {
  const baseContent = {
    id: medicine.id,
    name: medicine.name,
    manufacturer: medicine.manufacturer,
    batchNumber: medicine.batchNumber,
    blockchainQR: medicine.qrCode,
    timestamp: Date.now(),
  };

  const contentString = JSON.stringify(baseContent);

  // Create HMAC signature
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(contentString)
    .digest("hex");

  return JSON.stringify({
    ...baseContent,
    signature: hmac,
  });
}

// Helper function to verify QR code
function verifyQRCode(qrContent, secretKey) {
  try {
    const data = JSON.parse(qrContent);

    const { signature, ...baseContent } = data;

    // Re-compute HMAC
    const contentString = JSON.stringify(baseContent);
    const expectedHmac = crypto
      .createHmac("sha256", secretKey)
      .update(contentString)
      .digest("hex");

    if (signature !== expectedHmac) {
      return { valid: false, reason: "Invalid signature" };
    }

    const now = Date.now();
    if (now - data.timestamp > 30 * 24 * 60 * 60 * 1000) {
      return { valid: false, reason: "QR code expired" };
    }

    return { valid: true, blockchainQR: data.blockchainQR };
  } catch (error) {
    return { valid: false, reason: "Invalid QR format" };
  }
}

// @route   GET api/medicines/verify/:qrCode
// @desc    Verify medicine by QR code and record scanning activity
// @access  Private
// Add this to your routes/medicines.js file
// GET endpoint for regular QR code verification

router.get('/verify/:qrCode', verifyToken, async (req, res) => {
  try {
    const { qrCode } = req.params;
    console.log(`Verifying medicine with QR code: ${qrCode} by ${req.user.username}`);
    
    // Validate QR code format
    if (!qrCode || !qrCode.startsWith('QR-')) {
      return res.status(400).json({ 
        error: 'Invalid QR code format. QR codes should start with "QR-"' 
      });
    }

    const location = req.headers['x-user-location'] || 'Unknown location';

    const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(__dirname, "../wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get("appUser");
    if (!identity) {
      return res.status(400).json({ 
        error: 'User "appUser" does not exist in the wallet' 
      });
    }

    const gateway = new Gateway();
    try {
      await gateway.connect(ccp, {
        wallet,
        identity: "appUser",
        discovery: { enabled: true, asLocalhost: true },
      });
  
      const network = await gateway.getNetwork("mychannel");
      const contract = network.getContract("medicine-contract");
      
      console.log(`Getting all medicines to find QR code: ${qrCode}`);
      const allMedicinesResult = await contract.evaluateTransaction("GetAllMedicines");
      const allMedicines = JSON.parse(allMedicinesResult.toString());
      
      const medicine = allMedicines.find(med => med.qrCode === qrCode);
      
      if (!medicine) {
        await gateway.disconnect();
        return res.status(404).json({ error: `Medicine with QR code ${qrCode} not found` });
      }
      
      console.log(`Found medicine: ${medicine.id} with QR code: ${qrCode}`);
      
      const result = await contract.evaluateTransaction("GetMedicine", medicine.id);
      let medicineData = JSON.parse(result.toString());
      
      const isAuthorized = isAuthorizedScan(req.user, medicineData);
      console.log(`Scan authorization: ${isAuthorized ? 'Authorized' : 'UNAUTHORIZED'}`);
      
      // For unauthorized scans, flag the medicine automatically
      if (!isAuthorized) {
        console.warn(`SECURITY ALERT: Unauthorized scan detected - User: ${req.user.username}, Role: ${req.user.role}, Org: ${req.user.organization}, Medicine: ${medicineData.id}`);
        
        try {
          const flagReason = `Unauthorized scan by ${req.user.role} (${req.user.username}) from ${req.user.organization}`;
          
          // Submit the transaction to flag the medicine
          const flagResult = await contract.submitTransaction(
            "FlagMedicine",
            medicineData.id,
            req.user.organization,
            flagReason,
            location
          );
          
          // Update medicine with flag information from blockchain
          medicineData = JSON.parse(flagResult.toString());
          
          medicineData.unauthorizedScanDetails = {
            scannerUsername: req.user.username,
            scannerRole: req.user.role,
            scannerOrganization: req.user.organization,
            location: location,
            timestamp: new Date().toISOString()
          };
          
          // Record the security incident
          try {
            const SecurityIncident = require('../models/SecurityIncident');
            const incident = new SecurityIncident({
              medicineId: medicineData.id,
              medicineName: medicineData.name,
              batchNumber: medicineData.batchNumber,
              incidentType: 'unauthorized_scan',
              severity: req.user.role === 'distributor' ? 'high' : 'medium',
              scanner: {
                userId: req.user.id,
                username: req.user.username,
                role: req.user.role,
                organization: req.user.organization
              },
              details: {
                location: location,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                notes: `Unauthorized scan detected and medicine flagged`
              },
              medicineStatus: {
                beforeIncident: 'Normal',
                afterIncident: 'Flagged'
              },
              flaggedInBlockchain: true,
              timestamp: new Date()
            });
            
            await incident.save();
          } catch (incidentError) {
            console.error('Error recording security incident:', incidentError);
          }
          
          console.log(`Medicine ${medicineData.id} auto-flagged due to unauthorized scan`);
        } catch (flagError) {
          console.error(`Error auto-flagging medicine:`, flagError);
        }
      } else {
        try {
          if (!medicineData.supplyChain.some(entry => 
              entry.handler === req.user.organization &&
              entry.status === 'Scanned' &&
              new Date(entry.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
          )) {
            try {
              await contract.submitTransaction(
                "RecordScan",
                medicineData.id,
                req.user.organization,
                req.user.role,
                req.user.username,
                location
              );
              
              const updatedResult = await contract.evaluateTransaction("GetMedicine", medicineData.id);
              medicineData = JSON.parse(updatedResult.toString());
              
              console.log(`Scan recorded for medicine ${medicineData.id} by ${req.user.username}`);
            } catch (error) {
              console.error("Error recording scan:", error);
            }
          }
        } catch (scanError) {
          console.error(`Error recording scan:`, scanError);
        }
      }

      await gateway.disconnect();

      let roleSpecificData = {};
      
      if (req.user.role === "manufacturer") {
        roleSpecificData = {
          canUpdateRecord: req.user.organization === medicineData.manufacturer,
          viewDetailedHistory: true,
          belongsToManufacturer: req.user.organization === medicineData.manufacturer
        };
      } else if (req.user.role === "distributor") {
        roleSpecificData = {
          canUpdateSupplyChain: req.user.organization === medicineData.currentOwner,
          updateEndpoint: `/api/medicines/${medicineData.id}/update`,
          canFlag: true,
          belongsToManufacturer: req.user.organization === medicineData.manufacturer
        };
      } else if (req.user.role === "regulator") {
        roleSpecificData = {
          canFlagIssues: true,
          fullSupplyChainAccess: true,
          canVerifyAuthenticity: true
        };
      } else if (req.user.role === "enduser") {
        // Check if medicine is expired
        const isExpired = new Date(medicineData.expirationDate) < new Date();
        
        roleSpecificData = {
          safetyStatus: medicineData.flagged
            ? "WARNING: Product flagged for issues"
            : isExpired
            ? "WARNING: Product expired"
            : "SAFE: Product verified",
          safeToUse: !medicineData.flagged && !isExpired
        };
      }

      // Include authorization status
      roleSpecificData.isAuthorizedScan = isAuthorized;
      roleSpecificData.isOwnerOrManufacturer = 
        req.user.organization === medicineData.currentOwner || 
        req.user.organization === medicineData.manufacturer;

      // Send the medicine data with role-specific actions
      res.json({
        ...medicineData,
        roleSpecificActions: roleSpecificData,
        scanRecorded: isAuthorized
      });
    } catch (gatewayError) {
      console.error('Gateway Connection Error:', gatewayError);
      try {
        await gateway.disconnect();
      } catch (e) {
      }
      
      res.status(500).json({ 
        error: 'Failed to process medicine verification', 
        details: gatewayError.message 
      });
    }
  } catch (error) {
    console.error(`Verification Error:`, error);
    console.error('Error Stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error during medicine verification', 
      details: error.message 
    });
  }
});

// Helper function to determine if a user is authorized to scan a medicine
function isAuthorizedScan(user, medicine) {
  // Regulators can scan any medicine
  if (user.role === 'regulator') {
    return true;
  }

  // Manufacturers can only scan their own medicines
  if (user.role === 'manufacturer') {
    return user.organization === medicine.manufacturer;
  }

  // Distributors can scan medicines they own or that are in transit to them
  if (user.role === 'distributor') {
    return user.organization === medicine.currentOwner || 
           (medicine.status === 'In Transit' && 
            medicine.supplyChain.some(entry => 
              entry.notes && entry.notes.includes(user.organization)));
  }

  // End users can only scan dispensed medicines
  if (user.role === 'enduser') {
    return medicine.status === 'Dispensed';
  }

  // By default, deny access
  return false;
}

// @route   GET api/medicines
// @desc    Get all medicines
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "../wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if we have the appUser identity
    const identity = await wallet.get("appUser");
    if (!identity) {
      return res
        .status(400)
        .json({ error: 'User "appUser" does not exist in the wallet' });
    }

    // Create a new gateway for connecting to the peer node
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork("mychannel");

    // Get the contract from the network
    const contract = network.getContract("medicine-contract");

    // Use different queries based on role
    let result;
    if (req.user.role === 'regulator') {
      // Regulators can see all medicines
      result = await contract.evaluateTransaction("GetAllMedicines");
    } else if (req.user.role === 'manufacturer') {
      // Manufacturers see only their medicines
      result = await contract.evaluateTransaction(
        "GetMedicinesByManufacturer",
        req.user.organization
      );
    } else if (req.user.role === 'distributor') {
      // Distributors see only medicines they own
      result = await contract.evaluateTransaction(
        "GetMedicinesByOwner",
        req.user.organization
      );
    } else {
      // End users can't access this endpoint
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Disconnect from the gateway
    await gateway.disconnect();

    // Parse the result
    const medicines = JSON.parse(result.toString());
    res.json(medicines);
  } catch (error) {
    console.error(`Failed to get medicines: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/medicines/owner/:owner
// @desc    Get medicines by owner
// @access  Private
router.get('/owner/:owner', verifyToken, async (req, res) => {
  try {
    const { owner } = req.params;

    // Check if user is authorized to view these medicines
    if (req.user.role !== 'regulator' && req.user.organization !== owner) {
      return res.status(403).json({ 
        error: 'You are not authorized to view medicines from other organizations' 
      });
    }

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "../wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if we have the appUser identity
    const identity = await wallet.get("appUser");
    if (!identity) {
      return res
        .status(400)
        .json({ error: 'User "appUser" does not exist in the wallet' });
    }

    // Create a new gateway for connecting to the peer node
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork("mychannel");

    // Get the contract from the network
    const contract = network.getContract("medicine-contract");

    // Submit the transaction to get medicines by owner
    const result = await contract.evaluateTransaction(
      "GetMedicinesByOwner",
      owner
    );

    // Disconnect from the gateway
    await gateway.disconnect();

    const medicines = JSON.parse(result.toString());
    res.json(medicines);
  } catch (error) {
    console.error(`Failed to get medicines by owner: ${error}`);
    res
      .status(500)
      .json({ error: `Failed to get medicines by owner: ${error.message}` });
  }
});

// @route   POST api/medicines/:id/update
// @desc    Update medicine supply chain
// @access  Private/Distributor or Manufacturer
router.post(
    '/:id/update',
    [
      verifyToken,
      checkRole(['distributor', 'manufacturer']),
      body('status', 'Status is required').not().isEmpty(),
      body('location', 'Location is required').not().isEmpty(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
  
        const { id } = req.params;
        const { status, location, notes } = req.body;
        const handler = req.user.organization;
        
        // Clean and standardize parameters to avoid non-determinism
        const cleanId = String(id).trim();
        const cleanHandler = String(handler).trim();
        const cleanStatus = String(status).trim();
        const cleanLocation = String(location).trim();
        const cleanNotes = notes ? String(notes).trim() : "";
        
        console.log('Update request parameters after cleaning:', {
          id: cleanId,
          handler: cleanHandler,
          status: cleanStatus,
          location: cleanLocation,
          notes: cleanNotes
        });
  
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
        const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
  
        const walletPath = path.join(__dirname, "../wallet");
        const wallet = await Wallets.newFileSystemWallet(walletPath);
  
        const identity = await wallet.get("appUser");
        if (!identity) {
          return res.status(400).json({ 
            error: 'User "appUser" does not exist in the wallet' 
          });
        }
  
        const gateway = new Gateway();
        await gateway.connect(ccp, {
          wallet,
          identity: "appUser",
          discovery: { enabled: true, asLocalhost: true },
        });
  
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("medicine-contract");
  
        // Submit the transaction with clean parameters
        const result = await contract.submitTransaction(
          "UpdateSupplyChain",
          cleanId,
          cleanHandler,
          cleanStatus,
          cleanLocation,
          cleanNotes
        );
  
        await gateway.disconnect();
  
        const updatedMedicine = JSON.parse(result.toString());
        
        res.json({
          success: true,
          message: `Medicine ${id} supply chain updated successfully`,
          medicine: updatedMedicine,
        });
      } catch (error) {
        console.error(`Update Medicine Error:`, error);
        
        try {
          await gateway.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        
        res.status(500).json({ 
          error: `Failed to update medicine: ${error.message}`,
          details: error.toString()
        });
      }
    }
  );

// @route   POST api/medicines/:id/flag
// @desc    Flag a medicine for issues
// @access  Private/Any role
router.post(
    '/:id/flag',
    [
      verifyToken,
      body('reason', 'Reason is required').not().isEmpty(),
      body('location', 'Location is required').not().isEmpty(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          console.log('Validation errors:', errors.array());
          return res.status(400).json({ errors: errors.array() });
        }
  
        const { id } = req.params;
        const { reason, location } = req.body;
        const flaggedBy = req.user.organization;
  
        // Clean and standardize parameters
        const cleanId = String(id).trim();
        const cleanFlaggedBy = String(flaggedBy).trim();
        const cleanReason = String(reason).trim();
        const cleanLocation = String(location).trim();
  
        console.log('Flag request parameters after cleaning:', {
          id: cleanId,
          flaggedBy: cleanFlaggedBy,
          reason: cleanReason,
          location: cleanLocation
        });
  
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
        const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
  
        const walletPath = path.join(__dirname, "../wallet");
        const wallet = await Wallets.newFileSystemWallet(walletPath);
  
        const identity = await wallet.get("appUser");
        if (!identity) {
          return res.status(400).json({ 
            error: 'User "appUser" does not exist in the wallet' 
          });
        }
  
        const gateway = new Gateway();
        try {
          await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discovery: { enabled: true, asLocalhost: true },
          });
  
          const network = await gateway.getNetwork("mychannel");
          const contract = network.getContract("medicine-contract");
  
          // Submit the transaction with clean parameters
          const result = await contract.submitTransaction(
            "FlagMedicine",
            cleanId,
            cleanFlaggedBy,
            cleanReason,
            cleanLocation
          );
  
          await gateway.disconnect();
  
          const flaggedMedicine = JSON.parse(result.toString());
          
          res.json({
            success: true,
            message: `Medicine ${id} flagged successfully`,
            medicine: flaggedMedicine,
          });
        } catch (error) {
          console.error('Detailed Flagging Error:', {
            message: error.message,
            stack: error.stack,
            toString: error.toString()
          });
  
          try {
            await gateway.disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
  
          res.status(500).json({ 
            error: `Failed to flag medicine: ${error.message}`,
            details: error.toString()
          });
        }
      } catch (error) {
        console.error(`Flag Medicine Error:`, error);
        
        res.status(500).json({ 
          error: `Failed to process flag request: ${error.message}`,
          details: error.toString()
        });
      }
    }
  );

// @route   POST api/medicines
// @desc    Register a new medicine
// @access  Private/Manufacturer
router.post(
  '/',
  [
    verifyToken,
    checkRole(['manufacturer']),
    body('id', 'Medicine ID is required').not().isEmpty(),
    body('name', 'Medicine name is required').not().isEmpty(),
    body('batchNumber', 'Batch number is required').not().isEmpty(),
    body('manufacturingDate', 'Manufacturing date is required').isISO8601(),
    body('expirationDate', 'Expiration date is required').isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        id,
        name,
        batchNumber,
        manufacturingDate,
        expirationDate,
        registrationLocation
      } = req.body;
      
      // Use the authenticated user's organization as manufacturer
      const manufacturer = req.user.organization;

      // Load the connection profile
      const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
      const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

      // Create a new file system based wallet for managing identities
      const walletPath = path.join(__dirname, "../wallet");
      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check if we have the appUser identity
      const identity = await wallet.get("appUser");
      if (!identity) {
        return res
          .status(400)
          .json({ error: 'User "appUser" does not exist in the wallet' });
      }

      // Create a new gateway for connecting to the peer node
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: "appUser",
        discovery: { enabled: true, asLocalhost: true },
      });

      // Get the network (channel) our contract is deployed to
      const network = await gateway.getNetwork("mychannel");

      // Get the contract from the network
      const contract = network.getContract("medicine-contract");

      const timestamp = new Date().toISOString();
      const result = await contract.submitTransaction(
        "RegisterMedicine",
        id,
        name,
        manufacturer,
        batchNumber,
        manufacturingDate,
        expirationDate,
        timestamp,
        registrationLocation || 'Unknown location'
      );

      // Disconnect from the gateway
      await gateway.disconnect();

      const medicine = JSON.parse(result.toString());

      // Generate secure QR code with cryptographic signature
      const secretKey = process.env.QR_SECRET_KEY || "farmatech-secure-key-2025";
      const secureQRCode = generateSecureQRCode(medicine, secretKey);

      res.json({
        success: true,
        message: `Medicine ${id} registered successfully`,
        medicine,
        secureQRCode
      });
    } catch (error) {
      console.error(`Failed to register medicine: ${error}`);
      res
        .status(500)
        .json({ error: `Failed to register medicine: ${error.message}` });
    }
  }
);

// @route   POST api/medicines/verify-secure
// @desc    Verify medicine with secure QR code and record scan
// @access  Private
router.post('/verify-secure', verifyToken, async (req, res) => {
  try {
    const { qrContent, location } = req.body;
    
    if (!qrContent) {
      return res.status(400).json({ error: 'QR content is required' });
    }
    
    console.log(`Verifying medicine with secure QR code by ${req.user.username}`);
    
    // Verify the QR signature
    const secretKey = process.env.QR_SECRET_KEY || "farmatech-secure-key-2025";
    const verification = verifyQRCode(qrContent, secretKey);
    
    if (!verification.valid) {
      return res.status(400).json({
        verified: false,
        error: `Invalid secure QR code: ${verification.reason}`
      });
    }
    
    // Get the original blockchain QR code
    const blockchainQR = verification.blockchainQR;
    console.log(`Extracted blockchain QR code: ${blockchainQR}`);
    
    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(__dirname, "../wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get("appUser");
    if (!identity) {
      return res
        .status(400)
        .json({ error: 'User "appUser" does not exist in the wallet' });
    }

    const gateway = new Gateway();
    try {
      await gateway.connect(ccp, {
        wallet,
        identity: "appUser",
        discovery: { enabled: true, asLocalhost: true },
      });
  
      const network = await gateway.getNetwork("mychannel");
      const contract = network.getContract("medicine-contract");
  
      // Find the medicine by QR code 
      // First, get all medicines
      console.log(`Getting all medicines to find QR code: ${blockchainQR}`);
      const allMedicinesResult = await contract.evaluateTransaction("GetAllMedicines");
      const allMedicines = JSON.parse(allMedicinesResult.toString());
      
      // Find the medicine with matching QR code
      const medicine = allMedicines.find(med => med.qrCode === blockchainQR);
      
      if (!medicine) {
        await gateway.disconnect();
        return res.status(404).json({ 
          verified: false,
          error: `Medicine with QR code ${blockchainQR} not found` 
        });
      }
      
      console.log(`Found medicine: ${medicine.id} with QR code: ${blockchainQR}`);
      
      // Now get the full medicine details by ID for consistency
      const result = await contract.evaluateTransaction("GetMedicine", medicine.id);
      let medicineData = JSON.parse(result.toString());
      
      // Determine if the user is authorized to scan this medicine
      const isAuthorized = isAuthorizedScan(req.user, medicineData);
      console.log(`Scan authorization: ${isAuthorized ? 'Authorized' : 'UNAUTHORIZED'}`);
      
      // For unauthorized scans, flag the medicine automatically
      if (!isAuthorized) {
        console.warn(`SECURITY ALERT: Unauthorized scan detected - User: ${req.user.username}, Role: ${req.user.role}, Org: ${req.user.organization}, Medicine: ${medicineData.id}`);
        
        try {
          // Create detailed flag reason
          const flagReason = `Unauthorized scan by ${req.user.role} (${req.user.username}) from ${req.user.organization}`;
          
          // Submit the transaction to flag the medicine
          const flagResult = await contract.submitTransaction(
            "FlagMedicine",
            medicineData.id,
            req.user.organization,
            flagReason,
            location || 'Unknown location'
          );
          
          // Update medicine with flag information from blockchain
          medicineData = JSON.parse(flagResult.toString());
          
          // Add unauthorized scan details for frontend display
          medicineData.unauthorizedScanDetails = {
            scannerUsername: req.user.username,
            scannerRole: req.user.role,
            scannerOrganization: req.user.organization,
            location: location || 'Unknown location',
            timestamp: new Date().toISOString()
          };
          
          // Record the security incident
          try {
            const SecurityIncident = require('../models/SecurityIncident');
            const incident = new SecurityIncident({
              medicineId: medicineData.id,
              medicineName: medicineData.name,
              batchNumber: medicineData.batchNumber,
              incidentType: 'unauthorized_scan',
              severity: req.user.role === 'distributor' ? 'high' : 'medium',
              scanner: {
                userId: req.user.id,
                username: req.user.username,
                role: req.user.role,
                organization: req.user.organization
              },
              details: {
                location: location || 'Unknown location',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                notes: `Unauthorized secure QR scan detected and medicine flagged`
              },
              medicineStatus: {
                beforeIncident: 'Normal',
                afterIncident: 'Flagged'
              },
              flaggedInBlockchain: true,
              timestamp: new Date()
            });
            
            await incident.save();
          } catch (incidentError) {
            console.error('Error recording security incident:', incidentError);
            // Continue even if recording incident fails
          }
          
          console.log(`Medicine ${medicineData.id} auto-flagged due to unauthorized scan`);
        } catch (flagError) {
          console.error(`Error auto-flagging medicine:`, flagError);
          // Continue with the response even if flagging fails
        }
      } else {
        // For authorized scans, try to record the scan event
        try {
          // Check if this is not a duplicate scan within a short time period
          if (!medicineData.supplyChain.some(entry => 
              entry.handler === req.user.organization &&
              entry.status === 'Scanned' &&
              // Only consider scans in the last hour to be duplicates
              new Date(entry.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
          )) {
            try {
              // If the chaincode supports RecordScan
              await contract.submitTransaction(
                "RecordScan",
                medicineData.id,
                req.user.organization,
                req.user.role,
                req.user.username,
                location || 'Unknown location'
              );
              
              // Get updated medicine after recording scan
              const updatedResult = await contract.evaluateTransaction("GetMedicine", medicineData.id);
              medicineData = JSON.parse(updatedResult.toString());
              
              console.log(`Scan recorded for medicine ${medicineData.id} by ${req.user.username}`);
            } catch (error) {
              console.error("Error recording scan:", error);
            }
          }
        } catch (scanError) {
          console.error(`Error recording scan:`, scanError);
        }
      }

      // Disconnect from the gateway
      await gateway.disconnect();

      // Prepare role-specific information
      let roleSpecificData = {};
      
      if (req.user.role === "manufacturer") {
        roleSpecificData = {
          canUpdateRecord: req.user.organization === medicineData.manufacturer,
          viewDetailedHistory: true,
        };
      } else if (req.user.role === "distributor") {
        roleSpecificData = {
          canUpdateSupplyChain: req.user.organization === medicineData.currentOwner,
          updateEndpoint: `/api/medicines/${medicineData.id}/update`,
          canFlag: true,
        };
      } else if (req.user.role === "regulator") {
        roleSpecificData = {
          canFlagIssues: true,
          canVerifyAll: true,
        };
      } else if (req.user.role === "enduser") {
        // Check if medicine is expired
        const isExpired = new Date(medicineData.expirationDate) < new Date();
        
        roleSpecificData = {
          safetyStatus: medicineData.flagged
            ? "WARNING: Product flagged for issues"
            : isExpired
            ? "WARNING: Product expired"
            : "SAFE: Product verified",
          safeToUse: !medicineData.flagged && !isExpired
        };
      }

      // Include authorization status
      roleSpecificData.isAuthorizedScan = isAuthorized;
      roleSpecificData.isOwnerOrManufacturer = 
        req.user.organization === medicineData.currentOwner || 
        req.user.organization === medicineData.manufacturer;

      // Send the response with medicine data
      res.json({
        verified: true,
        medicine: medicineData,
        roleSpecificActions: roleSpecificData,
        scanRecorded: isAuthorized
      });
    } catch (error) {
      console.error('Gateway Error:', error);
      try {
        await gateway.disconnect();
      } catch (e) { /* ignore disconnect errors */ }
      
      res.status(500).json({ 
        verified: false, 
        error: error.message 
      });
    }
  } catch (error) {
    console.error(`Failed to verify medicine with secure QR:`, error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      verified: false, 
      error: error.message 
    });
  }
});

// @route   GET api/medicines/test-qr/:id
// @desc    Generate test QR code for a medicine
// @access  Private
router.get('/test-qr/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "../wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if we have the appUser identity
    const identity = await wallet.get("appUser");
    if (!identity) {
      return res
        .status(400)
        .json({ error: 'User "appUser" does not exist in the wallet' });
    }

    // Create a new gateway for connecting to the peer node
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork("mychannel");

    // Get the contract from the network
    const contract = network.getContract("medicine-contract");

    // Get medicine by ID
    const result = await contract.evaluateTransaction("GetMedicine", id);

    // Disconnect from the gateway
    await gateway.disconnect();

    const medicine = JSON.parse(result.toString());

    // Check if user is authorized to generate QR code for this medicine
    if (req.user.role !== 'regulator' && 
        req.user.organization !== medicine.manufacturer && 
        req.user.organization !== medicine.currentOwner) {
      return res.status(403).json({ 
        error: 'You are not authorized to generate a QR code for this medicine' 
      });
    }

    // Generate secure QR code
    const secretKey = process.env.QR_SECRET_KEY || "farmatech-secure-key-2025";
    const secureQRCode = generateSecureQRCode(medicine, secretKey);

    res.json({
      medicine,
      secureQRCode,
      qrVerifyEndpoint: "/api/medicines/verify-secure",
    });
  } catch (error) {
    console.error(`Test QR generation failed: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/medicines/manufacturer/:manufacturer
// @desc    Get medicines by manufacturer
// @access  Private
router.get('/manufacturer/:manufacturer', verifyToken, async (req, res) => {
    try {
      const { manufacturer } = req.params;
      console.log(`Fetching medicines for manufacturer: ${manufacturer}`);
  
      // Check if user is authorized to view these medicines
      // Only allow users from the same organization or regulators
      if (req.user.role !== 'regulator' && req.user.organization !== manufacturer) {
        return res.status(403).json({ 
          error: 'You are not authorized to view medicines from other manufacturers' 
        });
      }
  
      // Load the connection profile
      const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
      const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
  
      // Create a new file system based wallet for managing identities
      const walletPath = path.join(__dirname, "../wallet");
      const wallet = await Wallets.newFileSystemWallet(walletPath);
  
      // Check if we have the appUser identity
      const identity = await wallet.get("appUser");
      if (!identity) {
        return res
          .status(400)
          .json({ error: 'User "appUser" does not exist in the wallet' });
      }
  
      // Create a new gateway for connecting to the peer node
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: "appUser",
        discovery: { enabled: true, asLocalhost: true },
      });
  
      // Get the network (channel) our contract is deployed to
      const network = await gateway.getNetwork("mychannel");
  
      // Get the contract from the network
      const contract = network.getContract("medicine-contract");
  
      // Submit the transaction to get medicines by manufacturer
      console.log(`Calling GetMedicinesByManufacturer with param: ${manufacturer}`);
      const result = await contract.evaluateTransaction(
        "GetMedicinesByManufacturer",
        manufacturer
      );
  
      // Disconnect from the gateway
      await gateway.disconnect();
  
      const medicines = JSON.parse(result.toString());
      console.log(`Found ${medicines.length} medicines for manufacturer ${manufacturer}`);
      
      res.json(medicines);
    } catch (error) {
      console.error(`Failed to get medicines by manufacturer: ${error}`);
      res
        .status(500)
        .json({ error: `Failed to get medicines by manufacturer: ${error.message}` });
    }
  });

  router.post(
    '/:id/assign-distributors',
    [
      verifyToken,
      checkRole(['manufacturer']),
      body('distributors', 'Distributors list is required').isArray(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
  
        const { id } = req.params;
        const { distributors } = req.body;
        
        // Validate the medicine ID
        if (!id || typeof id !== 'string' || id.trim() === '') {
          return res.status(400).json({ error: 'Invalid medicine ID' });
        }
        
        // Validate the distributors array
        if (!Array.isArray(distributors) || distributors.length === 0) {
          return res.status(400).json({ error: 'Distributors must be a non-empty array' });
        }
        
        console.log('Assigning distributors to medicine:', id);
        console.log('Distributors:', distributors);
  
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
        const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
  
        const walletPath = path.join(__dirname, "../wallet");
        const wallet = await Wallets.newFileSystemWallet(walletPath);
  
        const identity = await wallet.get("appUser");
        if (!identity) {
          return res.status(400).json({ 
            error: 'User "appUser" does not exist in the wallet' 
          });
        }
  
        const gateway = new Gateway();
        try {
          await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discovery: { enabled: true, asLocalhost: true },
          });
  
          const network = await gateway.getNetwork("mychannel");
          const contract = network.getContract("medicine-contract");
  
          // First, get the medicine to check if the user is the manufacturer
          const medicineResult = await contract.evaluateTransaction("GetMedicine", id);
          const medicine = JSON.parse(medicineResult.toString());
          
          // Check if the user's organization is the manufacturer
          if (medicine.manufacturer !== req.user.organization) {
            await gateway.disconnect();
            return res.status(403).json({ 
              error: 'Only the manufacturer can assign distributors to this medicine' 
            });
          }
          
          // Stringify the distributors array for the chaincode
          const distributorsJSON = JSON.stringify(distributors);
          console.log('Distributors JSON:', distributorsJSON);
          
          // Update the medicine with assigned distributors
          const result = await contract.submitTransaction(
            "AssignDistributorsToMedicine",
            id,
            distributorsJSON
          );
  
          await gateway.disconnect();
  
          // Parse the result
          let updatedMedicine;
          try {
            updatedMedicine = JSON.parse(result.toString());
          } catch (parseError) {
            console.error('Error parsing chaincode result:', parseError);
            return res.status(500).json({ 
              error: 'Failed to parse chaincode response',
              details: parseError.message 
            });
          }
          
          // Send notifications to the assigned distributors
          for (const distributorOrg of distributors) {
            try {
              const distributor = await User.findOne({ 
                organization: distributorOrg,
                role: 'distributor'
              });
              
              if (distributor) {
                // Create a notification
                await axios.post(
                  `${req.protocol}://${req.get('host')}/api/notifications`,
                  {
                    recipientId: distributor._id,
                    subject: `New Delivery Assignment: ${medicine.name}`,
                    message: `You have been assigned to deliver medicine ${medicine.name} (ID: ${medicine.id}, Batch: ${medicine.batchNumber}) by ${req.user.organization}. Please check your inventory for details.`,
                    relatedTo: 'Medicine',
                    medicineId: medicine.id
                  },
                  {
                    headers: { Authorization: `Bearer ${req.headers.authorization}` }
                  }
                );
              }
            } catch (notificationErr) {
              console.error(`Error sending notification to ${distributorOrg}:`, notificationErr);
            }
          }
          
          res.json({
            success: true,
            message: `Distributors assigned to medicine ${id} successfully`,
            medicine: updatedMedicine,
          });
        } catch (error) {
          console.error(`Assign Distributors Error:`, error);
          
          try {
            await gateway.disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
          
          res.status(500).json({ 
            error: `Failed to assign distributors: ${error.message}`,
            details: error.toString()
          });
        }
      } catch (error) {
        console.error(`Failed to process assignment request: ${error}`);
        res.status(500).json({ error: error.message });
      }
    }
  );
module.exports = router;