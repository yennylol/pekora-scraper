import fetch from 'node-fetch';
import cheerio from 'cheerio';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  const { start = '113800', end = '114000' } = req.query;

  const startId = parseInt(start, 10);
  const endId = parseInt(end, 10);

  if (isNaN(startId) || isNaN(endId) || startId > endId) {
    return res.status(400).json({ error: 'Invalid start or end parameter' });
  }

  const assets = [];
  let consecutiveMisses = 0;
  const maxMisses = 5;
  const delayMs = 300;

  for (let id = startId; id <= endId; id++) {
const url = `https://www.pekora.zip/catalog/${id}/-`;


    try {
      const response = await fetch(url);
      if (!response.ok) {
        consecutiveMisses++;
        if (consecutiveMisses >= maxMisses) break;
        await delay(delayMs);
        continue;
      }

      consecutiveMisses = 0;

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('h1').first().text().trim() || `Asset #${id}`;

      // Replace with actual selector if you find the date on asset page
      const dateText = $('span.asset-creation-date').text().trim() || '';
assets.push({
  id,
  url: response.url, // final URL after redirect
  title,
  date: dateText,
});


      await delay(delayMs);
    } catch {
      consecutiveMisses++;
      if (consecutiveMisses >= maxMisses) break;
      await delay(delayMs);
      continue;
    }
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  res.status(200).json({ assets });
}
