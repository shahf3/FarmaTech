// fabric-test-app/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Verify JWT token middleware
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'farmatechsecretkey2025');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      organization: user.organization,
      isOrgAdmin: user.isOrgAdmin
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check user role
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  };
};

// Check if user is from the same organization as the resource
exports.checkOrganization = (paramName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // If regulator, they can access any organization's resources
      if (req.user.role === 'regulator') {
        return next();
      }

      // For manufacturer and distributor roles, check organization match
      if (['manufacturer', 'distributor'].includes(req.user.role)) {
        // Get the medicine by ID or other param
        const id = req.params[paramName];

        // Load the connection profile for Hyperledger Fabric
        const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
        const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

        const walletPath = path.join(__dirname, "../wallet");
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get("appUser");
        if (!identity) {
          return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {
          wallet,
          identity: "appUser",
          discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("medicine-contract");

        // Get the medicine to check organization
        const result = await contract.evaluateTransaction("GetMedicine", id);
        await gateway.disconnect();
        
        const medicine = JSON.parse(result.toString());

        // Allow if user is from same organization as manufacturer
        if (req.user.organization === medicine.manufacturer) {
          return next();
        }

        // Allow if user is distributor and medicine is owned by their organization
        if (req.user.role === 'distributor' && medicine.currentOwner === req.user.organization) {
          return next();
        }

        // Otherwise, deny access
        return res.status(403).json({ 
          message: 'Access denied. You do not have permission to perform actions on medicines from other organizations.' 
        });
      }

      // Default case - allow access
      next();
    } catch (error) {
      console.error('Organization check error:', error);
      res.status(500).json({ message: 'Error checking organization permissions' });
    }
  };
};