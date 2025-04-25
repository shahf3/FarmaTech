// jest.config.js
module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  verbose: true,
  testTimeout: 30000,
  // Setup for handling MongoDB models
  setupFilesAfterEnv: ["./jest.setup.js"],
};
