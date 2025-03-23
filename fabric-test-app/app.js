'use strict';

const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');

// Add request logging to debug route issues
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enable CORS for all origins (for development; adjust for production)
app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://172.27.231.107:3000',
      'http://172.27.231.107:3001'
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmatech', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define User model schema
/*const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['manufacturer', 'distributor', 'regulator', 'enduser'],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    organization: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model('User', UserSchema);
*/

// Simple health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'UP' });
});

// ================== AUTH ROUTES ==================

// Register a new user
/*app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, role, email, organization } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({
            username,
            password,
            role,
            email,
            organization
        });

        // Save user to MongoDB
        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'farmatechsecretkey2025',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                email: user.email,
                organization: user.organization
            }
        });
    } catch (error) {
        console.error(`Registration error: ${error}`);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Login attempt for:", username);

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'farmatechsecretkey2025',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                email: user.email,
                organization: user.organization
            }
        });
    } catch (error) {
        console.error(`Login error: ${error}`);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
*/

app.use('/api/auth', authRoutes);

// Get current user
app.get('/api/auth/user', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'farmatechsecretkey2025');
        
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
});

// ================ MEDICINE CONTRACT API ENDPOINTS ================

// Initialize the ledger with sample medicines
app.post('/api/medicines/init', async (req, res) => {
    try {
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
            return;
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to initialize the ledger
        await contract.submitTransaction('InitLedger');

        // Disconnect from the gateway
        await gateway.disconnect();

        res.json({ success: true, message: 'Medicine ledger initialized successfully' });

    } catch (error) {
        console.error(`Failed to initialize medicine ledger: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Get all medicines endpoint
app.get('/api/medicines', async (req, res) => {
    try {
        console.log('Attempting to get all medicines...');
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.error('User "appUser" does not exist in the wallet');
            res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
            return;
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');
        console.log('Connected to network for channel:', 'mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');
        console.log('Retrieved contract: medicine-contract');

        // Submit the transaction to get all medicines
        console.log('Calling GetAllMedicines transaction...');
        const result = await contract.evaluateTransaction('GetAllMedicines');
        console.log('Transaction result (raw):', result ? (result.toString() || 'No result') : 'No result');

        // Disconnect from the gateway
        await gateway.disconnect();
        console.log('Disconnected from gateway');

        // Parse the result and ensure we return a JSON array
        let medicines = [];
        if (result) {
            try {
                let parsedResult;
                if (Buffer.isBuffer(result)) {
                    const resultStr = result.toString('utf8');
                    parsedResult = resultStr ? JSON.parse(resultStr) : {};
                } else if (typeof result === 'string' && result.trim()) {
                    parsedResult = JSON.parse(result);
                } else if (typeof result === 'object' && result !== null) {
                    parsedResult = result;
                } else {
                    parsedResult = {};
                }

                console.log('Parsed result:', parsedResult);
                if (Array.isArray(parsedResult)) {
                    medicines = parsedResult;
                } else if (parsedResult && typeof parsedResult === 'object') {
                    if (Object.keys(parsedResult).length > 0) {
                        medicines = [parsedResult];
                    }
                }
            } catch (parseError) {
                console.error('Failed to parse medicines:', parseError);
                medicines = [];
            }
        } else {
            console.log('No medicines found on the ledger, returning empty array');
        }

        console.log('Parsed medicines to send:', medicines);
        res.json(medicines);

    } catch (error) {
        console.error(`Failed to get all medicines: ${error.message}`, error.stack);
        res.status(500).json({ error: 'Internal server error while retrieving medicines', details: error.message });
    }
});

// Get medicines by manufacturer
app.get('/api/medicines/manufacturer/:manufacturer', async (req, res) => {
    try {
        const { manufacturer } = req.params;
        
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to get medicines by manufacturer
        const result = await contract.evaluateTransaction('GetMedicinesByManufacturer', manufacturer);

        // Disconnect from the gateway
        await gateway.disconnect();

        const medicines = JSON.parse(result.toString());
        res.json(medicines);

    } catch (error) {
        console.error(`Failed to get medicines by manufacturer: ${error}`);
        res.status(500).json({ error: `Failed to get medicines by manufacturer: ${error.message}` });
    }
});

// Get medicines by owner (for distributors)
app.get('/api/medicines/owner/:owner', async (req, res) => {
    try {
        const { owner } = req.params;
        
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to get medicines by owner
        const result = await contract.evaluateTransaction('GetMedicinesByOwner', owner);

        // Disconnect from the gateway
        await gateway.disconnect();

        const medicines = JSON.parse(result.toString());
        res.json(medicines);

    } catch (error) {
        console.error(`Failed to get medicines by owner: ${error}`);
        res.status(500).json({ error: `Failed to get medicines by owner: ${error.message}` });
    }
});

// Get flagged medicines (for regulators)
app.get('/api/medicines/flagged', async (req, res) => {
    try {
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to get flagged medicines
        const result = await contract.evaluateTransaction('GetFlaggedMedicines');

        // Disconnect from the gateway
        await gateway.disconnect();

        const medicines = JSON.parse(result.toString());
        res.json(medicines);

    } catch (error) {
        console.error(`Failed to get flagged medicines: ${error}`);
        res.status(500).json({ error: `Failed to get flagged medicines: ${error.message}` });
    }
});

// Verify medicine by QR code
app.get('/api/medicines/verify/:qrCode', async (req, res) => {
    try {
        const { qrCode } = req.params;
        
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to verify the medicine
        const result = await contract.evaluateTransaction('VerifyMedicine', qrCode);

        // Disconnect from the gateway
        await gateway.disconnect();

        const medicine = JSON.parse(result.toString());
        res.json(medicine);

    } catch (error) {
        console.error(`Failed to verify medicine: ${error}`);
        res.status(500).json({ error: `Failed to verify medicine: ${error.message}` });
    }
});

// Get medicine by ID endpoint
app.get('/api/medicines/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Attempting to get medicine with ID: ${id}`);

        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to get the medicine
        const result = await contract.evaluateTransaction('GetMedicine', id);
        
        // Disconnect from the gateway
        await gateway.disconnect();

        const medicine = JSON.parse(result.toString());
        res.json(medicine);

    } catch (error) {
        console.error(`Failed to get medicine: ${error}`);
        res.status(500).json({ error: `Failed to get medicine: ${error.message}` });
    }
});

