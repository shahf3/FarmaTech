"use strict";

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

const authRoutes = require("./routes/auth");

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
  
  // Export the function if needed elsewhere
  module.exports.verifyQRCode = verifyQRCode;

// Add this new endpoint for secure QR verification
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

    // Verify medicine using the blockchain QR code
    const result = await contract.evaluateTransaction(
      "VerifyMedicine",
      verification.blockchainQR
    );

    await gateway.disconnect();

    const medicine = JSON.parse(result.toString());

    // Prepare role-specific information and actions
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
      // Check expiration
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

// Add request logging to debug route issues
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});


app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://172.27.231.107:3000",
      "http://172.27.231.107:3001",
    ],
    methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Location" ],
  })
);

// Middleware to parse JSON
app.use(express.json());

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

// Serve static files (React frontend build and public folder)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "..", "react-frontend", "build")));

// Handle root route (serving React app)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle all other non-API routes by serving the React app's index.html
app.get("*", (req, res) => {
  // Exclude API routes from this wildcard
  if (!req.url.startsWith("/api")) {
    res.sendFile(
      path.join(__dirname, "..", "react-frontend", "build", "index.html")
    );
  } else {
    res.status(404).send("API route not found");
  }
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `FarmaTech API is now available with medicine-contract integration`
  );
});

