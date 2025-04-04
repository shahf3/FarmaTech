const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

// Register and enroll user with Fabric CA
async function registerUserOnFabric(username, org) {
  try {
    const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new CA client for interacting with the CA
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if user already exists in the wallet
    const userIdentity = await wallet.get(username);
    if (userIdentity) {
      console.log(`An identity for the user ${username} already exists in the wallet`);
      return;
    }

    // Check if admin exists in wallet
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      throw new Error('Admin identity must exist in the wallet before registering users');
    }

    // Build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    // Register the user
    const secret = await ca.register({
      affiliation: `${org}.department1`,
      enrollmentID: username,
      role: 'client'
    }, adminUser);

    // Enroll the user
    const enrollment = await ca.enroll({
      enrollmentID: username,
      enrollmentSecret: secret
    });

    // Import the new identity into the wallet
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };
    
    await wallet.put(username, x509Identity);
    console.log(`Successfully registered and enrolled user ${username} and imported it into the wallet`);
  } catch (error) {
    console.error(`Failed to register user: ${error}`);
    throw error;
  }
}

module.exports = {
  registerUserOnFabric
};