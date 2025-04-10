"use strict";
require('dotenv').config({ path: './fabric-test-app/.env' });
const crypto = require("crypto");
const express = require("express");
const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const medicineRoutes = require('./routes/medicines');
const app = express();
const PORT = process.env.PORT || 3000;
const notificationRoutes = require('./routes/notifications');
const authRoutes = require("./routes/auth");


console.log('API Key set:', process.env.SENDGRID_API_KEY ? 'API key exists' : 'API key is missing');

// Configure CORS middleware FIRST before defining any routes
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://172.27.231.107:3000",
      "http://127.0.0.1:3002",
      "http://172.27.231.107:3001",
    ],
    methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Location"],
    credentials: true
  })
);

// Middleware to parse JSON
app.use(express.json());

// Debug route logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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
  
      // Verify signature matches
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
  
module.exports.verifyQRCode = verifyQRCode;

// Public endpoint for medicine verification with simple QR code (no authentication required)
app.get("/api/public/verify/:qrCode", async (req, res) => {
  try {
    const qrCode = req.params.qrCode;
    
    if (!qrCode) {
      return res.status(400).json({ error: 'QR code is required' });
    }
    
    console.log(`Public verification of medicine with QR: ${qrCode}`);
    
    // Connect to the blockchain
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(__dirname, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get("appUser");
    if (!identity) {
      return res.status(400).json({ 
        error: 'System identity not available in wallet' 
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
  
      // Find the medicine by QR code directly
      const allMedicinesResult = await contract.evaluateTransaction("GetAllMedicines");
      const allMedicines = JSON.parse(allMedicinesResult.toString());
      
      // Find the medicine with matching QR code
      const medicine = allMedicines.find(med => med.qrCode === qrCode);
      
      if (!medicine) {
        await gateway.disconnect();
        return res.status(404).json({ error: `Medicine not found` });
      }
      
      // Get the full medicine details by ID
      const result = await contract.evaluateTransaction("GetMedicine", medicine.id);
      let medicineData = JSON.parse(result.toString());

      // Record this as a public scan
      try {
        await contract.submitTransaction(
          "RecordScan",
          medicineData.id,
          "PublicUser",
          "enduser",
          "Anonymous",
          req.headers['x-user-location'] || 'Unknown location'
        );
        
        // Get updated medicine after recording scan
        const updatedResult = await contract.evaluateTransaction("GetMedicine", medicineData.id);
        medicineData = JSON.parse(updatedResult.toString());
      } catch (scanError) {
        console.error("Error recording public scan:", scanError);
        // Continue even if recording scan fails
      }

      await gateway.disconnect();

      // For public users, only provide essential information
      const isExpired = new Date(medicineData.expirationDate) < new Date();
      
      // Prepare a filtered response with only the necessary information
      const publicMedicineData = {
        id: medicineData.id,
        name: medicineData.name,
        manufacturer: medicineData.manufacturer,
        batchNumber: medicineData.batchNumber,
        manufacturingDate: medicineData.manufacturingDate,
        expirationDate: medicineData.expirationDate,
        status: medicineData.status,
        flagged: medicineData.flagged,
        verificationTimestamp: new Date().toISOString()
      };

      res.json(publicMedicineData);
    } catch (error) {
      console.error('Gateway Error:', error);
      try {
        await gateway.disconnect();
      } catch (e) { /* ignore disconnect errors */ }
      
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error(`Failed to verify medicine with QR: ${req.params.qrCode}`, error);
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint for medicine verification (no authentication required)
app.post("/api/public/verify-medicine", async (req, res) => {
  try {
    const { qrContent } = req.body;
    
    if (!qrContent) {
      return res.status(400).json({ error: 'QR content is required' });
    }
    
    console.log(`Public verification of medicine with QR content`);
    
    // Determine if the QR is in JSON format or plain text
    let blockchainQR;
    try {
      // Try to parse as JSON first
      const parsedQR = JSON.parse(qrContent);
      
      // Use the verifyQRCode function for signature verification
      const secretKey = process.env.QR_SECRET_KEY || "farmatech-secure-key-2025";
      const verification = verifyQRCode(qrContent, secretKey);
      
      if (!verification.valid) {
        return res.status(400).json({
          verified: false,
          error: `Invalid QR code: ${verification.reason}`
        });
      }
      
      blockchainQR = verification.blockchainQR;
    } catch (e) {
      // If not JSON, use the raw qrContent as the blockchainQR
      blockchainQR = qrContent;
    }
    
    console.log(`Using blockchain QR code: ${blockchainQR}`);
    
    // Connect to the blockchain
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(__dirname, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get("appUser");
    if (!identity) {
      return res.status(400).json({ 
        error: 'System identity not available in wallet' 
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
  
      // Find the medicine by QR code 
      const allMedicinesResult = await contract.evaluateTransaction("GetAllMedicines");
      const allMedicines = JSON.parse(allMedicinesResult.toString());
      
      // Find the medicine with matching QR code
      const medicine = allMedicines.find(med => med.qrCode === blockchainQR);
      
      if (!medicine) {
        await gateway.disconnect();
        return res.status(404).json({ 
          verified: false,
          error: `Medicine not found with QR code: ${blockchainQR}` 
        });
      }
      
      // Get the full medicine details by ID
      const result = await contract.evaluateTransaction("GetMedicine", medicine.id);
      let medicineData = JSON.parse(result.toString());

      // Record this as a public scan
      try {
        await contract.submitTransaction(
          "RecordScan",
          medicineData.id,
          "PublicUser",
          "enduser",
          "Anonymous",
          req.headers['x-user-location'] || 'Unknown location'
        );
        
        // Get updated medicine after recording scan
        const updatedResult = await contract.evaluateTransaction("GetMedicine", medicineData.id);
        medicineData = JSON.parse(updatedResult.toString());
      } catch (scanError) {
        console.error("Error recording public scan:", scanError);
        // Continue even if recording scan fails
      }

      await gateway.disconnect();

      // For public users, only provide essential information
      const isExpired = new Date(medicineData.expirationDate) < new Date();
      
      // Prepare a filtered response with only the necessary information
      const publicMedicineData = {
        id: medicineData.id,
        name: medicineData.name,
        manufacturer: medicineData.manufacturer,
        batchNumber: medicineData.batchNumber,
        manufacturingDate: medicineData.manufacturingDate,
        expirationDate: medicineData.expirationDate,
        status: medicineData.status,
        flagged: medicineData.flagged,
        safetyStatus: medicineData.flagged
          ? "WARNING: Product flagged for issues"
          : isExpired
          ? "WARNING: Product expired"
          : "SAFE: Product verified",
        safeToUse: !medicineData.flagged && !isExpired,
        verificationTimestamp: new Date().toISOString()
      };

      res.json({
        verified: true,
        medicine: publicMedicineData
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
    console.error(`Failed to verify medicine with QR:`, error);
    res.status(500).json({ 
      verified: false, 
      error: error.message 
    });
  }
});

app.post("/api/medicines/verify-secure", async (req, res) => {
  try {
    const { qrContent } = req.body;
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Get user role from token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "farmatechsecretkey2025"
    );
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify QR signature
    const secretKey = process.env.QR_SECRET_KEY || "farmatech-secure-key-2025";
    const verification = verifyQRCode(qrContent, secretKey);

    if (!verification.valid) {
      return res.status(400).json({
        verified: false,
        error: verification.reason,
      });
    }

    // Use the original blockchain QR code to query the ledger
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(__dirname, "wallet");
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

    const result = await contract.evaluateTransaction(
      "VerifyMedicine",
      verification.blockchainQR
    );

    await gateway.disconnect();

    const medicine = JSON.parse(result.toString());

    let roleSpecificData = {};

    if (user.role === "manufacturer") {
      roleSpecificData = {
        canUpdateRecord: medicine.manufacturer === user.organization,
        viewDetailedHistory: true,
      };
    } else if (user.role === "distributor") {
      roleSpecificData = {
        canUpdateSupplyChain: true,
        updateEndpoint: `/api/medicines/${medicine.id}/update`,
        canFlag: true,
      };
    } else if (user.role === "regulator") {
      roleSpecificData = {
        canFlagIssues: true,
        fullSupplyChainAccess: true,
        canVerifyAuthenticity: true,
      };
    } else if (user.role === "enduser") {
      const isExpired = new Date(medicine.expirationDate) < new Date();

      roleSpecificData = {
        safetyStatus: medicine.flagged
          ? "WARNING: Product flagged for issues"
          : isExpired
          ? "WARNING: Product expired"
          : "SAFE: Product verified",
        safeToUse: !medicine.flagged && !isExpired,
      };
    }

    res.json({
      verified: true,
      medicine,
      roleSpecificActions: roleSpecificData,
    });
  } catch (error) {
    console.error(`Failed to verify medicine with secure QR: ${error}`);
    res.status(500).json({ verified: false, error: error.message });
  }
});

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/farmatech", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "UP" });
});

app.use("/api/auth", authRoutes);

// Get current user
app.get("/api/auth/user", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "farmatechsecretkey2025"
    );

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
});

app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "..", "react-frontend", "build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle all other non-API routes by serving the React app's index.html
app.get("*", (req, res) => {
  if (!req.url.startsWith("/api")) {
    res.sendFile(
      path.join(__dirname, "..", "react-frontend", "build", "index.html")
    );
  } else {
    res.status(404).send("API route not found");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `FarmaTech API is now available with medicine-contract integration`
  );
});