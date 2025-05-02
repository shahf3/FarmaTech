const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");
const os = require("os");

const CONNECTION_PROFILE_PATH =
  "../fabric-test-app/config/connection-org1.json";
const WALLET_PATH = "../fabric-test-app/wallet";
const IDENTITY = "admin";
const CHANNEL_NAME = "mychannel";
const CONTRACT_NAME = "medicine-contract";
const OUTPUT_DIR = "./test-results";

const registeredMedicineIds = new Set();
const attemptedMedicineIds = new Set();
let nextMedicineId = 1200;

const TEST_PROFILES = {
  registration: {
    name: "Medicine Registration Test",
    function: "RegisterMedicine",
    transactions: 50,
    concurrency: 5,
    rampUp: {
      enabled: true,
      initialRate: 5,
      maxRate: 20,
      stepSize: 5,
      stepDuration: 10000,
    },
  },

  // Supply chain update test - updates existing medicines
  supplyChain: {
    name: "Supply Chain Update Test",
    function: "UpdateSupplyChain",
    transactions: 50,
    concurrency: 5,
    preloadData: {
      enabled: true,
      count: 20,
    },
  },

  // Read-heavy test - mostly query operations
  queryHeavy: {
    name: "Query-Heavy Test",
    transactionMix: [
      { function: "GetMedicine", weight: 60 },
      { function: "GetAllMedicines", weight: 30 },
      { function: "GetFlaggedMedicines", weight: 10 },
    ],
    transactions: 100,
    concurrency: 10,
  },

  mixed: {
    name: "Mixed Workload Test",
    transactionMix: [
      { function: "RegisterMedicine", weight: 20 },
      { function: "UpdateSupplyChain", weight: 30 },
      { function: "GetMedicine", weight: 35 },
      { function: "GetAllMedicines", weight: 10 },
      { function: "FlagMedicine", weight: 5 },
    ],
    transactions: 60000,
    concurrency: 10000,
    preloadData: {
      enabled: true,
      count: 20,
    },
  },

  endurance: {
    name: "Endurance Test",
    transactionMix: [
      { function: "RegisterMedicine", weight: 10 },
      { function: "UpdateSupplyChain", weight: 40 },
      { function: "GetMedicine", weight: 50 },
    ],
    runDuration: 1 * 60 * 1000,
    transactions: 50,
    concurrency: 5,
    preloadData: {
      enabled: true,
      count: 20,
    },
    resourceMonitoring: {
      enabled: true,
      interval: 5000,
    },
  },
};

// Results tracking
class TestResults {
  constructor() {
    this.successful = 0;
    this.failed = 0;
    this.latencies = [];
    this.startTime = null;
    this.endTime = null;
    this.errors = {};
    this.throughputHistory = [];
    this.latencyHistory = [];
    this.resourceUsage = [];
    this.transactionCounts = {};

    console.log("TestResults initialized");
  }

  recordSuccess(latency, txType) {
    this.successful++;
    this.latencies.push(latency);

    const timestamp = Date.now();
    this.throughputHistory.push({ timestamp, value: 1 });
    this.latencyHistory.push({ timestamp, value: latency });
    if (txType) {
      this.transactionCounts[txType] =
        (this.transactionCounts[txType] || 0) + 1;
    }

    if (this.successful % 10 === 0) {
      console.log(`Recorded ${this.successful} successful transactions so far`);
    }
  }

  recordFailure(error, txType) {
    this.failed++;
    const errorMsg = error.message || "Unknown error";
    if (!this.errors[errorMsg]) {
      this.errors[errorMsg] = { count: 1, transactions: {} };
    } else {
      this.errors[errorMsg].count++;
    }

    if (txType) {
      if (!this.errors[errorMsg].transactions[txType]) {
        this.errors[errorMsg].transactions[txType] = 1;
      } else {
        this.errors[errorMsg].transactions[txType]++;
      }
    }

    console.log(
      `Recorded failure: ${errorMsg} for ${
        txType || "unknown transaction type"
      }`
    );
    console.log(`Total failures so far: ${this.failed}`);
  }

  recordResourceUsage() {
    const usage = {
      timestamp: Date.now(),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      system: {
        loadAvg: os.loadavg(),
        totalMem: os.totalmem(),
        freeMem: os.freemem(),
      },
    };
    this.resourceUsage.push(usage);
    console.log(
      `Recorded resource usage at ${new Date(usage.timestamp).toISOString()}`
    );
  }

