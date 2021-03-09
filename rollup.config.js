import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

export default {
    input: './index.ts',
    output: [
        {
            format: 'cjs',
            file: './dist/index.cjs'
        },
        {
            format: 'es',
            file: './dist/index.mjs'
        }
    ],
    plugins: [
        typescript(),
        terser({
            mangle: {
                properties: {
                    regex: /^_/
                }
            },
            format: {
                comments: false
            },
        })
    ]
}