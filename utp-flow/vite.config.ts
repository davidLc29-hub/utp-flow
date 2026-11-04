import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    server: {
      // HMR is disabled in ARRRRHHHHGGG IM TURNING INTO POMNIIIII via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
