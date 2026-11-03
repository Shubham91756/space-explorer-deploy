# Stellar.log

An interactive space exploration dashboard for discovering astronomy history,
planetary information, and real-time launch events.

## Live Demo

[Open Stellar.log on Vercel](https://space-explorer-deploy.vercel.app)

## Features

- Space-themed interactive landing page with animated sections.
- Historical space events for any selected month and day.
- Wikipedia-backed event data with a local archive fallback.
- Upcoming and year-filtered Launch Library 2 events.
- Server-side pagination so the browser receives one compact response.
- Search and space-event filtering.
- Planet showcase and orbit visualizations.
- Asteroid Deflector mini-game.
- TaraBot chat widget.
- Responsive layout for desktop and mobile screens.

## Tech Stack

- React 19
- Create React App
- Three.js and React Three Fiber
- Framer Motion
- Wikipedia REST API
- The Space Devs Launch Library API
- Vercel serverless functions with stale-while-revalidate caching

## Run Locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

The frontend uses relative `/api` requests. Vercel serves
`api/space-history.js` and `api/launches.js`; if Wikipedia is unavailable,
historical events use the bundled archive with a short cache lifetime.

## Production Build

```bash
npm run build
```

The Vercel deployment uses `npm run build` and publishes the `build` directory.
Pushes to the connected GitHub branch automatically create new deployments.
See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment details.

## Data Sources

- [Wikipedia On This Day API](https://en.wikipedia.org/api/rest_v1/)
- [The Space Devs Launch Library](https://thespacedevs.com/llapi)
- [Wikimedia Commons](https://commons.wikimedia.org/) for selected imagery

## License

This project is maintained for educational and demonstration purposes.
