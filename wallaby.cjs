  module.exports = function (wallaby) {
    return {
      files: [
        'src/**/*.ts',
        { pattern: 'test/files/*', binary: true, instrument: false }
      ],

      tests: [
        'test/specs/**/test.*.ts'
      ],
      env: {
        type: 'node'
      },
      testFramework: 'mocha'
    };
  };