  getStatistics() {
    console.log("Calculating statistics");
    const totalDuration = (this.endTime - this.startTime) / 1000;

    if (this.latencies.length === 0) {
      console.log("No successful transactions, returning empty stats");
      return {
        duration: totalDuration,
        successful: this.successful,
        failed: this.failed,
        tps: 0,
        latency: { avg: 0, min: 0, median: 0, max: 0, p95: 0 },
      };
    }

    const stats = {
      duration: totalDuration,
      successful: this.successful,
      failed: this.failed,
      tps: this.successful / totalDuration,
      latency: {
        avg: this.calculateAverage(this.latencies),
        min: Math.min(...this.latencies),
        median: this.calculateMedian(this.latencies),
        max: Math.max(...this.latencies),
        p95: this.calculatePercentile(this.latencies, 95),
      },
      transactionCounts: this.transactionCounts,
    };

    console.log(
      `Statistics calculated. Duration: ${totalDuration}s, TPS: ${stats.tps.toFixed(
        2
      )}`
    );
    return stats;
  }

  calculateAverage(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  }

  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  printResults() {
    console.log("Printing results");
    const stats = this.getStatistics();

    console.log("\n========== TEST RESULTS ==========");
    console.log(`Total time: ${stats.duration.toFixed(2)} seconds`);
    console.log(`Successful transactions: ${stats.successful}`);
    console.log(`Failed transactions: ${stats.failed}`);
    console.log(
      `Success rate: ${(
        (stats.successful / (stats.successful + stats.failed)) *
        100
      ).toFixed(2)}%`
    );
    console.log(`Transactions per second: ${stats.tps.toFixed(2)}`);
    console.log(`Latency (avg): ${stats.latency.avg.toFixed(2)} ms`);
    console.log(`Latency (min): ${stats.latency.min.toFixed(2)} ms`);
    console.log(`Latency (median): ${stats.latency.median.toFixed(2)} ms`);
    console.log(`Latency (max): ${stats.latency.max.toFixed(2)} ms`);
    console.log(`Latency (p95): ${stats.latency.p95.toFixed(2)} ms`);
    console.log("\nTransaction type breakdown:");
    for (const [txType, count] of Object.entries(this.transactionCounts)) {
      console.log(`  ${txType}: ${count} transactions`);
    }

    // Log error summary
    console.log("\nError summary:");
    if (Object.keys(this.errors).length === 0) {
      console.log("  No errors recorded");
    } else {
      for (const [errorMsg, errorData] of Object.entries(this.errors)) {
        console.log(`  ${errorMsg}: ${errorData.count} occurrences`);

        if (Object.keys(errorData.transactions).length > 0) {
          console.log(`    By transaction type:`);
          for (const [txType, count] of Object.entries(
            errorData.transactions
          )) {
            console.log(`      ${txType}: ${count} occurrences`);
          }
        }
      }
    }

    return stats;
  }

