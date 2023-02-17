module.exports = {
    require: ['ts-node/register', './test/Base.ts'],
    recursive: true,
    exit: true,
    bail: true,
    timeout: 999999,
};
