// fabric-test-app/routes/medicines.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { verifyToken, checkRole, checkOrganization } = require('../middleware/auth');

// Helper function to generate secure QR code
function generateSecureQRCode(medicine, secretKey) {
  // Create base content with medicine info
  const baseContent = {
    id: medicine.id,
    name: medicine.name,
    manufacturer: medicine.manufacturer,
    batchNumber: medicine.batchNumber,
    blockchainQR: medicine.qrCode, // Original QR code from blockchain
    timestamp: Date.now(),
  };

  // Stringify the content
  const contentString = JSON.stringify(baseContent);

  // Create HMAC signature
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(contentString)
    .digest("hex");

  // Return the combined content for QR code
  return JSON.stringify({
    ...baseContent,
    signature: hmac,
  });
}

// Helper function to verify QR code
function verifyQRCode(qrContent, secretKey) {
  try {
    // Parse QR content
    const data = JSON.parse(qrContent);

    // Extract signature
    const { signature, ...baseContent } = data;

    // Re-compute HMAC
    const contentString = JSON.stringify(baseContent);
    const expectedHmac = crypto
      .createHmac("sha256", secretKey)
      .update(contentString)
      .digest("hex");

    // Verify signature matches
    if (signature !== expectedHmac) {
      return { valid: false, reason: "Invalid signature" };
    }

    // Check for expired QR code (optional - e.g., codes older than 30 days)
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
// @desc    Verify medicine by QR code
// @access  Private
router.get('/verify/:qrCode', verifyToken, async (req, res) => {
    try {
      const { qrCode } = req.params;
      console.log(`Verifying medicine with QR code: ${qrCode}`);
      
      // Check if QR code has the correct format
      if (!qrCode.startsWith('QR-')) {
        return res.status(400).json({ 
          error: 'Invalid QR code format. QR codes should start with "QR-"' 
        });
      }
  
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
      await gateway.connect(ccp, {
        wallet,
        identity: "appUser",
        discovery: { enabled: true, asLocalhost: true },
      });
  
      const network = await gateway.getNetwork("mychannel");
      const contract = network.getContract("medicine-contract");
  
      // Verify medicine using the QR code
      console.log(`Calling chaincode with QR code: ${qrCode}`);
      const result = await contract.evaluateTransaction("VerifyMedicine", qrCode);
      console.log(`Chaincode response received`);
  
      await gateway.disconnect();
  
      const medicine = JSON.parse(result.toString());
  
      // Prepare role-specific information
      let roleSpecificData = {};
      const isFromManufacturer = req.user.organization === medicine.manufacturer;
  
      if (req.user.role === "manufacturer") {
        roleSpecificData = {
          canUpdateRecord: isFromManufacturer,
          viewDetailedHistory: true,
          belongsToManufacturer: isFromManufacturer
        };
      } else if (req.user.role === "distributor") {
        roleSpecificData = {
          canUpdateSupplyChain: true,
          updateEndpoint: `/api/medicines/${medicine.id}/update`,
          canFlag: true,
          belongsToManufacturer: isFromManufacturer
        };
      }
  
      res.json({
        ...medicine,
        roleSpecificActions: roleSpecificData,
      });
    } catch (error) {
      console.error(`Failed to verify medicine:`, error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: error.message });
    }
  });

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
// @desc    Verify medicine with secure QR code
// @access  Private
router.post('/verify-secure', verifyToken, async (req, res) => {
    try {
      const { qrContent } = req.body;
      
      if (!qrContent) {
        return res.status(400).json({ error: 'QR content is required' });
      }
      
      console.log(`Verifying medicine with secure QR code`);
      
      // Verify the QR signature
      const secretKey = process.env.QR_SECRET_KEY || "farmatech-secure-key-2025";
      const verification = verifyQRCode(qrContent, secretKey);
      
      if (!verification.valid) {
        return res.status(400).json({
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
      await gateway.connect(ccp, {
        wallet,
        identity: "appUser",
        discovery: { enabled: true, asLocalhost: true },
      });
  
      const network = await gateway.getNetwork("mychannel");
      const contract = network.getContract("medicine-contract");
  
      // Verify medicine using the blockchain QR code
      console.log(`Calling chaincode with QR code: ${blockchainQR}`);
      const result = await contract.evaluateTransaction("VerifyMedicine", blockchainQR);
      console.log(`Chaincode response received`);
  
      await gateway.disconnect();
  
      const medicine = JSON.parse(result.toString());
  
      // Prepare role-specific information
      let roleSpecificData = {};
      const isFromManufacturer = req.user.organization === medicine.manufacturer;
  
      if (req.user.role === "manufacturer") {
        roleSpecificData = {
          canUpdateRecord: isFromManufacturer,
          viewDetailedHistory: true,
          belongsToManufacturer: isFromManufacturer
        };
      } else if (req.user.role === "distributor") {
        roleSpecificData = {
          canUpdateSupplyChain: true,
          updateEndpoint: `/api/medicines/${medicine.id}/update`,
          canFlag: true,
          belongsToManufacturer: isFromManufacturer
        };
      }
  
      res.json({
        verified: true,
        medicine: medicine,
        roleSpecificActions: roleSpecificData,
      });
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

module.exports = router;