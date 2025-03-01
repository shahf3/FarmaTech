// app.js
'use strict';

const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Middleware to parse JSON
app.use(express.json());

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
app.get('/api/assets', async (req, res) => {
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

        // Submit the transaction to get all assets
        const result = await contract.evaluateTransaction('GetAllAssets');

        // Disconnect from the gateway
        await gateway.disconnect();

        // Parse the result and send response
        const assets = JSON.parse(result.toString());
        res.json(assets);

    } catch (error) {
        console.error(`Failed to get all assets: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});