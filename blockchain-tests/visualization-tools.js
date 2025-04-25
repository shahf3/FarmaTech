const fs = require("fs");
const path = require("path");

// This script processes test result JSON files and generates HTML reports
// with visualizations for performance analysis

function findResultFiles(directory) {
  console.log(`Scanning directory: ${directory}`);
  const resultFiles = [];

  try {
    const files = fs.readdirSync(directory);
    console.log(`Found ${files.length} files in directory`);
    console.log("All files in directory:");
    files.forEach((file) => console.log(`  - ${file}`));
    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const filePath = path.join(directory, file);
        console.log(`Checking file: ${filePath}`);

        try {
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

          if (data.statistics && data.testConfiguration) {
            console.log(`✓ Valid test result found: ${file}`);
            resultFiles.push(filePath);
          } else {
            console.log(`✗ JSON file is not a test result: ${file}`);
          }
        } catch (error) {
          console.error(`Error processing file ${file}: ${error.message}`);
        }
      }
    });

    return resultFiles;
  } catch (error) {
    console.error(`Error reading directory ${directory}: ${error.message}`);
    return resultFiles;
  }
}

// Process a single result file
function processResultFile(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filename: path.basename(filePath),
      testName: data.testConfiguration.name,
      results: data,
      stats: data.statistics,
      timestamp: new Date(data.timestamps.start).toLocaleString(),
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
    return null;
  }
}

