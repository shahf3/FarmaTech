const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, './connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Get CA info and caName
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caName = caInfo.caName;  // Get the caName from the config

        // Check if caName is defined.  If not, throw an error.
        if (!caName) {
            throw new Error("caName is not defined in connection-org1.json for ca.org1.example.com");
        }

        // CA TLS certs (important!)
        const caTLSCACerts = caInfo.tlsCACerts.pem;  // Make sure .pem exists

        // Create a new CA client
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caName);

        // Create a new file system based wallet
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check if the admin user already exists
        const adminIdentity = await wallet.get('admin');
        if (adminIdentity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        if (error.errors && error.errors.length > 0) {
            console.error("CA Errors:", error.errors); // Log CA specific errors
        }
        if (error.message.includes("connect ECONNREFUSED")) {
          console.error("Check if your Fabric network (especially the CA) is running and reachable on port 7054.");
        }
        process.exit(1);
    }
}

main();