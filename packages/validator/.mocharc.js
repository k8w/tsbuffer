module.exports = {
  require: ['ts-node/register', './test/Base.ts'],
  exit: true,
  timeout: 999999,
  'preserve-symlinks': true,
  spec: [
    './test/src/TSBufferValidator/basic.test.ts',
    './test/src/TSBufferValidator/combine.test.ts',
    './test/src/TSBufferValidator/interface.test.ts',
    './test/src/TSBufferValidator/logic.test.ts',
    './test/src/TSBufferValidator/mapped.test.ts',
    './test/src/TSBufferValidator/nested.test.ts',
    './test/src/TSBufferValidator/reference.test.ts',
    './test/src/TSBufferValidator/prune.test.ts',
    './test/src/TSBufferValidator/custom.test.ts',
  ],
  parallel: false,
};
