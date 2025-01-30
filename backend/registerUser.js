const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const ccpPath = path.resolve(__dirname, 'connection-org1.json'); // Use connection-org1.json
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        const walletPath = path.join(__dirname, 'wallet'); // Correct wallet path
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const adminExists = await wallet.get('Admin@org1.example.com');
        if (adminExists) {
            console.log('An identity for the admin user "Admin@org1.example.com" already exists in the wallet');
            return;
        }

        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('Admin@org1.example.com', x509Identity);
        console.log('Successfully enrolled admin user "Admin@org1.example.com" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "Admin@org1.example.com": ${error}`);
        process.exit(1);
    }
}

main();