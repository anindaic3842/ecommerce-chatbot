module.exports = {
    // Other Jest configurations
    reporters: [
      'default', // Keep the default Jest reporter
      ['jest-junit', { outputDirectory: './reports', outputName: 'jest-junit.xml' }],
    ],
    coverageDirectory: './coverage',
    collectCoverage: true,
    coverageReporters: ['html', 'text', 'lcov'],
  };