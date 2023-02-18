module.exports = {
    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
        'src/**/*.{js,ts}'
    ],

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: [
        '/dist/',
        '\\.d\\.ts$',
        'src/utils/ErrorMapper.ts'
    ],

    // An array of directory names to be searched recursively up from the requiring module's location
    moduleDirectories: [
        'node_modules',
        'src'
    ],

    // A preset that is used as a base for Jest's configuration
    preset: 'ts-jest',

    // The test environment that will be used for testing
    testEnvironment: 'screeps-jest',

    // The glob patterns Jest uses to detect test files
    testMatch: [
        '**/*.spec.ts',
        '!**/node_modules/**',
        '!**/dist/**'
    ],
    "transform": {
        "^.+\\.[tj]s$": "ts-jest"
      },
      "transformIgnorePatterns": [
        "<rootDir>/node_modules/(?!base32768)"
      ],
      "globals": {
        "ts-jest": {
          "tsconfig": {
            "allowJs": true
          }
        }
      }
};
