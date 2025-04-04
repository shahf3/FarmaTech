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

// debug route issues
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
