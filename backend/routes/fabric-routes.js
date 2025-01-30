const express = require('express');
const { connectToNetwork } = require('../fabricClient');

const router = express.Router();

router.get('/assets', async (req, res) => {
    try {
        const contract = await connectToNetwork();
        const result = await contract.evaluateTransaction('GetAllAssets');
        const assets = JSON.parse(result.toString());
        res.status(200).json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ error: error.toString() });
    }
});

router.post('/assets', async (req, res) => {
    try {
        const { id, color, size, owner, value } = req.body;
        const contract = await connectToNetwork();
        await contract.submitTransaction('CreateAsset', id, color, size, owner, value);
        res.status(201).json({ message: 'Asset created successfully' });
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ error: error.toString() });
    }
});

module.exports = router;
