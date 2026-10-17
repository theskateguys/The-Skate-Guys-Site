// Read-only health probe: no POST, payload, Sheet write or MailApp invocation.
async page => {
  const endpoint = 'https://script.google.com/macros/s/AKfycbw7On5pvG1ohVzbESEu_JkOyhGt1EIHyWaYJt_moU16A6VEq7NM6QI4pq8idYfF1NCW7g/exec';
  if (!page.url().startsWith('http://127.0.0.1:4198/#')) throw Error('Local test portal required');
    const result = await page.evaluate(async endpoint => {
      const start = performance.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(endpoint, {method: 'GET', mode: 'cors', credentials: 'omit', signal: controller.signal});
        return {status: response.status, type: response.type, json: await response.json(), ms: performance.now() - start};
      } catch (error) {return {error: error.name, ms: performance.now() - start};}
      finally {clearTimeout(timer);}
    }, endpoint);
    return {scope: 'Read-only native browser health transport probe; no request interception. Inspect the CLI requests log separately.', result};
}
