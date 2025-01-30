const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(bodyParser.json());

const ccpPath = path.resolve(__dirname, './connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

const ordererCertPath = './msp/ordererOrganizations/example.com/orderers/tls/server.crt';
const ordererCert = fs.readFileSync(ordererCertPath, 'utf8');

app.get('/api/health', async (req, res) => {
  let gateway;
  try {
    gateway = new Gateway();
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath); 

    const identity = await wallet.get('appUser');
    if (!identity) {
      console.log('An identity for the user appUser does not exist in the wallet');
      return res.status(500).send('User not found in wallet. Run registerUser.js and registerAppUser.js first.');
    }

    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true },
      tlsOptions: {
        trustedRoots: [Buffer.from(ordererCert)], 
      }
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('basic');

    res.status(200).send('Connected to Hyperledger Fabric');
  } catch (error) {
    console.error('Failed to connect to Hyperledger Fabric:', error);
    res.status(500).send('Failed to connect to Hyperledger Fabric: ' + error.message);
  } finally {
    if (gateway) { 
      gateway.disconnect(); 
    }
  }
});

app.get('/api/assets', async (req, res) => {
    let gateway;
    try {
      console.log('Initializing gateway...');
      gateway = new Gateway();
      const walletPath = path.join(__dirname, 'wallet');
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      console.log('Wallet path:', walletPath);
  
      const identity = await wallet.get('appUser');
      if (!identity) {
        console.log('Identity for appUser not found in wallet');
        return res.status(500).send('User not found in wallet. Run registerUser.js and registerAppUser.js first.');
      }
  
      console.log('Connecting to gateway...');
      await gateway.connect(ccp, {
        wallet,
        identity: 'appUser',
        discovery: { enabled: true, asLocalhost: true },
        tlsOptions: {
          trustedRoots: [Buffer.from(ordererCert)],
        }
      });
  
      console.log('Getting network...');
      const network = await gateway.getNetwork('mychannel');
      const contract = network.getContract('basic');
  
      console.log('Evaluating transaction...');
      const result = await contract.evaluateTransaction('GetAllAssets');
      const assets = JSON.parse(result.toString());
      console.log('Assets:', assets);
      res.status(200).json(assets);
    } catch (error) {
      console.error('Error in /api/assets:', error);
      res.status(500).json({ error: error.toString() });
    } finally {
      if (gateway) {
        console.log('Disconnecting gateway...');
        gateway.disconnect();
      }
    }
  });
// Similar pattern for other API endpoints (post '/api/assets', post '/transfer-asset') with 
// gateway initialization, error handling, and disconnection in finally block

app.use(express.static(path.join(__dirname, '../frontend/my-react-app/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/my-react-app/build', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    error: 'Something went wrong!',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});