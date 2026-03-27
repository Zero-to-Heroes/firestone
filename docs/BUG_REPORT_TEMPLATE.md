I got this request:
"
FullMessage: ivory rook pool not restricted
App logs: https://s3-us-west-2.amazonaws.com/com.zerotoheroes.support/fa698ba1-d827-4f33-adaf-dac658832a21.app.zip
Game logs: https://s3-us-west-2.amazonaws.com/com.zerotoheroes.support/52d7a003-1cd3-4a7d-bb57-8d7d87d631b0.power.zip
"

In the rest of this file, replace "<slug>" with "blackwing".

Please download the Game logs from the referenced zip URL, and unzip it so that the power.log file is extracted to `test-tools\power-logs\<slug>.log`.
Please then check that file to only keep the last game (there might be multiple games in there). You can usually do this by keeping only the last GameState - CREATE_GAME line and everything that comes after.

Could you have a look? Also check AGENTS.md.

## Workspace isolation

You are working in parallel with other agents. You MUST isolate your work using git worktrees before making any file changes.

### Setup (do this first)

1. Create a worktree directory for this bug under `../zerotoheroes/.worktrees/bug-<slug>/`:
   cd <root>/firestone
   git worktree add ../.worktrees/bug-<slug>/firestone -b bug/<slug>
   Do this for every repo you need to modify.
2. Copy the power.log into your worktree (if any):
   cp test-tools/power-logs/<slug>.log ../.worktrees/bug-<slug>/firestone/test-tools/power.log
3. **From this point on, ALL your reads and edits happen inside `.worktrees/bug-<slug>/`**, not in the main repo directories.

### Rules

- **Never modify files in the main repo directories** — only in your worktree.
- Don't modify this template
- When you're done, tell me the branch name so I can review and merge.

### Cleanup

When asking you to merge :

- once everything is merged, clean up:
    - git worktree remove ../.worktrees/bug-<slug>/firestone

## Investigation

Please propose a solution before making code changes, and don't hesitate to ask questions if needed.
