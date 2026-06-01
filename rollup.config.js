import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
  },
  external: (id) => {
    if (id.startsWith('node:')) return true;
    if (/^(@modelcontextprotocol\/sdk|effect|zod|ajv)/.test(id)) return true;
    return false;
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true,
    }),
    typescript({
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'bundler',
        rootDir: 'src',
        strict: false,
        noImplicitAny: false,
        esModuleInterop: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        lib: ['ES2022'],
      },
    }),
  ],
};
