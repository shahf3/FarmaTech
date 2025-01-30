const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const ccp = JSON.parse(fs.readFileSync('./connection-org1.json', 'utf8'));

        // Setup the CA client
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new wallet for managing identities
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if appUser already exists
        const userExists = await wallet.get('appUser');
        if (userExists) {
            console.log('An identity for the user "appUser" already exists in the wallet');
            return;
        }

        // Check if admin exists
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user does not exist in the wallet');
            console.log('Run enrollAdmin.js first');
            return;
        }

        // Build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register the user
        const registerRequest = {
            enrollmentID: 'appUser',
            enrollmentSecret: 'appUserpw',
            role: 'client',
            affiliation: 'org1.department1'
        };
        
        await ca.register(registerRequest, adminUser);

        // Enroll the user
        const enrollment = await ca.enroll({
            enrollmentID: 'appUser',
            enrollmentSecret: 'appUserpw'
        });

        // Create the identity for the user and import it to the wallet
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('appUser', x509Identity);
        console.log('Successfully registered and enrolled user "appUser" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "appUser": ${error}`);
        process.exit(1);
    }
}

main();