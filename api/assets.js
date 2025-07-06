import fetch from 'node-fetch';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  const { start = '113800', end = '113810' } = req.query;

  const startId = parseInt(start, 10);
  const endId = parseInt(end, 10);

  if (isNaN(startId) || isNaN(endId) || startId > endId) {
    return res.status(400).json({ error: 'Invalid start or end parameter' });
  }

  const assets = [];
  const maxRequests = Math.min(endId - startId + 1, 10); // limit to 10 requests

  for (let id = startId; id < startId + maxRequests; id++) {
    const url = `https://www.pekora.zip/catalog/${id}`;

    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const html = await response.text();

      const $ = cheerio.load(html);
      const title = $('h1').first().text().trim() || `Asset #${id}`;

      // Adjust selector below after inspecting Pekora's asset page for date or sales info
      const dateText = $('span.asset-creation-date').text().trim() || '';

      assets.push({
        id,
        url,
        title,
        date: dateText,
      });
    } catch (error) {
      continue;
    }
  }

  // Cache for 1 minute to avoid too many scrapes
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  res.status(200).json({ assets });
}
