import { terser } from 'rollup-plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const plugins = [nodeResolve(), typescript({sourceMap: true, tsconfig: './tsconfig.rollup.json' })]

export default [
  {
    plugins,
    input: 'src/a11y-dialog.ts',
    output: [
      {
        file: 'dist/a11y-dialog.js',
        format: 'esm',
        plugins: [terser()],
      },
    ],
  },
]
