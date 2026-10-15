# Remove partner-saved photos from Google Photos

**Last verified working: October 2026**

If you ever turned on Google Photos partner sharing with "auto-save", your partner's whole library may now
be mixed into yours. Removing the partner doesn't remove the saved copies, and Google has no "unsave all"
button. This repo makes the community workaround (from
[this Reddit thread](https://www.reddit.com/r/googlephotos/comments/jhn6ym/can_you_delete_photos_from_partner_sharing/))
practical at scale: I used it to clear over 20,000 of my wife's photos out of my library.

Your partner's originals are **not** touched. Only your saved copies go to your Trash.

## How it works

Sharing photos into a Google Photos conversation adds them to the conversation's "All photos". Trashing
from there trashes your saved copies. So, in batches:

1. Select saved photos in your partner's view
2. Share them into an **empty** conversation
3. In that conversation's All photos, select all and Move to trash

The two scripts here do the slow part (selecting hundreds of photos without clicking each one).

## Before you start

- **Use an empty conversation.** Trash removes *everything* in the conversation's All photos. Share to a
  second Google account you own that you've never shared photos with. Never use your partner's thread.
- **Type the recipient's email** rather than picking a suggestion; look-alike accounts are common.
- **Batches of 450 or fewer.** Bigger shares freeze, fail, or split.
- **Keep the screen awake and the tab in front.** A screensaver or a covered window makes the page stop
  loading (you'll see an empty partner view).
- **Don't press Escape** with photos selected. It clears the selection.
- **Do a 5-photo test first** (set `LIMIT = 5` in script 1) and check the result before going big.

## Manual steps (browser console, no AI needed)

1. Open photos.google.com → Sharing → your partner (or the "<Partner>'s photos" link) to open the partner view.
2. Open the console (F12 → Console), paste [`scripts/1-select-saved.js`](scripts/1-select-saved.js), press Enter.
   It selects up to 450 **saved** photos (the ones with the cloud-checkmark icon), newest first, and prints the
   date range when done.
3. Click **Share** (top right). The first click with ~450 selected can freeze the page for 30–60 s; wait.
   Type the recipient's email, then **Send**.
4. Open that conversation → **All photos**. Paste [`scripts/2-select-all-in-conversation.js`](scripts/2-select-all-in-conversation.js).
   Check the printed date range matches what you sent.
5. **⋮ More options → Move to trash → confirm.** Wait for "N moved to trash" before leaving the page.
6. Back to the partner view, reload, repeat from step 2. When script 1 prints `Nothing saved left`, you're done.

Each batch takes ~5–15 minutes; selection gets slower as you work back in time because the script has to
scroll past everything already cleared.

**Notes**
- The conversation usually ends up with 0–3 fewer photos than you sent (duplicates, collages). Normal.
- If one photo keeps getting selected but never lands in the conversation, add its date/time to `SKIP` in
  script 1 and delete it by hand.
- Trashed items stay in Trash for 30 days and still count against your storage until then. Empty Trash
  yourself if you want the space back sooner.
- Turn off auto-save in partner sharing afterwards so it doesn't build up again.

## Using it with an AI agent (Claude skill)

[`remove-partner-saved-photos/SKILL.md`](remove-partner-saved-photos/SKILL.md) is a skill for Claude (or any
agent that can drive a browser). It covers the whole loop: safety checks, batching, verifying each batch,
running batches in sub-agents to keep token use down, and troubleshooting. To use it with Claude, add the
folder as a skill in Claude (or drop it in `~/.claude/skills/` for Claude Code) and ask it to remove your
partner's saved photos. You'll still need to approve sending and trashing yourself.

## When it breaks

Google renames things. The scripts rely on:
- the saved icon: `svg.VbQ9Gc` with a path containing `2.88 2.88 4.13-4.13`
- photo tiles: `.rtIMgb`, with `role=checkbox` elements labelled like `Photo - Landscape - Mar 16, 2017, 9:25:50 PM`

If a script selects nothing, inspect a saved tile and check those. Issues and PRs welcome.

## License

MIT. No warranty: you're trashing photos, so test small and check each batch.
