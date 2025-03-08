'use strict';

const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import the cors package

const app = express();
const PORT = process.env.PORT || 3000;

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
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

// Middleware to parse JSON
app.use(express.json());

// Define API endpoints before serving static files or wildcard routes
// Simple health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'UP' });
});

// Initialize the ledger with some assets
app.post('/api/init', async (req, res) => {
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
        const contract = network.getContract('basic');

        // Submit the transaction to initialize the ledger
        await contract.submitTransaction('InitLedger');

        // Disconnect from the gateway
        await gateway.disconnect();

        res.json({ success: true, message: 'Ledger initialized successfully' });

    } catch (error) {
        console.error(`Failed to initialize ledger: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Get all assets endpoint
// Get all assets endpoint
app.get('/api/assets', async (req, res) => {
    try {
        console.log('Attempting to get all assets...');
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
        // Remove or replace network.getName() since it’s causing the error
        console.log('Connected to network for channel:', 'mychannel'); // Use the channel name directly

        // Get the contract from the network
        const contract = network.getContract('basic');
        // Check if contract.getName() exists before calling it (optional, for consistency)
        const contractName = contract.getName ? contract.getName() : 'basic';
        console.log('Retrieved contract:', contractName);

        // Submit the transaction to get all assets
        console.log('Calling GetAllAssets transaction...');
        const result = await contract.evaluateTransaction('GetAllAssets');
        console.log('Transaction result (raw):', result ? (result.toString() || 'No result') : 'No result');

        // Disconnect from the gateway
        await gateway.disconnect();
        console.log('Disconnected from gateway');

        // Parse the result and ensure we return a JSON array, handling buffers or invalid data
        let assets = [];
        if (result) {
            try {
                let parsedResult;
                if (Buffer.isBuffer(result)) {
                    // If result is a Buffer (common in Fabric), convert to string and parse
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
                // Handle different possible response formats from the contract
                if (Array.isArray(parsedResult)) {
                    assets = parsedResult; // If it’s already an array, use it
                } else if (parsedResult && typeof parsedResult === 'object') {
                    // Check for common object structures (e.g., { assets: [] }, { result: [] }, single object)
                    if (parsedResult.assets && Array.isArray(parsedResult.assets)) {
                        assets = parsedResult.assets; // Use the 'assets' array if it exists
                    } else if (parsedResult.result && Array.isArray(parsedResult.result)) {
                        assets = parsedResult.result; // Handle if the contract returns { result: [] }
                    } else if (Object.keys(parsedResult).length > 0) {
                        console.warn('Unexpected object format, converting to array:', parsedResult);
                        assets = [parsedResult]; // Convert single object to array if applicable
                    } else {
                        console.warn('Empty or unexpected object format, defaulting to empty array');
                    }
                } else {
                    console.warn('Non-object response, defaulting to empty array:', parsedResult);
                }
            } catch (parseError) {
                console.error('Failed to parse assets:', parseError);
                assets = []; // Default to empty array on parse error
            }
        } else {
            console.log('No assets found on the ledger, returning empty array');
        }

        console.log('Parsed assets to send:', assets);
        res.json(assets); // Always return a JSON array (or empty array)

    } catch (error) {
        console.error(`Failed to get all assets: ${error.message}`, error.stack);
        res.status(500).json({ error: 'Internal server error while retrieving assets', details: error.message });
    }
});

// Create a new asset endpoint
app.post('/api/assets', async (req, res) => {
    try {
        const { id, color, size, owner, value } = req.body;

        // Validate input
        if (!id || !color || !size || !owner || !value) {
            return res.status(400).json({ error: 'All fields (id, color, size, owner, value) are required' });
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
        const contract = network.getContract('basic');

        // Submit the transaction to create an asset
        await contract.submitTransaction('CreateAsset', id, color, size.toString(), owner, value.toString());

        // Disconnect from the gateway
        await gateway.disconnect();

        res.json({ success: true, message: `Asset ${id} created successfully` });

    } catch (error) {
        console.error(`Failed to create asset: ${error}`);
        res.status(500).json({ error: `Failed to create asset: ${error.message}` });
    }
});

// Update an existing asset endpoint
app.put('/api/assets/:id', async (req, res) => {
    try {
        const { id } = req.params; // Get the asset ID from the URL
        const { color, size, owner, value } = req.body; // Get updated fields from the request body

        // Validate input
        if (!color || !size || !owner || !value) {
            return res.status(400).json({ error: 'All fields (color, size, owner, value) are required to update an asset' });
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
        const contract = network.getContract('basic');

        // Submit the transaction to update the asset
        await contract.submitTransaction('UpdateAsset', id, color, size.toString(), owner, value.toString());

        // Disconnect from the gateway
        await gateway.disconnect();

        res.json({ success: true, message: `Asset ${id} updated successfully` });

    } catch (error) {
        console.error(`Failed to update asset: ${error}`);
        res.status(500).json({ error: `Failed to update asset: ${error.message}` });
    }
});

// Delete an existing asset endpoint
app.delete('/api/assets/:id', async (req, res) => {
    try {
        const { id } = req.params; // Get the asset ID from the URL

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
        const contract = network.getContract('basic');

        // Submit the transaction to delete the asset
        await contract.submitTransaction('DeleteAsset', id);

        // Disconnect from the gateway
        await gateway.disconnect();

        res.json({ success: true, message: `Asset ${id} deleted successfully` });

    } catch (error) {
        console.error(`Failed to delete asset: ${error}`);
        res.status(500).json({ error: `Failed to delete asset: ${error.message}` });
    }
});

// Serve static files (React frontend build and public folder) after API routes
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'react-frontend', 'build')));

// Handle root route (serving React app) after API routes
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
});