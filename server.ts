import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { createClient } from '@supabase/supabase-js';
import { environment } from './src/environments/environment';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // ---------- SITEMAP DINÁMICO (Fase 7) ----------
  // IMPORTANTE: debe registrarse ANTES de express.static y del catch-all
  // de Angular de más abajo -- Express resuelve rutas en el orden en que
  // se registran, así que si quedara después, esas rutas lo interceptarían
  // primero y /sitemap.xml nunca llegaría a ejecutarse.
  server.get('/sitemap.xml', async (req, res) => {
    try {
      const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
      const baseUrl = 'https://quebuscamijo.com';

      const { data: empresas } = await supabase
        .from('empresas')
        .select('id, alias, updated_at')
        .eq('estado', 'activo');

      const { data: publicaciones } = await supabase
        .from('publicaciones')
        .select('slug, updated_at')
        .eq('estado', 'activo');

      const urlsEstaticas: { loc: string; prioridad: string; lastmod?: string }[] = [
        { loc: baseUrl, prioridad: '1.0' },
        { loc: `${baseUrl}/resultados`, prioridad: '0.9' },
        { loc: `${baseUrl}/planes`, prioridad: '0.6' },
      ];

      const urlsEmpresas = (empresas || []).map((e: any) => ({
        loc: `${baseUrl}/${e.alias ? 'miempresa/' + e.alias : 'empresa/' + e.id}`,
        lastmod: e.updated_at,
        prioridad: '0.8',
      }));

      const urlsPublicaciones = (publicaciones || [])
        .filter((p: any) => !!p.slug)
        .map((p: any) => ({
          loc: `${baseUrl}/producto/${p.slug}`,
          lastmod: p.updated_at,
          prioridad: '0.7',
        }));

      const todasLasUrls = [...urlsEstaticas, ...urlsEmpresas, ...urlsPublicaciones];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${todasLasUrls
          .map(
            (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString().split('T')[0]}</lastmod>` : ''
              }
    <priority>${u.prioridad}</priority>
  </url>`
          )
          .join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      console.error('Error al generar sitemap.xml:', err);
      res.status(500).send('Error al generar el sitemap.');
    }
  });

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();