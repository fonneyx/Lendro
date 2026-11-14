import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Serves api/scan.ts during `npm run dev` so the scanner works locally the same way it does on Vercel.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''));
      server.middlewares.use('/api/scan', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const { POST } = (await server.ssrLoadModule('/api/scan.ts')) as typeof import('./api/scan');
        const response = await POST(
          new Request('http://localhost/api/scan', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: Buffer.concat(chunks),
          }),
        );
        res.statusCode = response.status;
        res.setHeader('content-type', 'application/json');
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
});
