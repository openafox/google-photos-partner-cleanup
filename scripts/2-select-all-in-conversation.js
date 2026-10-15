// Step 2: run in the browser console on the conversation's "All photos" page.
// Selects every photo/video in it and prints the date range, so you can check it
// matches the batch you just sent BEFORE you trash anything.

(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pd = l => new Date(l.replace(/\s/g, ' ').replace(/^.*?(Photo|Video) - (\w+ - )?/, '')
    .replace(/, (\d+:)/, (m, h) => ' ' + h));
  const sc = [...document.querySelectorAll('*')]
    .filter(e => /auto|scroll/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 200)
    .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
  sc.scrollTop = 0; await sleep(800);
  let stuck = 0, n = 0, min, max;
  while (stuck < 8) {
    let hit = false;
    for (const c of document.querySelectorAll('[role=checkbox]')) {
      const l = c.getAttribute('aria-label') || '';
      if (!/(Photo|Video) - /.test(l)) continue;   // also matches "Collage - Photo - ..."
      const d = pd(l); if (!isNaN(d)) { if (!min || d < min) min = d; if (!max || d > max) max = d; }
      if (c.getAttribute('aria-checked') !== 'true') { c.click(); hit = true; n++; await sleep(50); }
    }
    sc.scrollTop += 400; await sleep(600); stuck = hit ? 0 : stuck + 1;
  }
  console.log(`Selected ${n}. Oldest: ${min?.toLocaleString()}. Newest: ${max?.toLocaleString()}.`);
  console.log('If that matches what you sent: More options (⋮) -> Move to trash -> confirm.');
})();
