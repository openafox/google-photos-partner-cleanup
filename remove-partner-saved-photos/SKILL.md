---
name: "remove-partner-saved-photos"
description: "Use when a user wants to remove photos that Google Photos partner sharing auto-saved from their partner into their own library, without deleting the partner's originals."
---

# Remove partner-saved photos from Google Photos

## Background
- Partner sharing with "auto-save" copied the partner's library into the user's. Google has no undo; removing
  the partner does NOT remove saved copies. Help docs only cover deleting "recently saved" items one by one.
- Saved copies are independent: trashing them leaves the partner's originals (they show a "Save" button again).
- Workaround (Reddit thread, still working Oct 2026): select saved photos in the partner view, share them into
  a conversation, open its "All photos", Move to trash. Run on photos.google.com via a browser tool.
- Does NOT empty Trash, free storage immediately, or change sharing settings unless asked.

## Prerequisites
- Partner sharing still connected (if removed, re-invite/accept with auto-save OFF).
- A recipient with NO existing conversation with the user; best is another Google account the user owns.
- Browser tool signed in. Screen must stay awake and the app window in front for the whole run: a
  screensaver/sleep/lock gives `StatusCodeError: TIMEOUT` and an empty partner view; a covered window stops
  rendering. Ask the user to disable sleep (or use a keep-awake app) up front. Check this before suspecting
  throttling.
- Open conversations in the main tab, not a popup window. An open Google Photos popup window can block the
  browser tool from running scripts in any tab, and the tool may be unable to close it; ask the user to close it.

## Approval (cannot be pre-granted by this skill)
Sending to a recipient and trashing are actions the user must approve in chat, every session; the browser
permission system blocks the recipient click without it. Ask ONCE, up front, for a blanket approval, e.g.:
"Approve: send each batch to <email> and trash it from that conversation, for all remaining batches?"
When delegating to subagents, quote the user's reply verbatim plus the question it answered in each
subagent prompt, and state exactly which clicks it covers (recipient result, Send, Move to trash + confirm).

## Safety rules (non-negotiable)
1. Trash removes EVERYTHING in the conversation's All photos, so it must start empty. Check Conversations;
   never use the partner or anyone with an existing photo thread.
2. Type the recipient's email explicitly; never accept a same-name suggestion (users have look-alike accounts).
3. Confirm the signed-in account (account button aria-label) and tell the user.
4. Run a 5-photo test and have the user confirm the result before any real batch.
5. Get explicit OK before the first send and first trash (see Approval); after the test, ask whether to run all
   batches without further prompts.
6. Before trashing, check the batch. If anything could be the user's own photos, stop and ask.
7. Never empty Trash. 8. Never press Escape with a selection active (clears it).
9. Respect the user's date scope (e.g. "2018 and older") using the year in each tile's aria-label.

## Procedure
### 1. Setup
1. Open photos.google.com; confirm account. Ask for date scope.
2. Conversations: confirm the recipient has none; agree on exact email.
3. Open the partner view (Sharing -> partner, or sidebar "<Partner>'s photos", URL photos.google.com/partner/<id>).
   Missing = sharing disconnected.
4. Saved tiles show a cloud-with-checkmark icon (`svg.VbQ9Gc` in tile `.rtIMgb`, path `d` contains
   `2.88 2.88 4.13-4.13`); unsaved show none. Select saved only (sharing unsaved ones just saves then trashes them).
5. Optional scan (loader, then count saved vs unsaved by year) to tell the user how many exist and where.
   Auto-save often stopped years earlier than the user thinks.

### 2. Test batch (LIMIT = 5)
Select, verify "5 selected", note dates. Share -> type email -> user OK -> Send (creates the conversation).
Open conversation -> All photos: only ~5 items? User OK -> select all -> More options -> Move to trash ->
confirm. User confirms they're gone from main Photos and still in the partner view (no cloud icon).

### 3. Batch loop (repeat until selector returns n = 0 with reason 'end')
1. Reload partner view, run the selector (LIMIT 450; never above ~500, larger shares split/fail). It works
   top-down; trashed items lose the icon, so each pass resumes naturally and catches earlier stragglers.
   Never assume a date range is "done" from an earlier run; only `reason: 'end'` with n = 0 proves it.
2. Real-click Share. With ~450 selected the first click freezes 30-60s and the tool often times out: wait
   ~30s, then `find` "Send in Google Photos". Pick the SAME recipient (conversation must have shown
   "No activity", step 5); Send.
3. Conversation -> All photos -> run select-all JS. Its min/max dates must fall inside the batch sent, else
   stop and ask. Expect 0-3 fewer than sent (duplicates/collages); normal.
4. More options -> Move to trash -> screenshot -> confirm. Wait for the "<N> moved to trash" toast before
   navigating (leaving during "Moving N..." can interrupt it).
