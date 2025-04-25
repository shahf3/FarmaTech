// Stress Testing for Medicine Contract

const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");
const CONNECTION_PROFILE_PATH =
  "../fabric-test-app/config/connection-org1.json";
const WALLET_PATH = "../fabric-test-app/wallet";
const IDENTITY = "admin";
const CHANNEL_NAME = "mychannel";
const CONTRACT_NAME = "medicine-contract";

// Test parameters
const TEST_CONFIG = {
  numTransactions: 1000,
  concurrentTransactions: 20,
  transactionType: "RegisterMedicine",
  delayBetweenBatches: 500,
  logFrequency: 100,
};

// Results tracking
const results = {
  successful: 0,
  failed: 0,
  latencies: [],
  startTime: null,
  endTime: null,
  errors: {},
};

// Main function
async function runStressTest() {
  try {
    console.log(
      `Starting stress test with ${TEST_CONFIG.numTransactions} total transactions...`
    );
    console.log(
      `Testing ${TEST_CONFIG.transactionType} with ${TEST_CONFIG.concurrentTransactions} concurrent transactions`
    );
    const ccpPath = path.resolve(__dirname, CONNECTION_PROFILE_PATH);
    const fileExists = fs.existsSync(ccpPath);
    if (!fileExists) {
      throw new Error(`Connection profile not found at ${ccpPath}`);
    }
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Load wallet
    const walletPath = path.resolve(__dirname, WALLET_PATH);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if identity exists
    const identity = await wallet.get(IDENTITY);
    if (!identity) {
      throw new Error(`Identity ${IDENTITY} not found in wallet`);
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: IDENTITY,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CONTRACT_NAME);
    results.startTime = Date.now();

    const batches = Math.ceil(
      TEST_CONFIG.numTransactions / TEST_CONFIG.concurrentTransactions
    );

    for (let i = 0; i < batches; i++) {
      const batchPromises = [];
      const batchSize = Math.min(
        TEST_CONFIG.concurrentTransactions,
        TEST_CONFIG.numTransactions - i * TEST_CONFIG.concurrentTransactions
      );

      console.log(
        `Executing batch ${i + 1}/${batches} with ${batchSize} transactions`
      );

      // Create concurrent transaction promises
      for (let j = 0; j < batchSize; j++) {
        const txId = `MED-${i * TEST_CONFIG.concurrentTransactions + j}`;
        batchPromises.push(executeTransaction(contract, txId));
      }

      await Promise.all(batchPromises);

      if ((i + 1) % Math.ceil(batches / 10) === 0 || i === batches - 1) {
        const progress = Math.min(100, Math.round(((i + 1) * 100) / batches));
        const completed = Math.min(
          TEST_CONFIG.numTransactions,
          (i + 1) * TEST_CONFIG.concurrentTransactions
        );
        console.log(
          `Progress: ${progress}% (${completed}/${TEST_CONFIG.numTransactions} transactions)`
        );
        console.log(
          `Success: ${results.successful}, Failed: ${results.failed}`
        );
      }

      if (i < batches - 1 && TEST_CONFIG.delayBetweenBatches > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, TEST_CONFIG.delayBetweenBatches)
        );
      }
    }

    // Finish timing
    results.endTime = Date.now();
    const totalDuration = (results.endTime - results.startTime) / 1000;

    // Calculate statistics
    const avgLatency =
      results.latencies.reduce((sum, val) => sum + val, 0) /
      results.latencies.length;
    const maxLatency = Math.max(...results.latencies);
    const minLatency = Math.min(...results.latencies);
    const medianLatency = calculateMedian(results.latencies);
    const p95Latency = calculatePercentile(results.latencies, 95);
    const tps = results.successful / totalDuration;

    console.log("\n========== STRESS TEST RESULTS ==========");
    console.log(`Total time: ${totalDuration.toFixed(2)} seconds`);
    console.log(`Successful transactions: ${results.successful}`);
    console.log(`Failed transactions: ${results.failed}`);
    console.log(`Transactions per second: ${tps.toFixed(2)}`);
    console.log(`Latency (avg): ${avgLatency.toFixed(2)} ms`);
    console.log(`Latency (min): ${minLatency.toFixed(2)} ms`);
    console.log(`Latency (median): ${medianLatency.toFixed(2)} ms`);
    console.log(`Latency (max): ${maxLatency.toFixed(2)} ms`);
    console.log(`Latency (p95): ${p95Latency.toFixed(2)} ms`);

    // Log error summary
    console.log("\nError summary:");
    for (const [errorMsg, count] of Object.entries(results.errors)) {
      console.log(`  ${errorMsg}: ${count} occurrences`);
    }

    gateway.disconnect();
  } catch (error) {
    console.error(`Failed to run stress test: ${error}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function executeTransaction(contract, medicineId) {
  const startTime = Date.now();

  try {
    switch (TEST_CONFIG.transactionType) {
      case "RegisterMedicine":
        await registerMedicine(contract, medicineId);
        break;
      case "UpdateSupplyChain":
        await updateSupplyChain(contract, medicineId);
        break;
      case "GetMedicine":
        await getMedicine(contract, medicineId);
        break;
      case "GetAllMedicines":
        await getAllMedicines(contract);
        break;
      default:
        throw new Error(
          `Unknown transaction type: ${TEST_CONFIG.transactionType}`
        );
    }

    // Record successful transaction
    const endTime = Date.now();
    const latency = endTime - startTime;
    results.latencies.push(latency);
    results.successful++;

    if (results.successful % TEST_CONFIG.logFrequency === 0) {
      console.log(`Completed ${results.successful} successful transactions`);
    }
  } catch (error) {
    // Record failed transaction
    results.failed++;

    const errorMsg = error.message || "Unknown error";
    if (!results.errors[errorMsg]) {
      results.errors[errorMsg] = 1;
    } else {
      results.errors[errorMsg]++;
    }

    if (results.failed % TEST_CONFIG.logFrequency === 0) {
      console.log(`Failed ${results.failed} transactions`);
    }
  }
}

// Transaction implementations
async function registerMedicine(contract, medicineId) {
  const name = `Test Medicine ${medicineId}`;
  const manufacturer = "PharmaCo Ltd";
  const batchNumber = `BATCH-${medicineId}`;
  const manufacturingDate = "2025-04-01";
  const expirationDate = "2028-04-01";
  const registrationLocation = "Dublin, Ireland";
  const timestamp = new Date().toISOString();

  await contract.submitTransaction(
    "RegisterMedicine",
    medicineId,
    name,
    manufacturer,
    batchNumber,
    manufacturingDate,
    expirationDate,
    registrationLocation,
    timestamp
  );
}

async function updateSupplyChain(contract, medicineId) {
  // First check if the medicine exists, if not register it
  try {
    await contract.evaluateTransaction("GetMedicine", medicineId);
  } catch (error) {
    await registerMedicine(contract, medicineId);
  }

  const handler = "HSE Distribution Center";
  const status = "In Distribution";
  const location = "Dublin, Ireland";
  const notes = "Stress test update";

  await contract.submitTransaction(
    "UpdateSupplyChain",
    medicineId,
    handler,
    status,
    location,
    notes
  );
}

async function getMedicine(contract, medicineId) {
  try {
    await contract.evaluateTransaction("GetMedicine", medicineId);
  } catch (error) {
    await registerMedicine(contract, medicineId);
    await contract.evaluateTransaction("GetMedicine", medicineId);
  }
}

async function getAllMedicines(contract) {
  await contract.evaluateTransaction("GetAllMedicines");
}

// Helper functions
function calculateMedian(values) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

// Run the stress test
runStressTest().catch((error) => {
  console.error(`Error in stress test: ${error}`);
  process.exit(1);
});
