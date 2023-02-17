const path = require('path')

module.exports = {
    require: [
        'ts-node/register',
        './test/Base.ts'
    ],
    exit: true,
    timeout: 999999,
    'preserve-symlinks': true,
    spec: [
        path.resolve(__dirname, './test/**/*.test.ts')        
    ]
}