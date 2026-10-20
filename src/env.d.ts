/// <reference types="astro/client" />

type KVNamespace = import('./lib/env').KVLike;
type Runtime = import('@astrojs/cloudflare').Runtime<import('./lib/env').Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
