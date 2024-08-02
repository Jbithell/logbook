# Logbook

A simple sailing logbook application, which allows you to track your sailing trips and share them with others.

This is a [Remix](https://remix.run) project, which is a framework for building server-rendered React applications. It runs on [Cloudflare Workers](https://workers.cloudflare.com/) with their D1 database.

It uses [Mantine](https://mantine.dev/) for UI components, and [Drizzle](https://drizzle.dev/) for database management.

The project is not currently licensed for reuse.

### Development

Wrangler allows for local development to emulate the Cloudflare runtime. This is already wired up in package.json as the `dev` script:

```sh
# start the remix dev server and wrangler
npm run dev
```

Open up [http://127.0.0.1:8788](http://127.0.0.1:8788) and you should be ready to go!

To generate migrations after adjusting the schema, run `npx drizzle-kit generate:sqlite`

First, build your app for production:

> [!NOTE]  
> These notes are incomplete

1. Create a new project on Cloudflare Pages
1. Make sure to disable fallback mode (open) in the Cloudflare Pages settings
1. Mount the D1 database in the project as "DB"

### Typegen

You will need to rerun typegen whenever you make changes to `wrangler.toml`. Generate types for your Cloudflare bindings in `wrangler.toml`:

```sh
npm run typegen
```