5. Leftover check; trash leftovers until 0. Conversation should read "No activity" before the next send.
   A straggler that never lands in the conversation after 2 tries: add its label to the selector's SKIP list
   (so it stops wasting a slot) and report it for manual deletion.
6. Report: batches done, items trashed, date range.
A conversation over ~20,000 photos fails; near that, start a fresh empty one with another owned account.
Timing: selection gets slower as the cleared top region grows (each pass scrolls past everything already
cleared: ~1.3M px / 4-5 min in 2020, ~2M px / 7-8 min in 2017). Whole batch ~10-14 min late in a big library.

### 4. Verify and wrap up
- Selector ends `reason: 'end'`, n = 0. Main Photos at scope dates: partner photos gone, user's intact.
  Conversation All photos empty.
- Tell the user: items sit in Trash 30 days then purge; they count against storage until purged; emptying
  Trash is their call. List any SKIP stragglers for manual deletion. Partner originals untouched. Optionally
  turn off auto-save / remove partner (doesn't restore or remove anything). Offer to delete the empty conversation.

## Token economy (~40+ repetitive batches)
- Every tool call re-sends the whole conversation, so cost climbs per batch. Run batches in subagents
  (cheaper model fine), ~5-8 batches per subagent, each returning one line per batch. Start a FRESH subagent
  for each chunk (passing current state + the user's approval) rather than resuming a long one.
- JS tool times out ~45s: launch async JS writing `window.__sel` / `window.__cv`, then wait in ~45s steps
  reading only the tiny JSON. No chains of 10s waits.
- Return tiny JS results (`JSON.stringify` of 3-5 fields), never label arrays or DOM dumps.
  read_console_messages only with pattern "TIMEOUT", limit 1.
- Combine steps with browser_batch (e.g. click + wait + find). Use `find` ("Send in Google Photos",
  "moved to trash") and `zoom`, not screenshots. "No activity": `document.body.innerText.includes('No activity')`.
  Only full screenshot: the trash confirm dialog.

### Subagent prompt template
```
Use skill remove-partner-saved-photos. Continue an in-progress run; skip setup and test batch.
User approval (verbatim "<reply>", answering "<question>"): covers clicking the <email> result, Send,
and Move to trash + confirm in that conversation, for every remaining batch.
Browser: <tool prefix>; reuse the main photos.google.com tab; never popups.
Account: <signed-in email>. Recipient: <email> (type it; pick only the exact-address result).
Conversation reads "No activity". Partner view: <partner name/URL>. State: <what's done>. SKIP: <labels>.
Run batches of 450 until selector returns n=0/'end' (max <K>). Rules: never press Escape; never empty Trash;
check "No activity" before each Send; wait for "<N> moved to trash" toast before navigating; trash only if
conversation min/max dates match the batch; any non-partner item or mismatch -> stop and report.
Follow the Token economy section. Return ONLY one line per batch:
"B<i>: sent <n>, conv <m>, <oldest>..<newest>, trashed <t> (toast ok)", plus one final stop-reason line.
```

### Manual mode (zero-token loop)
Agent (or user via console) runs only the selector; per batch the user clicks: Share -> pick the conversation
-> Send -> open conversation, All photos -> run select-all JS -> More options -> Move to trash -> confirm.

## Browser tips
- No date scrubber in the partner view; lazy-load by script. Class names are obfuscated; use role/aria-label.
- aria-labels contain a non-standard space before AM/PM: normalize with `l.replace(/\s/g, ' ')` before any
  string match or date parse.
- Share and menus need real coordinate clicks; JS `.click()` on Share broke the page (reload + reselect).
  Thumbnail coordinate clicks are unreliable (grid reflows); per-checkbox JS clicks are dependable.
- Reference coordinates (one desktop-sized window; verify before use): Share (722,34); recipient field
  (400,208); first search result (315,307); Send (710,813); conversation All photos (678,33); More options
  (765,33); Move to trash item (693,250); trash confirm (612,478), or (612,511) when a "You will recover X MB"
  line shows.

### Loader (scan only)
```js
(async () => {
  const sc = [...document.querySelectorAll('*')].filter(e => /auto|scroll/.test(getComputedStyle(e).overflowY)
      && e.scrollHeight > e.clientHeight).sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth)[0];
  window.__sc = sc; let last = 0, stable = 0; window.__load = { done: false };
  while (stable < 45) {  // nudge up then down: parking at the bottom stops new loads
    sc.scrollTop = sc.scrollHeight - 3000; await new Promise(r => setTimeout(r, 300));
    sc.scrollTop = sc.scrollHeight; await new Promise(r => setTimeout(r, 900));
    if (sc.scrollHeight === last) stable++; else { stable = 0; last = sc.scrollHeight; }
    window.__load = { done: false, h: last, stable };
  }
  window.__load = { done: true, h: last };
})();
```
~2-4 min for a multi-decade library.

### Batch selector (top-down, saved-only)
Checkbox labels look like `Photo - Landscape - Mar 16, 2017, 9:25:50 PM`; unrendered ones say `Select` (fine).
SKIP holds labels of stragglers that never land in the conversation (e.g. `'Oct 9, 2025, 6:11:13 PM'`).
```js
window.__sel = { done: false, n: 0 };
(async () => {
  const LIMIT = 450, SKIP = [], sleep = ms => new Promise(r => setTimeout(r, ms));
  const sc = [...document.querySelectorAll('*')].filter(e => /auto|scroll/.test(getComputedStyle(e).overflowY)
      && e.scrollHeight > e.clientHeight + 200).sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
  const saved = t => [...t.querySelectorAll('svg.VbQ9Gc path')]
      .some(p => (p.getAttribute('d') || '').includes('2.88 2.88 4.13-4.13'));
  sc.scrollTop = 0; await sleep(800);
  let n = 0, stall = 0, lastH = 0;
  outer: while (true) {
    let clicked = 0;
    for (const t of document.querySelectorAll('.rtIMgb')) {
      const cb = t.querySelector('[role=checkbox]');
      if (!cb || cb.getAttribute('aria-checked') === 'true' || !saved(t)) continue;
      const l = (cb.getAttribute('aria-label') || '').replace(/\s/g, ' ');
      if (SKIP.some(s => l.includes(s))) continue;
      cb.click(); clicked++; n++;
      if (l !== 'Select') { window.__sel.first ??= l; window.__sel.last = l; }
      await sleep(60);
      if (n >= LIMIT) break outer;
    }
    window.__sel.n = n;
    sc.scrollTop += clicked ? 600 : 2000;           // slow where saved tiles are, fast through cleared stretches
    await sleep(clicked ? 500 : 350);
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 10) {   // at the loaded bottom: nudge to load more
      if (sc.scrollHeight === lastH) { if (++stall > 40) { window.__sel.reason = 'end'; break; } }
      else { stall = 0; lastH = sc.scrollHeight; }
      sc.scrollTop -= 2500; await sleep(300); sc.scrollTop = sc.scrollHeight; await sleep(1000);
    }
  }
  window.__sel.done = true;
})();
```
Read: `JSON.stringify({n:__sel.n,done:__sel.done,r:__sel.reason,first:__sel.first,last:__sel.last})`.
`reason: 'end'` with n = 0 = done. For a date scope, add a year check on the label and skip/stop.

### Conversation select-all with date check (in All photos)
(The date parser uses a function replacer on purpose: a dollar-sign backreference gets mangled when the skill loads.)
```js
window.__cv = { done: false, n: 0 };
(async () => {
  const pd = l => new Date(l.replace(/\s/g, ' ').replace(/^.*?(Photo|Video) - (\w+ - )?/, '')
      .replace(/, (\d+:)/, (m, h) => ' ' + h));
  const sc = [...document.querySelectorAll('*')].filter(e => /auto|scroll/.test(getComputedStyle(e).overflowY)
      && e.scrollHeight > e.clientHeight + 200).sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
  sc.scrollTop = 0; await new Promise(r => setTimeout(r, 800));
  let stuck = 0, min, max;
  while (stuck < 8) {
    let hit = false;
    for (const c of document.querySelectorAll('[role=checkbox]')) {
      const l = c.getAttribute('aria-label') || '';
      if (!/(Photo|Video) - /.test(l)) continue;        // also matches "Collage - Photo - ..."
      const d = pd(l); if (!isNaN(d)) { if (!min || d < min) min = d; if (!max || d > max) max = d; }
      if (c.getAttribute('aria-checked') !== 'true') { c.click(); hit = true; window.__cv.n++;
        await new Promise(r => setTimeout(r, 50)); }
    }
    sc.scrollTop += 400; await new Promise(r => setTimeout(r, 600)); stuck = hit ? 0 : stuck + 1;
  }
  Object.assign(window.__cv, { done: true, min: String(min), max: String(max) });
})();
```

### Leftover check (All photos; scroll through first if long)
```js
[...document.querySelectorAll('[role=checkbox][aria-label]')]
  .filter(b => /(Photo|Video) - /.test(b.getAttribute('aria-label'))).length
```

## Troubleshooting
- Empty partner view / `TIMEOUT` / page not drawing: screen asleep or window covered. Wake/front it, reload.
  Persists with screen awake = throttling.
- Scripts refuse to run in any tab: a Google Photos popup window is open. Ask the user to close it.
- Recipient click blocked by the permission system: no in-chat approval yet this session. Ask (see Approval).
- `TIMEOUT` deep in a selection (>1.1M px scrollTop): reload the partner view and rerun the selector.
- Selection lost (Escape or reflow), or toolbar missing / thumbnails stuck after JS-click on Share: reload, reselect.
- Share dialog shows nothing: wait 30-60s, `find` "Send in Google Photos"; click Share once more only if absent.
- Share fails or splits: drop to ~400.
- Unexpected items in the conversation (user's own, earlier shares): STOP, don't trash, ask.