  saveToFile(filename, testProfile) {
    console.log(`Attempting to save results to: ${filename}`);
    try {
      console.log(`Ensuring output directory exists: ${OUTPUT_DIR}`);
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}`);
      }

      const stats = this.getStatistics();
      const results = {
        testConfiguration: testProfile,
        statistics: stats,
        errors: this.errors,
        timestamps: {
          start: this.startTime,
          end: this.endTime,
        },
        throughputHistory: this.reduceSamples(this.throughputHistory),
        latencyHistory: this.reduceSamples(this.latencyHistory),
        resourceUsage: this.resourceUsage,
        transactionCounts: this.transactionCounts,
        environment: {
          os: process.platform,
          nodeVersion: process.version,
          numCpus: os.cpus().length,
          totalMemory: os.totalmem(),
        },
      };

      console.log(`Writing file to: ${filename}`);
      fs.writeFileSync(filename, JSON.stringify(results, null, 2));

      if (fs.existsSync(filename)) {
        const stats = fs.statSync(filename);
        console.log(
          `Results file created successfully. Size: ${stats.size} bytes`
        );
      } else {
        console.error(`Failed to create results file at ${filename}`);
      }

      console.log(`\nResults saved to ${filename}`);
    } catch (saveError) {
      console.error(`Error saving results: ${saveError.message}`);
      console.error(saveError.stack);
    }
  }

  // Reduce number of samples for smoother visualization
  reduceSamples(samples, maxSamples = 100) {
    if (samples.length <= maxSamples) return samples;

    const result = [];
    const step = Math.floor(samples.length / maxSamples);

    for (let i = 0; i < samples.length; i += step) {
      const chunk = samples.slice(i, i + step);
      const avgValue =
        chunk.reduce((sum, item) => sum + item.value, 0) / chunk.length;
      result.push({ timestamp: chunk[0].timestamp, value: avgValue });
    }

    return result;
  }
}

// Transaction Generator
class TransactionGenerator {
  constructor(contract, profile) {
    this.contract = contract;
    this.profile = profile;
    this.medicineIdPool = [];
    this.populateMedicineIdPool(50);

    console.log("TransactionGenerator initialized");
    console.log(`Transaction profile: ${profile.name}`);
    console.log(`Pre-generated ${this.medicineIdPool.length} medicine IDs`);
  }

  populateMedicineIdPool(count) {
    for (let i = 0; i < count; i++) {
      const id = `MED-${nextMedicineId++}`;
      this.medicineIdPool.push(id);
    }
  }

  async generateTransaction() {
    try {
      console.log("Generating transaction");
      if (this.profile.transactionMix) {
        const txType = this.selectByWeight(this.profile.transactionMix);
        console.log(`Selected transaction type by weight: ${txType}`);
        return this.executeTransaction(txType);
      }
      console.log(`Using single function: ${this.profile.function}`);
      return this.executeTransaction(this.profile.function);
    } catch (error) {
      console.error(`Error generating transaction: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  selectByWeight(transactionMix) {
    const totalWeight = transactionMix.reduce((sum, tx) => sum + tx.weight, 0);
    let random = Math.random() * totalWeight;

    for (const tx of transactionMix) {
      if (random < tx.weight) {
        return tx.function;
      }
      random -= tx.weight;
    }

    return transactionMix[0].function;
  }

  async executeTransaction(txType) {
    const medicineId = this.selectAppropriateId(txType);
    console.log(
      `Executing transaction ${txType} with medicine ID ${medicineId}`
    );

    try {
      let result;
      switch (txType) {
        case "RegisterMedicine":
          result = await this.registerMedicine(medicineId);
          break;
        case "UpdateSupplyChain":
          result = await this.updateSupplyChain(medicineId);
          break;
        case "GetMedicine":
          result = await this.getMedicine(medicineId);
          break;
        case "GetAllMedicines":
          result = await this.getAllMedicines();
          break;
        case "GetFlaggedMedicines":
          result = await this.getFlaggedMedicines();
          break;
        case "FlagMedicine":
          result = await this.flagMedicine(medicineId);
          break;
        default:
          throw new Error(`Unknown transaction type: ${txType}`);
      }
      console.log(`Transaction ${txType} completed successfully`);
      return { result, txType };
    } catch (error) {
      console.error(`Transaction ${txType} failed: ${error.message}`);
      console.error(error.stack);
      error.txType = txType;
      throw error;
    }
  }

  selectAppropriateId(txType) {
    if (txType === "RegisterMedicine") {
      if (this.medicineIdPool.length === 0) {
        this.populateMedicineIdPool(20);
      }
      const newId = this.medicineIdPool.shift();
      attemptedMedicineIds.add(newId);
      return newId;
    }

    if (registeredMedicineIds.size > 0) {
      const existingIds = Array.from(registeredMedicineIds);
      return existingIds[Math.floor(Math.random() * existingIds.length)];
    }

    if (attemptedMedicineIds.size > 0) {
      const attemptedIds = Array.from(attemptedMedicineIds);
      return attemptedIds[Math.floor(Math.random() * attemptedIds.length)];
    }

    if (this.medicineIdPool.length === 0) {
      this.populateMedicineIdPool(10);
    }
    const newId = this.medicineIdPool.shift();
    attemptedMedicineIds.add(newId);
    return newId;
  }

  async registerMedicine(medicineId) {
    console.log(`Registering medicine ${medicineId}`);
    const name = `Test Medicine ${medicineId}`;
    const manufacturer = "Pfizer";
    const batchNumber = `BATCH-${medicineId.substring(4)}`;
    const manufacturingDate = "2025-04-01";
    const expirationDate = "2028-04-01";
    const registrationLocation = "Dublin, Ireland";
    const timestamp = new Date().toISOString();

    try {
      try {
        console.log(`Checking if medicine ${medicineId} already exists`);
        await this.contract.evaluateTransaction("GetMedicine", medicineId);
        console.log(
          `Medicine ${medicineId} already exists. Skipping registration.`
        );
        return { status: "exists", id: medicineId };
      } catch (error) {
        // Medicine doesn't exist, proceed with registration
        if (error.message.includes("does not exist")) {
          console.log(
            `Medicine ${medicineId} does not exist, proceeding with registration`
          );
          const result = await this.contract.submitTransaction(
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

          registeredMedicineIds.add(medicineId);
          console.log(`Successfully registered medicine ${medicineId}`);
          return { status: "registered", id: medicineId, result };
        } else {
          console.error(`Error checking medicine existence: ${error.message}`);
          throw error;
        }
      }
    } catch (error) {
      // Handle duplicate registration error gracefully
      if (error.message.includes("already exists")) {
        registeredMedicineIds.add(medicineId);
        console.log(
          `Medicine ${medicineId} already registered (caught in error).`
        );
        return { status: "exists", id: medicineId };
      }
      console.error(
        `Failed to register medicine ${medicineId}: ${error.message}`
      );
      console.error(error.stack);
      throw error;
    }
  }

  async updateSupplyChain(medicineId) {
    console.log(`Updating supply chain for medicine ${medicineId}`);
    try {
      console.log(`Retrieving medicine ${medicineId} for update`);
      const medicineJSON = await this.contract.evaluateTransaction(
        "GetMedicine",
        medicineId
      );
      const medicine = JSON.parse(medicineJSON.toString());
      const handler = medicine.manufacturer || "Pfizer";
      const status = "In Distribution";
      const location = "Dublin, Ireland";
      const notes = "Stress test supply chain update";

      console.log(`Submitting UpdateSupplyChain transaction for ${medicineId}`);
      const result = await this.contract.submitTransaction(
        "UpdateSupplyChain",
        medicineId,
        handler,
        status,
        location,
        notes
      );

      console.log(`Successfully updated supply chain for ${medicineId}`);
      return { status: "updated", id: medicineId, result };
    } catch (error) {
      if (error.message.includes("does not exist")) {
        console.log(`Medicine ${medicineId} not found, registering it first`);
        try {
          await this.registerMedicine(medicineId);

          console.log(
            `Retrying UpdateSupplyChain for newly registered ${medicineId}`
          );
          const result = await this.contract.submitTransaction(
            "UpdateSupplyChain",
            medicineId,
            "Pfizer",
            "In Distribution",
            "Dublin, Ireland",
            "Stress test supply chain update"
          );

          console.log(`Registered and updated supply chain for ${medicineId}`);
          return { status: "created_and_updated", id: medicineId, result };
        } catch (registerError) {
          console.error(
            `Failed to register medicine ${medicineId} before update: ${registerError.message}`
          );
          console.error(registerError.stack);
          throw registerError;
        }
      }

      console.error(
        `Failed to update supply chain for ${medicineId}: ${error.message}`
      );
      console.error(error.stack);
      throw error;
    }
  }

  async getMedicine(medicineId) {
    console.log(`Getting medicine ${medicineId}`);
    try {
      try {
        console.log(`Attempting to retrieve medicine ${medicineId}`);
        const result = await this.contract.evaluateTransaction(
          "GetMedicine",
          medicineId
        );
        console.log(`Successfully retrieved medicine ${medicineId}`);
        return { status: "retrieved", id: medicineId, result };
      } catch (error) {
        if (error.message.includes("does not exist")) {
          console.log(
            `Medicine ${medicineId} not found, registering it first...`
          );
          await this.registerMedicine(medicineId);

          console.log(
            `Retrying GetMedicine for newly registered ${medicineId}`
          );
          const result = await this.contract.evaluateTransaction(
            "GetMedicine",
            medicineId
          );
          console.log(
            `Successfully retrieved newly registered medicine ${medicineId}`
          );
          return { status: "created_and_retrieved", id: medicineId, result };
        } else {
          console.error(`Error in GetMedicine: ${error.message}`);
          throw error;
        }
      }
    } catch (error) {
      console.error(`Error in getMedicine for ${medicineId}: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  async getAllMedicines() {
    console.log(`Getting all medicines`);
    try {
      const result = await this.contract.evaluateTransaction("GetAllMedicines");
      console.log(`Successfully retrieved all medicines`);

      try {
        const medicines = JSON.parse(result.toString());
        if (Array.isArray(medicines)) {
          medicines.forEach((medicine) => {
            if (medicine.id) {
              registeredMedicineIds.add(medicine.id);
            }
          });
          console.log(
            `Updated registry with ${medicines.length} medicines from GetAllMedicines`
          );
        }
      } catch (e) {
        console.warn(`Could not parse GetAllMedicines result: ${e.message}`);
      }

      return { status: "retrieved_all", result };
    } catch (error) {
      console.error(`Error in getAllMedicines: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  async getFlaggedMedicines() {
    console.log(`Getting flagged medicines`);
    try {
      const result = await this.contract.evaluateTransaction(
        "GetFlaggedMedicines"
      );
      console.log(`Successfully retrieved flagged medicines`);
      return { status: "retrieved_flagged", result };
    } catch (error) {
      console.error(`Error in getFlaggedMedicines: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  async flagMedicine(medicineId) {
    console.log(`Flagging medicine ${medicineId}`);
    try {
      console.log(`Checking if medicine ${medicineId} exists before flagging`);
      await this.contract.evaluateTransaction("GetMedicine", medicineId);
    } catch (error) {
      if (error.message.includes("does not exist")) {
        console.log(`Medicine ${medicineId} not found, registering it first`);
        await this.registerMedicine(medicineId);
      } else {
        console.error(`Error checking medicine existence: ${error.message}`);
        throw error;
      }
    }

    const flaggedBy = "QA Inspector";
    const reason = "Stress test flag";
    const location = "Dublin, Ireland";

    try {
      console.log(`Submitting FlagMedicine transaction for ${medicineId}`);
      const result = await this.contract.submitTransaction(
        "FlagMedicine",
        medicineId,
        flaggedBy,
        reason,
        location
      );

      console.log(`Successfully flagged medicine ${medicineId}`);
      return { status: "flagged", id: medicineId, result };
    } catch (error) {
      console.error(`Error flagging medicine ${medicineId}: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  async preloadData(count) {
    console.log(`Preloading ${count} medicines...`);
    let actuallyRegistered = 0;
    let alreadyExisting = 0;

    // Process in smaller batches to prevent timeout
    const batchSize = 5;
    const batches = Math.ceil(count / batchSize);

    for (let b = 0; b < batches; b++) {
      console.log(`Processing batch ${b + 1}/${batches}`);
      const batchPromises = [];

      for (let i = 0; i < batchSize && b * batchSize + i < count; i++) {
        const medicineId = `MED-${nextMedicineId++}`;
        attemptedMedicineIds.add(medicineId);

        batchPromises.push(
          (async () => {
            try {
              // Try to check if medicine exists
              try {
                console.log(
                  `Checking if medicine ${medicineId} already exists during preload`
                );
                await this.contract.evaluateTransaction(
                  "GetMedicine",
                  medicineId
                );
                console.log(
                  `Medicine ${medicineId} already exists during preload. Skipping.`
                );
                alreadyExisting++;
                registeredMedicineIds.add(medicineId);
                return { status: "exists", id: medicineId };
              } catch (queryError) {
                if (queryError.message.includes("does not exist")) {
                  console.log(
                    `Registering medicine ${medicineId} during preload`
                  );
                  await this.registerMedicine(medicineId);
                  actuallyRegistered++;
                  registeredMedicineIds.add(medicineId);
                  return { status: "registered", id: medicineId };
                } else {
                  console.error(
                    `Error checking medicine existence during preload: ${queryError.message}`
                  );
                  throw queryError;
                }
              }
            } catch (error) {
              if (error.message.includes("already exists")) {
                console.log(
                  `Medicine ${medicineId} already exists (caught in error) during preload. Skipping.`
                );
                alreadyExisting++;
                registeredMedicineIds.add(medicineId);
                return { status: "exists", id: medicineId };
              }
              console.error(
                `Error processing ${medicineId} during preload: ${error.message}`
              );
              console.error(error.stack);
              return { status: "error", id: medicineId, error: error.message };
            }
          })()
        );
      }

      console.log(`Waiting for batch ${b + 1} to complete`);
      await Promise.all(batchPromises);

      console.log(
        `Registered/Checked batch ${
          b + 1
        }/${batches}. Completed: ${actuallyRegistered}/${count}`
      );

      if (b < batches - 1) {
        console.log(`Delaying between batches`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `Preload complete: ${actuallyRegistered} medicines registered, ${alreadyExisting} already existed`
    );
    console.log(`Total known medicines: ${registeredMedicineIds.size}`);
    return Array.from(registeredMedicineIds);
  }
}

// Main Test Runner
class TestRunner {
  constructor(profileName) {
    this.profile = TEST_PROFILES[profileName];
    this.results = new TestResults();
    this.gateway = null;
    this.contract = null;
    this.isRunning = false;
    this.resourceMonitoringInterval = null;

    console.log(`TestRunner constructed for profile: ${profileName}`);
    console.log("Profile details:", JSON.stringify(this.profile, null, 2));
  }

  async initialize() {
    try {
      console.log("Initializing test runner...");
      const ccpPath = path.resolve(__dirname, CONNECTION_PROFILE_PATH);
      console.log(`Connection profile path: ${ccpPath}`);
      const fileExists = fs.existsSync(ccpPath);
      console.log(`Connection profile exists: ${fileExists}`);

      if (!fileExists) {
        throw new Error(`Connection profile not found at ${ccpPath}`);
      }

      console.log("Loading connection profile...");
      const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
      console.log("Connection profile loaded successfully");

      const walletPath = path.resolve(__dirname, WALLET_PATH);
      console.log(`Wallet path: ${walletPath}`);
      console.log(`Wallet exists: ${fs.existsSync(walletPath)}`);

      console.log("Creating wallet instance...");
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      console.log("Wallet instance created");

      console.log(`Checking if identity '${IDENTITY}' exists in wallet...`);
      const identity = await wallet.get(IDENTITY);

      if (!identity) {
        console.error(
          `Identity ${IDENTITY} not found in wallet at ${walletPath}`
        );
        throw new Error(`Identity ${IDENTITY} not found in wallet`);
      }

      console.log(`Identity ${IDENTITY} found in wallet`);

      try {
        if (!fs.existsSync(OUTPUT_DIR)) {
          fs.mkdirSync(OUTPUT_DIR, { recursive: true });
          console.log(`Created output directory: ${OUTPUT_DIR}`);
        }

        const testFilePath = path.join(OUTPUT_DIR, "initialization-test.json");
        fs.writeFileSync(
          testFilePath,
          JSON.stringify({
            test: "initialization",
            timestamp: new Date().toISOString(),
          })
        );
        console.log(`Successfully wrote test file: ${testFilePath}`);
      } catch (fileError) {
        console.error(
          `Error creating test file in output directory: ${fileError.message}`
        );
        console.error(fileError.stack);
      }

      console.log("Connecting to gateway...");
      this.gateway = new Gateway();

      try {
        await this.gateway.connect(ccp, {
          wallet,
          identity: IDENTITY,
          discovery: { enabled: true, asLocalhost: true },
          eventHandlerOptions: {
            strategy: null,
          },
          queryHandlerOptions: {
            timeout: 60,
          },
          transaction: {
            timeout: 120,
          },
        });
        console.log("Connected to gateway successfully");
      } catch (connectError) {
        console.error(`Error connecting to gateway: ${connectError.message}`);
        console.error(connectError.stack);
        throw connectError;
      }

      try {
        console.log(`Getting network: ${CHANNEL_NAME}`);
        const network = await this.gateway.getNetwork(CHANNEL_NAME);
        console.log(`Got network: ${CHANNEL_NAME}`);

        console.log(`Getting contract: ${CONTRACT_NAME}`);
        this.contract = network.getContract(CONTRACT_NAME);
        console.log(`Got contract: ${CONTRACT_NAME}`);
      } catch (networkError) {
        console.error(
          `Error getting network or contract: ${networkError.message}`
        );
        console.error(networkError.stack);
        throw networkError;
      }

      try {
        console.log("Testing contract with GetAllMedicines query...");
        const result = await this.contract.evaluateTransaction(
          "GetAllMedicines"
        );
        console.log(
          `Contract test successful, got ${result.length} bytes of data`
        );

        try {
          const medicines = JSON.parse(result.toString());
          console.log(`Found ${medicines.length} medicines in the ledger`);
        } catch (parseError) {
          console.warn(
            `Could not parse GetAllMedicines result: ${parseError.message}`
          );
        }
      } catch (testError) {
        console.error(`Error testing contract: ${testError.message}`);
        console.error(testError.stack);
      }

      console.log("Initialization completed successfully");
      return true;
    } catch (error) {
      console.error(`Failed to initialize test: ${error.message}`);
      console.error(error.stack);
      return false;
    }
  }

  async run() {
    console.log(`Starting test: ${this.profile.name}`);

    if (!(await this.initialize())) {
      console.error("Initialization failed, test cannot proceed");
      return false;
    }

    try {
      console.log("Creating transaction generator...");
      const txGenerator = new TransactionGenerator(this.contract, this.profile);

      // Preload data
      if (this.profile.preloadData && this.profile.preloadData.enabled) {
        console.log(`Preloading data: ${this.profile.preloadData.count} items`);
        await txGenerator.preloadData(this.profile.preloadData.count);
      }

      // Start timing
      this.results.startTime = Date.now();
      this.isRunning = true;
      console.log(
        `Test started at: ${new Date(this.results.startTime).toISOString()}`
      );

      if (
        this.profile.resourceMonitoring &&
        this.profile.resourceMonitoring.enabled
      ) {
        console.log(
          `Starting resource monitoring with interval: ${this.profile.resourceMonitoring.interval}ms`
        );
        this.startResourceMonitoring(this.profile.resourceMonitoring.interval);
      }

      // Determine number of transactions
      const numTransactions = this.profile.transactions || 100;
      console.log(`Planning to execute ${numTransactions} transactions`);
      const concurrency = this.profile.concurrency || 10;
      console.log(`Using concurrency level: ${concurrency}`);

      if (this.profile.rampUp && this.profile.rampUp.enabled) {
        console.log("Using ramp-up transaction pattern");
        await this.runRampUpTest(txGenerator, numTransactions);
      } else if (this.profile.runDuration) {
        console.log(`Using timed test pattern: ${this.profile.runDuration}ms`);
        await this.runTimedTest(
          txGenerator,
          this.profile.runDuration,
          concurrency
        );
      } else {
        console.log("Using fixed transaction count pattern");
        await this.runFixedTransactionTest(
          txGenerator,
          numTransactions,
          concurrency
        );
      }

      // Finish timing
      this.results.endTime = Date.now();
      this.isRunning = false;
      console.log(
        `Test completed at: ${new Date(this.results.endTime).toISOString()}`
      );
      console.log(
        `Test duration: ${
          (this.results.endTime - this.results.startTime) / 1000
        } seconds`
      );
      this.stopResourceMonitoring();
      const stats = this.results.printResults();
      console.log("Results printed");

      // Save results to file
      console.log("Saving results to file...");
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}`);
      }

      const timestamp = new Date().toISOString().replace(/:/g, "-");
      const filename = path.join(
        OUTPUT_DIR,
        `test-results-${this.profile.name
          .toLowerCase()
          .replace(/\s+/g, "-")}-${timestamp}.json`
      );

      console.log(`Results filename: ${filename}`);
      this.results.saveToFile(filename, this.profile);

      try {
        const backupFilename = path.join(
          OUTPUT_DIR,
          `latest-${this.profile.name.toLowerCase().replace(/\s+/g, "-")}.json`
        );
        fs.copyFileSync(filename, backupFilename);
        console.log(`Created backup copy of results at: ${backupFilename}`);
      } catch (backupError) {
        console.error(`Error creating backup file: ${backupError.message}`);
      }

      this.saveRegistryStatus();

      // Disconnect
      console.log("Disconnecting from gateway...");
      this.gateway.disconnect();
      console.log("Disconnected from gateway");

      return true;
    } catch (error) {
      console.error(`Test failed: ${error.message}`);
      console.error(error.stack);
      return false;
    } finally {
      this.isRunning = false;
      this.stopResourceMonitoring();
      if (this.gateway) {
        try {
          this.gateway.disconnect();
          console.log("Disconnected from gateway (in finally block)");
        } catch (disconnectError) {
          console.error(
            `Error disconnecting from gateway: ${disconnectError.message}`
          );
        }
      }
    }
  }
  saveRegistryStatus() {
    try {
      const registryData = {
        registeredIds: Array.from(registeredMedicineIds),
        attemptedIds: Array.from(attemptedMedicineIds),
        nextId: nextMedicineId,
        timestamp: new Date().toISOString(),
      };

      const registryPath = path.join(OUTPUT_DIR, "medicine-registry.json");
      fs.writeFileSync(registryPath, JSON.stringify(registryData, null, 2));
      console.log(`Medicine registry saved to ${registryPath}`);
    } catch (error) {
      console.warn(`Failed to save medicine registry: ${error.message}`);
      console.error(error.stack);
    }
  }

  loadRegistryStatus() {
    try {
      const registryPath = path.join(OUTPUT_DIR, "medicine-registry.json");
      if (fs.existsSync(registryPath)) {
        const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));

        const registryTime = new Date(data.timestamp);
        const now = new Date();
        const hoursDiff = (now - registryTime) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          data.registeredIds.forEach((id) => registeredMedicineIds.add(id));
          data.attemptedIds.forEach((id) => attemptedMedicineIds.add(id));
          nextMedicineId = Math.max(nextMedicineId, data.nextId);

          console.log(
            `Loaded medicine registry with ${registeredMedicineIds.size} known medicines`
          );
          return true;
        } else {
          console.log(
            `Registry data is too old (${hoursDiff.toFixed(
              1
            )} hours), starting fresh`
          );
        }
      }
    } catch (error) {
      console.warn(`Failed to load medicine registry: ${error.message}`);
      console.error(error.stack);
    }
    return false;
  }

  startResourceMonitoring(interval) {
    console.log(`Starting resource monitoring with interval ${interval}ms`);
    this.resourceMonitoringInterval = setInterval(() => {
      if (this.isRunning) {
        this.results.recordResourceUsage();
      }
    }, interval);
  }

  stopResourceMonitoring() {
    if (this.resourceMonitoringInterval) {
      console.log("Stopping resource monitoring");
      clearInterval(this.resourceMonitoringInterval);
      this.resourceMonitoringInterval = null;
    }
  }

  async runFixedTransactionTest(txGenerator, numTransactions, concurrency) {
    console.log(
      `Running fixed transaction test: ${numTransactions} transactions with concurrency ${concurrency}`
    );

    // Keep track of running transactions
    let completed = 0;
    let running = 0;
    let allStarted = false;

    while (completed < numTransactions || running > 0) {
      while (running < concurrency && completed + running < numTransactions) {
        running++;

        // Execute transaction asynchronously
        this.executeTransaction(txGenerator)
          .then(() => {
            running--;
            completed++;

            if (completed % 10 === 0 || completed === numTransactions) {
              console.log(
                `Progress: ${completed}/${numTransactions} transactions completed`
              );
            }
          })
          .catch((error) => {
            console.error(`Transaction failed: ${error.message}`);
            console.error(error.stack);
            running--;
            completed++;
          });
      }

      if (!allStarted && completed + running >= numTransactions) {
        allStarted = true;
        console.log(
          `All ${numTransactions} transactions started, waiting for completion...`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`Fixed transaction test completed: ${completed} transactions`);
  }

  async runTimedTest(txGenerator, duration, concurrency) {
    console.log(
      `Running timed test for ${duration}ms with concurrency ${concurrency}`
    );

    const endTime = Date.now() + duration;
    let running = 0;
    let completed = 0;
    let shouldContinue = true;

    // Start the timer
    setTimeout(() => {
      console.log(
        `Test duration (${duration}ms) reached, finishing remaining transactions...`
      );
      shouldContinue = false;
    }, duration);

    while (shouldContinue || running > 0) {
      while (running < concurrency && shouldContinue) {
        running++;
        this.executeTransaction(txGenerator)
          .then(() => {
            running--;
            completed++;

            // Log progress periodically
            if (completed % 10 === 0) {
              console.log(
                `Progress: ${completed} transactions completed, ${running} in progress`
              );
            }
          })
          .catch((error) => {
            console.error(`Transaction failed: ${error.message}`);
            running--;
            completed++;
          });
      }

      // Small delay to prevent tight loop
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `Timed test completed: ${completed} transactions in ${duration}ms`
    );
  }

  async runRampUpTest(txGenerator, numTransactions) {
    console.log(`Running ramp-up test: ${numTransactions} transactions`);

    const rampUp = this.profile.rampUp;
    let currentRate = rampUp.initialRate;
    const maxRate = rampUp.maxRate;
    const stepSize = rampUp.stepSize;
    const stepDuration = rampUp.stepDuration;

    let completed = 0;
    let running = 0;

    // Helper to calculate delay between transactions based on current rate
    const calcDelay = (rate) => Math.floor(1000 / rate);

    console.log(`Starting with rate: ${currentRate} TPS`);

    while (completed < numTransactions || running > 0) {
      const delay = calcDelay(currentRate);

      if (completed + running < numTransactions) {
        running++;

        this.executeTransaction(txGenerator)
          .then(() => {
            running--;
            completed++;
            if (completed % 10 === 0 || completed === numTransactions) {
              console.log(
                `Progress: ${completed}/${numTransactions} transactions completed at rate ${currentRate} TPS`
              );
            }
          })
          .catch((error) => {
            console.error(`Transaction failed: ${error.message}`);
            running--;
            completed++;
          });

        if (
          completed > 0 &&
          completed % stepSize === 0 &&
          currentRate < maxRate
        ) {
          currentRate = Math.min(currentRate + 1, maxRate);
          console.log(`Increased rate to ${currentRate} TPS`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`Ramp-up test completed: ${completed} transactions`);
  }

  async executeTransaction(txGenerator) {
    try {
      const startTime = Date.now();

      // Generate and execute the transaction
      const result = await txGenerator.generateTransaction();

      const endTime = Date.now();
      const latency = endTime - startTime;
      this.results.recordSuccess(latency, result.txType);

      return result;
    } catch (error) {
      this.results.recordFailure(error, error.txType);
      throw error;
    }
  }
}

// Main function to run from command line
async function main() {
  const profileName = process.argv[2];

  if (!profileName || !TEST_PROFILES[profileName]) {
    console.error(`Unknown test profile: ${profileName}`);
    console.error(
      `Available profiles: ${Object.keys(TEST_PROFILES).join(", ")}`
    );
    process.exit(1);
  }

  // Create and run test
  const testRunner = new TestRunner(profileName);

  try {
    console.log(`Running test profile: ${profileName}`);
    const success = await testRunner.run();

    if (!success) {
      console.error(`Test ${profileName} failed`);
      process.exit(1);
    }

    console.log(`Test ${profileName} completed successfully`);
  } catch (error) {
    console.error(`Error running test ${profileName}: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = {
  TestRunner,
  TransactionGenerator,
  TestResults,
  TEST_PROFILES,
};
