const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const SecurityIncident = require('../models/SecurityIncident');

function isAuthorizedToScan(user, medicine) {
  // Regulators can scan any medicine
  if (user.role === 'regulator') {
    return true;
  }

  // Manufacturers can only scan their own medicines
  if (user.role === 'manufacturer') {
    return user.organization === medicine.manufacturer;
  }

  // Distributors can scan medicines they own or that are in transit to them
  if (user.role === 'distributor') {
    return user.organization === medicine.currentOwner || 
           (medicine.status === 'In Transit' && 
            medicine.supplyChain.some(entry => 
              entry.notes && entry.notes.includes(user.organization)));
  }

  if (user.role === 'enduser') {
    return medicine.status === 'Dispensed';
  }

  // By default, unauthorized
  return false;
}

async function flagMedicineForUnauthorizedAccess(medicineId, user, location) {
  try {
    const ccpPath = path.resolve(__dirname, "../config", "connection-org1.json");
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(__dirname, "../wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get("appUser");
    if (!identity) {
      throw new Error('User "appUser" does not exist in the wallet');
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("medicine-contract");

    // First, get the medicine to record its state before flagging
    // Using GetMedicine instead of VerifyMedicine
    const medicineBeforeResult = await contract.evaluateTransaction("GetMedicine", medicineId);
    const medicineBefore = JSON.parse(medicineBeforeResult.toString());

    // Create detailed flag reason
    const reason = `Unauthorized scan by ${user.role} (${user.username}) from ${user.organization}`;
    
    // Submit the transaction to flag the medicine
    const flagResult = await contract.submitTransaction(
      "FlagMedicine",
      medicineId,
      user.organization,
      reason,
      location || "Unknown location"
    );

    // Disconnect from gateway
    await gateway.disconnect();

    // Return the updated medicine
    return JSON.parse(flagResult.toString());
  } catch (error) {
    console.error(`Failed to flag medicine for unauthorized access: ${error}`);
    throw error;
  }
}

async function recordSecurityIncident(medicine, user, scanDetails) {
  try {
    const incident = new SecurityIncident({
      medicineId: medicine.id,
      medicineName: medicine.name,
      batchNumber: medicine.batchNumber,
      incidentType: 'unauthorized_scan',
      severity: determineSeverity(medicine, user),
      scanner: {
        userId: user.id,
        username: user.username,
        role: user.role,
        organization: user.organization
      },
      details: {
        location: scanDetails.location || 'Unknown location',
        ipAddress: scanDetails.ipAddress || 'Unknown',
        userAgent: scanDetails.userAgent || 'Unknown',
        notes: scanDetails.notes || `Unauthorized scan of ${medicine.name} detected`
      },
      medicineStatus: {
        beforeIncident: medicine.status,
        afterIncident: 'Flagged'
      },
      flaggedInBlockchain: true,
      timestamp: new Date()
    });

    await incident.save();
    
    console.log(`SECURITY ALERT: Unauthorized scan of medicine ${medicine.id} by ${user.username} (${user.organization})`);
    
    return incident;
  } catch (error) {
    console.error(`Failed to record security incident: ${error}`);
    return null;
  }
}

function determineSeverity(medicine, user) {
  if (medicine.controlledSubstance || medicine.highValue) {
    return 'critical';
  }
  
  if (user.role === 'distributor') {
    return 'high';
  }
  
  return 'medium';
}

module.exports = {
  isAuthorizedToScan,
  flagMedicineForUnauthorizedAccess,
  recordSecurityIncident
};