// Create/register a new medicine
app.post('/api/medicines', async (req, res) => {
    try {
        const { id, name, manufacturer, batchNumber, manufacturingDate, expirationDate } = req.body;

        // Validate input
        if (!id || !name || !manufacturer || !batchNumber || !manufacturingDate || !expirationDate) {
            return res.status(400).json({ 
                error: 'All fields (id, name, manufacturer, batchNumber, manufacturingDate, expirationDate) are required' 
            });
        }

        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to register a medicine
        const result = await contract.submitTransaction(
            'RegisterMedicine', 
            id, 
            name, 
            manufacturer, 
            batchNumber, 
            manufacturingDate, 
            expirationDate
        );

        // Disconnect from the gateway
        await gateway.disconnect();

        const medicine = JSON.parse(result.toString());
        res.json({ 
            success: true, 
            message: `Medicine ${id} registered successfully`, 
            medicine 
        });

    } catch (error) {
        console.error(`Failed to register medicine: ${error}`);
        res.status(500).json({ error: `Failed to register medicine: ${error.message}` });
    }
});

// Update medicine supply chain
app.post('/api/medicines/:id/update', async (req, res) => {
    try {
        const { id } = req.params;
        const { handler, status, location, notes } = req.body;

        // Validate input
        if (!handler || !status || !location) {
            return res.status(400).json({ 
                error: 'Required fields (handler, status, location) are missing' 
            });
        }

        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to update supply chain
        const result = await contract.submitTransaction(
            'UpdateSupplyChain', 
            id, 
            handler, 
            status, 
            location, 
            notes || ''
        );

        // Disconnect from the gateway
        await gateway.disconnect();

        const medicine = JSON.parse(result.toString());
        res.json({ 
            success: true, 
            message: `Medicine ${id} supply chain updated successfully`, 
            medicine 
        });

    } catch (error) {
        console.error(`Failed to update medicine supply chain: ${error}`);
        res.status(500).json({ error: `Failed to update medicine supply chain: ${error.message}` });
    }
});

// Flag a medicine for issues
app.post('/api/medicines/:id/flag', async (req, res) => {
    try {
        const { id } = req.params;
        const { flaggedBy, reason, location } = req.body;

        // Validate input
        if (!flaggedBy || !reason || !location) {
            return res.status(400).json({ 
                error: 'Required fields (flaggedBy, reason, location) are missing' 
            });
        }

        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if we have the appUser identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            return res.status(400).json({ error: 'User "appUser" does not exist in the wallet' });
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('medicine-contract');

        // Submit the transaction to flag the medicine
        const result = await contract.submitTransaction(
            'FlagMedicine', 
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
            medicine 
        });

    } catch (error) {
        console.error(`Failed to flag medicine: ${error}`);
        res.status(500).json({ error: `Failed to flag medicine: ${error.message}` });
    }
});

// Serve static files (React frontend build and public folder)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'react-frontend', 'build')));

// Handle root route (serving React app)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all other non-API routes by serving the React app's index.html
app.get('*', (req, res) => {
    // Exclude API routes from this wildcard
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'react-frontend', 'build', 'index.html'));
    } else {
        res.status(404).send('API route not found');
    }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`FarmaTech API is now available with medicine-contract integration`);
});