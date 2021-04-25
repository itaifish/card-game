module.exports = {
    transform: { "^.+\\.ts?$": "ts-jest" },
    testEnvironment: "node",
    testRegex: "/tests/.*\\.(ts|tsx)$",
    silent: false,
    verbose: false,
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