/*// ================ MEDICINE CONTRACT API ENDPOINTS ================

// Initialize the ledger with sample medicines
app.post("/api/medicines/init", async (req, res) => {
  try {
    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if we have the appUser identity
    const identity = await wallet.get("appUser");
    if (!identity) {
      res
        .status(400)
        .json({ error: 'User "appUser" does not exist in the wallet' });
      return;
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

    // Submit the transaction to initialize the ledger
    await contract.submitTransaction("InitLedger");

    // Disconnect from the gateway
    await gateway.disconnect();

    res.json({
      success: true,
      message: "Medicine ledger initialized successfully",
    });
  } catch (error) {
    console.error(`Failed to initialize medicine ledger: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

// Get all medicines endpoint
app.get("/api/medicines", async (req, res) => {
  try {
    console.log("Attempting to get all medicines...");
    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if we have the appUser identity
    const identity = await wallet.get("appUser");
    if (!identity) {
      console.error('User "appUser" does not exist in the wallet');
      res
        .status(400)
        .json({ error: 'User "appUser" does not exist in the wallet' });
      return;
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
    console.log("Connected to network for channel:", "mychannel");

    // Get the contract from the network
    const contract = network.getContract("medicine-contract");
    console.log("Retrieved contract: medicine-contract");

    // Submit the transaction to get all medicines
    console.log("Calling GetAllMedicines transaction...");
    const result = await contract.evaluateTransaction("GetAllMedicines");
    console.log(
      "Transaction result (raw):",
      result ? result.toString() || "No result" : "No result"
    );

    // Disconnect from the gateway
    await gateway.disconnect();
    console.log("Disconnected from gateway");

    // Parse the result and ensure we return a JSON array
    let medicines = [];
    if (result) {
      try {
        let parsedResult;
        if (Buffer.isBuffer(result)) {
          const resultStr = result.toString("utf8");
          parsedResult = resultStr ? JSON.parse(resultStr) : {};
        } else if (typeof result === "string" && result.trim()) {
          parsedResult = JSON.parse(result);
        } else if (typeof result === "object" && result !== null) {
          parsedResult = result;
        } else {
          parsedResult = {};
        }

        console.log("Parsed result:", parsedResult);
        if (Array.isArray(parsedResult)) {
          medicines = parsedResult;
        } else if (parsedResult && typeof parsedResult === "object") {
          if (Object.keys(parsedResult).length > 0) {
            medicines = [parsedResult];
          }
        }
      } catch (parseError) {
        console.error("Failed to parse medicines:", parseError);
        medicines = [];
      }
    } else {
      console.log("No medicines found on the ledger, returning empty array");
    }

    console.log("Parsed medicines to send:", medicines);
    res.json(medicines);
  } catch (error) {
    console.error(`Failed to get all medicines: ${error.message}`, error.stack);
    res
      .status(500)
      .json({
        error: "Internal server error while retrieving medicines",
        details: error.message,
      });
  }
});

// Get medicines by manufacturer
app.get("/api/medicines/manufacturer/:manufacturer", async (req, res) => {
  try {
    const { manufacturer } = req.params;

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
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
    const result = await contract.evaluateTransaction(
      "GetMedicinesByManufacturer",
      manufacturer
    );

    // Disconnect from the gateway
    await gateway.disconnect();

    const medicines = JSON.parse(result.toString());
    res.json(medicines);
  } catch (error) {
    console.error(`Failed to get medicines by manufacturer: ${error}`);
    res
      .status(500)
      .json({
        error: `Failed to get medicines by manufacturer: ${error.message}`,
      });
  }
});

// Get medicines by owner (for distributors)
app.get("/api/medicines/owner/:owner", async (req, res) => {
  try {
    const { owner } = req.params;

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
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

// Get flagged medicines (for regulators)
app.get("/api/medicines/flagged", async (req, res) => {
  try {
    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
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

    // Submit the transaction to get flagged medicines
    const result = await contract.evaluateTransaction("GetFlaggedMedicines");

    // Disconnect from the gateway
    await gateway.disconnect();

    const medicines = JSON.parse(result.toString());
    res.json(medicines);
  } catch (error) {
    console.error(`Failed to get flagged medicines: ${error}`);
    res
      .status(500)
      .json({ error: `Failed to get flagged medicines: ${error.message}` });
  }
});

// Verify medicine by QR code
app.get("/api/medicines/verify/:qrCode", async (req, res) => {
  try {
    const { qrCode } = req.params;

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
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

    // Submit the transaction to verify the medicine
    const result = await contract.evaluateTransaction("VerifyMedicine", qrCode);

    // Disconnect from the gateway
    await gateway.disconnect();

    const medicine = JSON.parse(result.toString());
    res.json(medicine);
  } catch (error) {
    console.error(`Failed to verify medicine: ${error}`);
    res
      .status(500)
      .json({ error: `Failed to verify medicine: ${error.message}` });
  }
});

// Get medicine by ID endpoint
app.get("/api/medicines/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to get medicine with ID: ${id}`);

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
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

    // Submit the transaction to get the medicine
    const result = await contract.evaluateTransaction("GetMedicine", id);

    // Disconnect from the gateway
    await gateway.disconnect();

    const medicine = JSON.parse(result.toString());
    res.json(medicine);
  } catch (error) {
    console.error(`Failed to get medicine: ${error}`);
    res.status(500).json({ error: `Failed to get medicine: ${error.message}` });
  }
});

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
// Create/register a new medicine
app.post("/api/medicines", async (req, res) => {
  try {
    const {
      id,
      name,
      manufacturer,
      batchNumber,
      manufacturingDate,
      expirationDate,
      registrationLocation
    } = req.body;

    // Validate input
    if (
      !id ||
      !name ||
      !manufacturer ||
      !batchNumber ||
      !manufacturingDate ||
      !expirationDate
    ) {
      return res.status(400).json({
        error:
          "All fields (id, name, manufacturer, batchNumber, manufacturingDate, expirationDate) are required",
      });
    }

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
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

    const timestamp = new Date().toISOString(); // Generate timestamp once
    const result = await contract.submitTransaction(
      "RegisterMedicine",
      id,
      name,
      manufacturer,
      batchNumber,
      manufacturingDate,
      expirationDate,
      timestamp,
      registrationLocation || 'Unknown location', 
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
      secureQRCode,
      // qrCodeImage: qrCodeImage // Uncomment if you implement QR image generation
    });
  } catch (error) {
    console.error(`Failed to register medicine: ${error}`);
    res
      .status(500)
      .json({ error: `Failed to register medicine: ${error.message}` });
  }
});
// Update medicine supply chain
app.post("/api/medicines/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { handler, status, location, notes } = req.body;

    // Validate input
    if (!handler || !status || !location) {
      return res.status(400).json({
        error: "Required fields (handler, status, location) are missing",
      });
    }

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
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

    // Submit the transaction to update supply chain
    const result = await contract.submitTransaction(
      "UpdateSupplyChain",
      id,
      handler,
      status,
      location,
      notes || ""
    );

    // Disconnect from the gateway
    await gateway.disconnect();

    const medicine = JSON.parse(result.toString());
    res.json({
      success: true,
      message: `Medicine ${id} supply chain updated successfully`,
      medicine,
    });
  } catch (error) {
    console.error(`Failed to update medicine supply chain: ${error}`);
    res
      .status(500)
      .json({
        error: `Failed to update medicine supply chain: ${error.message}`,
      });
  }
});

// Flag a medicine for issues
app.post("/api/medicines/:id/flag", async (req, res) => {
  try {
    const { id } = req.params;
    const { flaggedBy, reason, location } = req.body;

    // Validate input
    if (!flaggedBy || !reason || !location) {
      return res.status(400).json({
        error: "Required fields (flaggedBy, reason, location) are missing",
      });
    }

    // Load the connection profile
    const ccpPath = path.resolve(__dirname, "config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, "wallet");
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

    // Submit the transaction to flag the medicine
    const result = await contract.submitTransaction(
      "FlagMedicine",
      id,
      flaggedBy,
      reason,
      location
    );

    // Disconnect from the gateway
    await gateway.disconnect();

    const medicine = JSON.parse(result.toString());
    res.json({
      success: true,
      message: `Medicine ${id} flagged successfully`,
      medicine,
    });
  } catch (error) {
    console.error(`Failed to flag medicine: ${error}`);
    res
      .status(500)
      .json({ error: `Failed to flag medicine: ${error.message}` });
  }
});

app.get("/api/test/secure-qr/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // First get the medicine details
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

    // Get medicine by ID
    const result = await contract.evaluateTransaction("GetMedicine", id);

    await gateway.disconnect();

    const medicine = JSON.parse(result.toString());

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
});*/