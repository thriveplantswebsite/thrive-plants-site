import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import cloudflare from '@astrojs/cloudflare';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';

/* ============================================================
   HOSTING — Cloudflare Workers, chosen for the free plan's shape rather than
   its size: requests for pages, images and CSS are free and unlimited, so a
   client going viral costs nothing and cannot pause the site. Netlify's free
   plan counts every visit against the same 300 credits as every deploy.

   WHY ASTRO 5 AND NOT 7. Astro 7 was tried first. Its Cloudflare adapter runs
   `astro dev` inside Cloudflare's own runtime, which has no file system, so
   Keystatic's local mode (content written straight to disk) refuses to run.
   Moving dev back to Node then hit Vite 8 failing to convert Keystatic's
   CommonJS dependencies one package at a time. Astro 5 is what the Molly and
   Katherine sites run, Keystatic is proven on it, dev runs on Node, and its
   Cloudflare adapter targets Workers. Revisit once Keystatic supports 7.
   ============================================================ */
export default defineConfig({
  /* [PLACEHOLDER] until the domain is bought. Canonical links, og: URLs and
     the sitemap all derive from this one string. */
  site: 'https://thrive-plants-site.example',
  output: 'static',

  adapter: cloudflare({
    /* Photos are resized when the site builds, not per visit. Every size is
       then a plain static file, which is the free and unlimited kind of
       request on Workers. */
    imageService: 'compile',
    /* Lets `astro dev` read wrangler.jsonc bindings (the sold-items store)
       and .dev.vars secrets, so local behaves like the deployed site. */
    platformProxy: { enabled: true },
  }),

  /* The Cloudflare adapter otherwise turns on Astro sessions backed by a KV
     namespace called SESSION, and warns until one exists. Nothing on this
     site uses sessions, so an in-memory driver keeps it quiet without a
     storage binding nobody needs. */
  session: { driver: 'memory' },

  integrations: [
    react(),
    markdoc(),
    keystatic(),
    sitemap({ filter: (page) => !page.includes('/keystatic') && !page.includes('/publish') }),
  ],

  vite: {
    resolve: {
      /* React 19's default server renderer expects Node's MessageChannel,
         which the Workers runtime does not have. The edge build of the same
         renderer does not. Production only: dev runs on Node. */
      alias: import.meta.env.PROD ? { 'react-dom/server': 'react-dom/server.edge' } : {},
    },
  },
});
