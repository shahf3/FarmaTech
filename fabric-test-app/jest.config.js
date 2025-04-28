module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ["./jest.setup.js"],
};
