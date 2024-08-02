# Logbook

A simple sailing logbook application, which allows you to track your sailing trips and share them with others.

This is a [Remix](https://remix.run) project, which is a framework for building server-rendered React applications. It runs on [Cloudflare Workers](https://workers.cloudflare.com/) with their D1 database.

It uses [Mantine](https://mantine.dev/) for UI components, and [Drizzle](https://drizzle.dev/) for database management.

The project is not currently licensed for reuse.

### Local Development

First, initalise the local database by running `npm run d1:local:init` which will create a new SQLite database in the `db` directory.

Wrangler allows for local development to emulate the Cloudflare runtime. This is already wired up in package.json as the `dev` script:

```sh
# start the remix dev server and wrangler
npm run dev
```

Open up [http://127.0.0.1:8788](http://127.0.0.1:8788) and you should be ready to go!

To generate migrations after adjusting the schema, run `npx drizzle-kit generate:sqlite`

### Typegen

You will need to rerun typegen whenever you make changes to `wrangler.toml`. Generate types for your Cloudflare bindings in `wrangler.toml`:

```sh
npm run typegen
```

### Deployment to Cloudflare Pages

1. Create a new project on Cloudflare Pages
1. Disable automatic deployments for both main branch and preview branches
1. Set the build command to `npm run build`
1. Set the Build output directory to `public`
1. Disable fallback mode (open)
1. Mount both D1 databases in the project as "DB"
1. Set the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` Github Actions runner secrets
