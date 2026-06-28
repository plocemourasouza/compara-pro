# Security notes

## Accepted dependency advisories

`npm audit` reports 5 **moderate** advisories with no fix available that does not require a major
downgrade. They are dev/transitive and not reachable at runtime in production. Accepted and to be
revisited when upstream ships a patch:

- **postcss** (moderate) — via `next`. A fix requires downgrading Next.js (not viable). Revisit on the
  next Next.js patch.
- **prisma**, **@prisma/dev**, **@hono/node-server** (moderate) — via the Prisma 7 dev toolchain. A fix
  requires downgrading to Prisma 6 (not viable). Revisit on the next Prisma 7.x patch.

The high-severity **picomatch** advisory was resolved via `npm audit fix`.

**Review trigger:** run `npm audit` after upgrading `next` or `prisma`.
