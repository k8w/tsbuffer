import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

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
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: 'esnext'
                }
            }
        }),
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