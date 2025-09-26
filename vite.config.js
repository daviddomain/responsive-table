// vite.config.js
import { defineConfig } from 'vite';
import terser from '@rollup/plugin-terser';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';
  const isSite = mode === 'site'; // npm run build -m site

  return {
    base: isSite ? './' : undefined,

    publicDir: isLib ? false : 'public',

    build: isLib
      ? {
          outDir: 'dist',
          lib: { entry: 'src/ResponsiveTable.js', name: 'ResponsiveTable' },
          rollupOptions: {
            output: [
              { format: 'es', entryFileNames: 'responsive-table.js' },
              {
                format: 'es',
                entryFileNames: 'responsive-table.min.js',
                plugins: [terser({ module: true, compress: { passes: 2 }, mangle: true })],
              },
            ],
          },
        }
      : {
          outDir: 'docs',
          minify: 'esbuild',
          emptyOutDir: false,
        },
  };
});