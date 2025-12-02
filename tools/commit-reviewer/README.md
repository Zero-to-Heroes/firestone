# Commit Reviewer

Automated code review system that triggers on local commits and generates reviews using Cursor AI.

## How It Works

1. **Git Hook**: A `post-commit` hook automatically triggers after each local commit
2. **Review Generation**: The script captures the commit diff and repository context
3. **Review Storage**: Reviews are saved to `.cursor/reviews/` directory
4. **Chat Integration**: Use the helper script to get the review prompt for Cursor chat

## Usage

### Automatic Review (After Commit)

Simply make a commit as usual:

```bash
git commit -m "Your commit message"
```

The review will be automatically generated in the background and saved to `.cursor/reviews/commit-<hash>.md`

### View Review in Chat

To get the review prompt for Cursor chat:

```bash
npx tsx tools/commit-reviewer/send-to-chat.ts <commit-hash>
```

Example:

```bash
npx tsx tools/commit-reviewer/send-to-chat.ts abc12345
```

This will display the review prompt that you can copy and paste into Cursor chat.

### List All Reviews

```bash
npx tsx tools/commit-reviewer/send-to-chat.ts
```

This will list all available reviews.

## Manual Review

You can also manually trigger a review for any commit:

```bash
npx tsx tools/commit-reviewer/review-commit.ts <commit-hash>
```

## Configuration

The reviewer automatically:

- Excludes `node_modules`, `dist`, `tmp`, and other build artifacts
- Includes source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.html`, `.scss`, `.css`, `.json`, `.md`)
- Tracks reviewed commits to avoid duplicates
- Includes full repository context for better reviews

## Review Format

Reviews are saved as markdown files with:

- Commit information (hash, message, author, timestamp)
- Review prompt ready for Cursor chat
- Review results (after processing in chat)

## Files

- `review-commit.ts` - Main review generation script
- `send-to-chat.ts` - Helper to get review prompt for chat
- `.git/hooks/post-commit` - Git hook that triggers reviews