// Generate HTML report for a test result
function generateReport(resultData) {
  if (!resultData) return null;

  const data = resultData.results;
  const stats = resultData.stats;
  const reportFileName = `report-${path.basename(
    resultData.filename,
    ".json"
  )}.html`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blockchain Test Report - ${resultData.testName}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f7fa;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1, h2, h3 {
      color: #2c3e50;
      margin-top: 1.5em;
    }
    h1 {
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .stats-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px;
      flex: 1;
      min-width: 200px;
      border-left: 5px solid #3498db;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
      margin: 10px 0;
    }
    .stat-label {
      color: #7f8c8d;
      font-size: 14px;
      text-transform: uppercase;
    }
    .chart-container {
      margin: 30px 0;
      height: 400px;
    }
    .chart-row {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .chart-col {
      flex: 1;
      min-width: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    .error-summary {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px;
      margin-top: 30px;
      border-left: 5px solid #e74c3c;
    }
    .test-meta {
      display: flex;
      justify-content: space-between;
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .test-meta-item {
      margin-right: 20px;
    }
    .test-meta-label {
      font-weight: 600;
      margin-right: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Blockchain Stress Test Report</h1>
    
    <div class="test-meta">
      <div class="test-meta-item">
        <span class="test-meta-label">Test Profile:</span>
        <span>${resultData.testName}</span>
      </div>
      <div class="test-meta-item">
        <span class="test-meta-label">Date:</span>
        <span>${resultData.timestamp}</span>
      </div>
      <div class="test-meta-item">
        <span class="test-meta-label">Duration:</span>
        <span>${stats.duration.toFixed(2)} seconds</span>
      </div>
    </div>
    
    <h2>Performance Summary</h2>
    
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-label">Transactions Per Second</div>
        <div class="stat-value">${stats.tps.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value">${(
          (stats.successful / (stats.successful + stats.failed)) *
          100
        ).toFixed(2)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg. Latency</div>
        <div class="stat-value">${stats.latency.avg.toFixed(2)} ms</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">P95 Latency</div>
        <div class="stat-value">${stats.latency.p95.toFixed(2)} ms</div>
      </div>
    </div>
    
    <div class="chart-row">
      <div class="chart-col">
        <h3>Transaction Throughput</h3>
        <div class="chart-container">
          <canvas id="throughputChart"></canvas>
        </div>
      </div>
      <div class="chart-col">
        <h3>Latency Distribution</h3>
        <div class="chart-container">
          <canvas id="latencyChart"></canvas>
        </div>
      </div>
    </div>
    
    <h3>Detailed Statistics</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Total Transactions</td>
        <td>${stats.successful + stats.failed}</td>
      </tr>
      <tr>
        <td>Successful Transactions</td>
        <td>${stats.successful}</td>
      </tr>
      <tr>
        <td>Failed Transactions</td>
        <td>${stats.failed}</td>
      </tr>
      <tr>
        <td>Success Rate</td>
        <td>${(
          (stats.successful / (stats.successful + stats.failed)) *
          100
        ).toFixed(2)}%</td>
      </tr>
      <tr>
        <td>Transactions Per Second</td>
        <td>${stats.tps.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Minimum Latency</td>
        <td>${stats.latency.min.toFixed(2)} ms</td>
      </tr>
      <tr>
        <td>Average Latency</td>
        <td>${stats.latency.avg.toFixed(2)} ms</td>
      </tr>
      <tr>
        <td>Median Latency</td>
        <td>${stats.latency.median.toFixed(2)} ms</td>
      </tr>
      <tr>
        <td>95th Percentile Latency</td>
        <td>${stats.latency.p95.toFixed(2)} ms</td>
      </tr>
      <tr>
        <td>Maximum Latency</td>
        <td>${stats.latency.max.toFixed(2)} ms</td>
      </tr>
    </table>
    
    ${
      data.resourceUsage && data.resourceUsage.length > 0
        ? `
    <h3>Resource Utilization</h3>
    <div class="chart-container">
      <canvas id="resourceChart"></canvas>
    </div>
    `
        : ""
    }
    
    ${
      Object.keys(data.errors).length > 0
        ? `
    <div class="error-summary">
      <h3>Error Summary</h3>
      <table>
        <tr>
          <th>Error</th>
          <th>Count</th>
        </tr>
        ${Object.entries(data.errors)
          .map(
            ([error, count]) => `
        <tr>
          <td>${error}</td>
          <td>${count}</td>
        </tr>
        `
          )
          .join("")}
      </table>
    </div>
    `
        : ""
    }
    
    <h3>Test Configuration</h3>
    <pre>${JSON.stringify(data.testConfiguration, null, 2)}</pre>
  </div>
  
  <script>
    // Prepare throughput data
    const throughputData = ${JSON.stringify(data.throughputHistory || [])};
    const throughputTimestamps = throughputData.map(d => new Date(d.timestamp));
    const throughputValues = calculateRollingThroughput(throughputData, 10);
    
    // Prepare latency data
    const latencyData = ${JSON.stringify(data.latencyHistory || [])};
    const latencyTimestamps = latencyData.map(d => new Date(d.timestamp));
    const latencyValues = latencyData.map(d => d.value);
    
    // Create throughput chart
    const throughputCtx = document.getElementById('throughputChart').getContext('2d');
    new Chart(throughputCtx, {
      type: 'line',
      data: {
        labels: throughputTimestamps,
        datasets: [{
          label: 'Transactions per Second',
          data: throughputValues,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'second'
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'TPS'
            }
          }
        }
      }
    });
    
    // Create latency histogram
    const latencyBins = calculateHistogramBins(latencyValues, 15);
    const latencyCtx = document.getElementById('latencyChart').getContext('2d');
    new Chart(latencyCtx, {
      type: 'bar',
      data: {
        labels: latencyBins.map(bin => \`\${bin.min.toFixed(0)}-\${bin.max.toFixed(0)}\`),
        datasets: [{
          label: 'Frequency',
          data: latencyBins.map(bin => bin.count),
          backgroundColor: '#2ecc71',
          borderColor: '#27ae60',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Latency (ms)'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency'
            }
          }
        }
      }
    });
    
    ${
      data.resourceUsage && data.resourceUsage.length > 0
        ? `
    // Create resource utilization chart
    const resourceData = ${JSON.stringify(data.resourceUsage || [])};
    const resourceTimestamps = resourceData.map(d => new Date(d.timestamp));
    const cpuData = resourceData.map(d => (d.cpu.user + d.cpu.system) / 1000); // Convert to percentage
    const memoryData = resourceData.map(d => d.memory.heapUsed / 1024 / 1024); // Convert to MB
    
    const resourceCtx = document.getElementById('resourceChart').getContext('2d');
    new Chart(resourceCtx, {
      type: 'line',
      data: {
        labels: resourceTimestamps,
        datasets: [
          {
            label: 'CPU Usage (ms)',
            data: cpuData,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Memory Usage (MB)',
            data: memoryData,
            borderColor: '#9b59b6',
            backgroundColor: 'rgba(155, 89, 182, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'second'
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'CPU (ms)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Memory (MB)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
    `
        : ""
    }
    
    // Helper function to calculate rolling throughput
    function calculateRollingThroughput(data, windowSize) {
      if (!data || data.length === 0) return [];
      
      const result = [];
      const windowDuration = 1000; // 1 second window
      
      // Sort data by timestamp
      const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
      
      for (let i = 0; i < sortedData.length; i++) {
        const windowStart = sortedData[i].timestamp;
        const windowEnd = windowStart + windowDuration;
        
        // Count transactions in the window
        let count = 0;
        for (let j = i; j < sortedData.length && sortedData[j].timestamp < windowEnd; j++) {
          count += sortedData[j].value;
        }
        
        result.push(count);
      }
      
      return result;
    }
    
    // Helper function to calculate histogram bins
    function calculateHistogramBins(data, numBins) {
      if (!data || data.length === 0) return [];
      
      const min = Math.min(...data);
      const max = Math.max(...data);
      const binWidth = (max - min) / numBins;
      
      // Create bins
      const bins = [];
      for (let i = 0; i < numBins; i++) {
        bins.push({
          min: min + i * binWidth,
          max: min + (i + 1) * binWidth,
          count: 0
        });
      }
      
      // Count values in each bin
      data.forEach(value => {
        for (const bin of bins) {
          if (value >= bin.min && value < bin.max) {
            bin.count++;
            break;
          }
        }
      });
      
      return bins;
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(reportFileName, html);
  console.log(`Generated report: ${reportFileName}`);

  return reportFileName;
}

function generateSummaryReport(processedResults) {
  const reportFileName = "test-results-summary.html";

  processedResults.sort(
    (a, b) =>
      new Date(b.results.timestamps.start) -
      new Date(a.results.timestamps.start)
  );

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blockchain Test Results Summary</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f7fa;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      margin-top: 0;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .success-rate {
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: 600;
    }
    .high {
      background-color: #e6f7e9;
      color: #27ae60;
    }
    .medium {
      background-color: #fcf7e6;
      color: #f39c12;
    }
    .low {
      background-color: #f9e6e6;
      color: #e74c3c;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Blockchain Test Results Summary</h1>
    
    <p>Generated on ${new Date().toLocaleString()}</p>
    
    <table>
      <tr>
        <th>Test Name</th>
        <th>Date</th>
        <th>TPS</th>
        <th>Avg Latency</th>
        <th>Success Rate</th>
        <th>Report</th>
      </tr>
      ${processedResults
        .map((result) => {
          const stats = result.stats;
          const successRate = (
            (stats.successful / (stats.successful + stats.failed)) *
            100
          ).toFixed(2);
          let successClass = "high";
          if (successRate < 90) successClass = "medium";
          if (successRate < 70) successClass = "low";

          return `
      <tr>
        <td>${result.testName}</td>
        <td>${new Date(result.results.timestamps.start).toLocaleString()}</td>
        <td>${stats.tps.toFixed(2)}</td>
        <td>${stats.latency.avg.toFixed(2)} ms</td>
        <td><span class="success-rate ${successClass}">${successRate}%</span></td>
        <td><a href="${path.basename(
          result.reportFile
        )}" target="_blank">View Report</a></td>
      </tr>
      `;
        })
        .join("")}
    </table>
    
    <h2>Performance Comparison</h2>
    <div class="chart-container" style="height: 400px; margin: 30px 0;">
      <canvas id="comparisonChart"></canvas>
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    // Create comparison chart
    const testNames = ${JSON.stringify(
      processedResults.map((r) => r.testName)
    )};
    const tpsValues = ${JSON.stringify(
      processedResults.map((r) => r.stats.tps)
    )};
    const latencyValues = ${JSON.stringify(
      processedResults.map((r) => r.stats.latency.avg)
    )};
    
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: testNames,
        datasets: [
          {
            label: 'Transactions Per Second',
            data: tpsValues,
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Average Latency (ms)',
            data: latencyValues,
            backgroundColor: 'rgba(231, 76, 60, 0.7)',
            borderColor: 'rgba(231, 76, 60, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'TPS'
            },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Latency (ms)'
            },
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;

  // Write the HTML file
  fs.writeFileSync(reportFileName, html);
  console.log(`Generated summary report: ${reportFileName}`);

  return reportFileName;
}

// Main function
function main() {
  console.log("Blockchain Test Results Visualization Tool");
  const resultsDir = process.argv[2] || ".";
  console.log(`Looking for test results in: ${resultsDir}`);

  // Find result files
  const resultFiles = findResultFiles(resultsDir);
  console.log(`Found ${resultFiles.length} test result files`);

  if (resultFiles.length === 0) {
    console.log("No test result files found.");
    return;
  }

  // Process each file and generate individual reports
  const processedResults = [];

  resultFiles.forEach((file) => {
    const result = processResultFile(file);
    if (result) {
      const reportFile = generateReport(result);
      if (reportFile) {
        result.reportFile = reportFile;
        processedResults.push(result);
      }
    }
  });

  // Generate summary report
  if (processedResults.length > 0) {
    generateSummaryReport(processedResults);
    console.log("\nAll reports generated successfully.");
    console.log(
      "Open test-results-summary.html in your browser to view the results."
    );
  } else {
    console.log("No reports were generated due to errors.");
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findResultFiles,
  processResultFile,
  generateReport,
  generateSummaryReport,
  main,
};
