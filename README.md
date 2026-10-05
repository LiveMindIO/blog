# LiveMindIO Blog

Field notes from LiveMindIO about experimental media, audience interaction,
game-playing agents, and the systems behind them.

## Development

Prerequisites: Git, Node.js **22.12.0 or newer**, and npm **9.6.5 or newer**.
Node.js 24 is used by the deployment workflow; newer Node versions are allowed
by the project's engine requirements.

Run from the blog repository root:

```sh
npm ci
npm run dev
```

Run the production checks with `npm run build`. Forgejo is the primary
repository; its `main` branch mirrors to GitHub, where GitHub Pages deploys the
site to <https://blog.livemind.io>.
