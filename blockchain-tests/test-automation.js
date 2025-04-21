#!/usr/bin/env node

// Blockchain Test Automation Script
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const TEST_PROFILES = [
  "registration",
  "supplyChain",
  "queryHeavy",
  "mixed",
  "endurance",
];

const settings = {
  outputDir: "./test-results",
  timeout: 10 * 60 * 1000,
  generateReports: true,
  runAll: false,
};

function parseArgs() {
  const args = process.argv.slice(2);
  let profiles = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--all") {
      settings.runAll = true;
    } else if (arg === "--no-reports") {
      settings.generateReports = false;
    } else if (arg === "--output-dir" && i + 1 < args.length) {
      settings.outputDir = args[++i];
    } else if (arg === "--timeout" && i + 1 < args.length) {
      settings.timeout = parseInt(args[++i]) * 1000;
    } else if (TEST_PROFILES.includes(arg)) {
      profiles.push(arg);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  // If no specific profiles provided and not --all, default to mixed
  if (profiles.length === 0 && !settings.runAll) {
    profiles = ["mixed"];
  }

  // If --all is specified, run all profiles
  if (settings.runAll) {
    profiles = [...TEST_PROFILES];
  }

  return profiles;
}

function printHelp() {
  console.log(`
Blockchain Test Automation Script

Usage: node test-automation.js [options] [test-profiles]

Options:
  --all                Run all test profiles
  --no-reports         Don't generate HTML reports
  --output-dir <dir>   Specify output directory for results (default: ./test-results)
  --timeout <seconds>  Specify timeout for each test in seconds (default: 600)
  --help, -h           Show this help message

Test Profiles:
  ${TEST_PROFILES.join(", ")}

Examples:
  node test-automation.js --all
  node test-automation.js registration supplyChain
  node test-automation.js mixed --timeout 300
  `);
}

function ensureOutputDir() {
  if (!fs.existsSync(settings.outputDir)) {
    fs.mkdirSync(settings.outputDir, { recursive: true });
    console.log(`Created output directory: ${settings.outputDir}`);
  }
}

// Run a single test
function runTest(profile) {
  return new Promise((resolve, reject) => {
    console.log(`\n========== RUNNING TEST: ${profile} ==========`);
    console.log(`Started at: ${new Date().toLocaleString()}`);

    const test = spawn("node", ["enhanced-tests.js", profile], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    const timeoutId = setTimeout(() => {
      console.log(
        `\n⚠️ Test ${profile} timed out after ${
          settings.timeout / 1000
        } seconds`
      );
      test.kill("SIGTERM");
      reject(new Error(`Test ${profile} timed out`));
    }, settings.timeout);

    test.on("close", (code) => {
      clearTimeout(timeoutId);

      if (code === 0) {
        console.log(`\n✅ Test ${profile} completed successfully`);
        resolve();
      } else {
        console.log(`\n❌ Test ${profile} failed with code ${code}`);
        reject(new Error(`Test ${profile} failed with code ${code}`));
      }
    });

    // Handle errors
    test.on("error", (err) => {
      clearTimeout(timeoutId);
      console.error(`\n❌ Error running test ${profile}: ${err.message}`);
      reject(err);
    });
  });
}

// Generate reports using the visualization tool
function generateReports() {
  return new Promise((resolve, reject) => {
    console.log("\n========== GENERATING REPORTS ==========");

    const reporter = spawn(
      "node",
      ["visualization-tools.js", settings.outputDir],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      }
    );

    reporter.on("close", (code) => {
      if (code === 0) {
        console.log("\n✅ Reports generated successfully");
        resolve();
      } else {
        console.log(`\n❌ Report generation failed with code ${code}`);
        reject(new Error("Report generation failed"));
      }
    });

    reporter.on("error", (err) => {
      console.error(`\n❌ Error generating reports: ${err.message}`);
      reject(err);
    });
  });
}

// Main function
async function main() {
  console.log("======== BLOCKCHAIN TEST AUTOMATION ========");
  const profiles = parseArgs();
  console.log(`Running test profiles: ${profiles.join(", ")}`);

  ensureOutputDir();

  const results = {
    success: [],
    failure: [],
  };

  // Run tests sequentially
  for (const profile of profiles) {
    try {
      await runTest(profile);
      results.success.push(profile);
    } catch (error) {
      console.error(`Error running test ${profile}: ${error.message}`);
      results.failure.push(profile);
    }
  }

  // Generate reports
  if (settings.generateReports) {
    try {
      await generateReports();
    } catch (error) {
      console.error(`Error generating reports: ${error.message}`);
    }
  }

  // Print summary
  console.log("\n========== TEST SUMMARY ==========");
  console.log(`Total tests: ${profiles.length}`);
  console.log(`Successful: ${results.success.length}`);
  console.log(`Failed: ${results.failure.length}`);

  if (results.success.length > 0) {
    console.log("\nSuccessful tests:");
    results.success.forEach((p) => console.log(`  - ${p}`));
  }

  if (results.failure.length > 0) {
    console.log("\nFailed tests:");
    results.failure.forEach((p) => console.log(`  - ${p}`));
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
