# OurWorlds alignment chart

A teacher-led, single-screen version of the “When is it OK to use AI?” classroom chart. This is a local-first prototype based on Catherine's alignment-chart brief and subsequent scoping discussion. It does **not** collect individual responses or use Supabase.

## Run it

```sh
npm install
npm run dev
```

For a production-ready static build, run `npm run build`. Vercel can import this repo as a Vite project with build command `npm run build` and output directory `dist`. No environment variables or backend are required.

## Classroom flow

Choose a practice in the left list, then click or tap the chart to place it. Drag a placed card to revise it; arrow keys or the two sliders also adjust a selected card. Placements save automatically in this browser's local storage. “Export data” downloads JSON containing every prompt's stable ID, label, and normalized x/y coordinates. “Clear chart” starts a new discussion.

The x-axis runs from “Never a good idea” to “Always a good idea”; y runs from “No pressure” at the top to “Lots of pressure” at the bottom. The diagonal line in the original slide is intentionally omitted because it has no agreed meaning.

## Scope and ownership

- The prompt list in `src/prompts.ts` is **working copy**, not approved curriculum language. Review it with Catherine and Shreya before publication.
- No participant accounts, classroom rooms, live aggregation, public submissions, or remote storage are included. The Google Doc describes a larger possible product; those are not part of this initial teacher-led version.
- Nothing has been connected to a Vercel account or GitHub remote. Choose deployment ownership explicitly before launch.
- The app is a standard static Vite/React build, so it can be hosted somewhere other than Vercel if the team prefers.
