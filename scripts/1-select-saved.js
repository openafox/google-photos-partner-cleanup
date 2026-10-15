// Step 1: run in the browser console (F12 -> Console) on your PARTNER'S photos page
// (photos.google.com/partner/...). Selects up to LIMIT photos that are SAVED to your
// library (cloud-with-checkmark icon), newest first. Unsaved photos are skipped.
// Re-run after each batch is trashed; it picks up where the last batch left off.
// Keep the tab in front and the screen awake while it runs.

(async () => {
  const LIMIT = 450;          // keep at or below ~450; bigger shares fail or split
  const SKIP = [];            // labels of photos that never reach the conversation, e.g. 'Oct 9, 2025, 6:11:13 PM'
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const sc = [...document.querySelectorAll('*')]
    .filter(e => /auto|scroll/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 200)
    .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
  const saved = t => [...t.querySelectorAll('svg.VbQ9Gc path')]
    .some(p => (p.getAttribute('d') || '').includes('2.88 2.88 4.13-4.13'));

  sc.scrollTop = 0; await sleep(800);
  let n = 0, stall = 0, lastH = 0, first, last, reason = 'limit';
  outer: while (true) {
    let clicked = 0;
    for (const t of document.querySelectorAll('.rtIMgb')) {
      const cb = t.querySelector('[role=checkbox]');
      if (!cb || cb.getAttribute('aria-checked') === 'true' || !saved(t)) continue;
      const l = (cb.getAttribute('aria-label') || '').replace(/\s/g, ' ');
      if (SKIP.some(s => l.includes(s))) continue;
      cb.click(); clicked++; n++;
      if (l !== 'Select') { first ??= l; last = l; }
      await sleep(60);
      if (n >= LIMIT) break outer;
    }
    sc.scrollTop += clicked ? 600 : 2000;
    await sleep(clicked ? 500 : 350);
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 10) {
      if (sc.scrollHeight === lastH) { if (++stall > 40) { reason = 'end'; break; } }
      else { stall = 0; lastH = sc.scrollHeight; }
      sc.scrollTop -= 2500; await sleep(300); sc.scrollTop = sc.scrollHeight; await sleep(1000);
    }
    if (n && n % 50 === 0) console.log(`selected ${n}…`);
  }
  console.log(`Done: selected ${n} (${reason}). Newest: ${first}. Oldest: ${last}.`);
  if (n === 0 && reason === 'end') console.log('Nothing saved left. You are finished!');
})();
