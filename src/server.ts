/**
 * Server entry point. Boots the Express app on PORT (default 3000).
 */

import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`StayEase booking app listening on http://localhost:${port}`);
});
