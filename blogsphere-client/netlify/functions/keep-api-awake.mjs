// Render's free plan puts the API to sleep after 15 idle minutes, and the first
// visitor then waits 30-60 s (often seeing an empty page). GitHub's scheduled
// workflows run hours apart, so ping from a Netlify scheduled function instead.
const HEALTH_URL = 'https://blogsphere-api-odr7.onrender.com/api/v1/health';

export default async () => {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(25000) });
    console.log(`keep-api-awake: ${res.status}`);
  } catch (err) {
    console.log(`keep-api-awake: ${err.message}`);
  }
  return new Response('ok');
};

export const config = { schedule: '*/10 * * * *' };
