module.exports = {
    require: [
        'ts-node/register',
        './test/Base.ts'
    ],
    exit: true,
    bail: true,
    timeout: 999999,
    'preserve-symlinks': true,
    spec: [
        './test/**/*.test.ts',
    ],
    // fgrep: 'node_modules',
    parallel: false
}