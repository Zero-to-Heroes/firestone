import { execSync } from 'child_process';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';

interface CommitInfo {
	hash: string;
	message: string;
	author: string;
	timestamp: string;
}

interface ReviewedCommit {
	hash: string;
	reviewedAt: string;
}

const REPO_ROOT = process.cwd();
const REVIEWS_DIR = join(REPO_ROOT, '.cursor', 'reviews');
const STATE_FILE = join(REVIEWS_DIR, '.reviewed-commits.json');

// Files and directories to exclude from context
const EXCLUDE_PATTERNS = [
	'node_modules',
	'dist',
	'tmp',
	'.git',
	'.nx',
	'coverage',
	'*.opk',
	'*.log',
	'package-lock.json',
	'.cursor/reviews',
];

// File extensions to include
const INCLUDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.html', '.scss', '.css', '.json', '.md'];

async function ensureReviewsDir() {
	if (!existsSync(REVIEWS_DIR)) {
		await mkdir(REVIEWS_DIR, { recursive: true });
	}
}

async function getReviewedCommits(): Promise<Set<string>> {
	try {
		if (!existsSync(STATE_FILE)) {
			return new Set();
		}
		const content = await readFile(STATE_FILE, 'utf-8');
		const data: ReviewedCommit[] = JSON.parse(content);
		return new Set(data.map((c) => c.hash));
	} catch (error) {
		return new Set();
	}
}

async function markCommitAsReviewed(hash: string) {
	const reviewed = await getReviewedCommits();
	reviewed.add(hash);

	const data: ReviewedCommit[] = Array.from(reviewed).map((h) => ({
		hash: h,
		reviewedAt: new Date().toISOString(),
	}));

	await writeFile(STATE_FILE, JSON.stringify(data, null, 2));
}

function getCommitInfo(hash: string): CommitInfo {
	const message = execSync(`git log -1 --pretty=format:"%s" ${hash}`, {
		encoding: 'utf-8',
		cwd: REPO_ROOT,
	}).trim();

	const author = execSync(`git log -1 --pretty=format:"%an <%ae>" ${hash}`, {
		encoding: 'utf-8',
		cwd: REPO_ROOT,
	}).trim();

	const timestamp = execSync(`git log -1 --pretty=format:"%ai" ${hash}`, {
		encoding: 'utf-8',
		cwd: REPO_ROOT,
	}).trim();

	return {
		hash,
		message,
		author,
		timestamp,
	};
}

function getCommitDiff(hash: string): string {
	try {
		return execSync(`git show ${hash} --stat`, {
			encoding: 'utf-8',
			cwd: REPO_ROOT,
		});
	} catch (error) {
		return `Error getting diff: ${error}`;
	}
}

function getCommitFullDiff(hash: string): string {
	try {
		return execSync(`git show ${hash}`, {
			encoding: 'utf-8',
			cwd: REPO_ROOT,
			maxBuffer: 10 * 1024 * 1024, // 10MB buffer
		});
	} catch (error) {
		return `Error getting full diff: ${error}`;
	}
}

function shouldIncludeFile(filePath: string): boolean {
	// Check exclude patterns
	for (const pattern of EXCLUDE_PATTERNS) {
		if (filePath.includes(pattern)) {
			return false;
		}
	}

	// Check if it's a source file
	const ext = filePath.substring(filePath.lastIndexOf('.'));
	return INCLUDE_EXTENSIONS.includes(ext) || !ext || ext === filePath;
}

async function getAllSourceFiles(): Promise<string[]> {
	const files: string[] = [];

	async function walkDir(dir: string, baseDir: string = REPO_ROOT) {
		try {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(dir, entry.name);
				const relPath = relative(baseDir, fullPath).replace(/\\/g, '/'); // Normalize to forward slashes

				if (entry.isDirectory()) {
					// Skip excluded directories
					if (!EXCLUDE_PATTERNS.some((pattern) => relPath.includes(pattern))) {
						await walkDir(fullPath, baseDir);
					}
				} else if (entry.isFile()) {
					if (shouldIncludeFile(relPath)) {
						files.push(relPath);
					}
				}
			}
		} catch (error) {
			// Ignore permission errors
		}
	}

	await walkDir(REPO_ROOT);
	return files.sort();
}

async function getFileContent(filePath: string): Promise<string> {
	try {
		const fullPath = join(REPO_ROOT, filePath);
		const content = await readFile(fullPath, 'utf-8');
		// Limit file size to avoid huge files
		if (content.length > 50000) {
			return content.substring(0, 50000) + '\n... (file truncated, too large)';
		}
		return content;
	} catch (error) {
		return `Error reading file: ${error}`;
	}
}

async function generateReviewPrompt(commitInfo: CommitInfo, diff: string, fullDiff: string): Promise<string> {
	const sourceFiles = await getAllSourceFiles();

	// Sample a subset of files for context (to avoid token limits)
	// Include all changed files plus a representative sample
	const changedFiles = new Set(
		fullDiff
			.split('\n')
			.filter((line) => line.startsWith('+++') || line.startsWith('---'))
			.map((line) =>
				line
					.replace(/^[+-]{3} [ab]\//, '')
					.trim()
					.replace(/\\/g, '/'),
			)
			.filter((f) => f && !f.startsWith('/dev/null')),
	);

	// Get a sample of files for context (prioritize changed files and common patterns)
	const contextFiles: string[] = [];
	const addedFiles = new Set<string>();

	// Add changed files first
	for (const file of sourceFiles) {
		if (changedFiles.has(file)) {
			contextFiles.push(file);
			addedFiles.add(file);
		}
	}

	// Add some representative files from different parts of the codebase
	// Prioritize files related to changed files
	const changedFileDirs = new Set(
		Array.from(changedFiles).map((f) => {
			const parts = f.split(/[/\\]/);
			return parts.slice(0, Math.min(3, parts.length)).join('/');
		}),
	);

	// Add files from the same directories as changed files
	for (const file of sourceFiles) {
		if (addedFiles.has(file)) continue;

		const fileDir = file.split(/[/\\]/).slice(0, 3).join('/');
		if (changedFileDirs.has(fileDir)) {
			contextFiles.push(file);
			addedFiles.add(file);
			if (contextFiles.length >= 30) break; // Get up to 30 related files
		}
	}

	// Add representative files from different parts of the codebase
	const patterns = ['libs/', 'apps/', 'tools/', 'build-tools/'];
	for (const pattern of patterns) {
		if (contextFiles.length >= 50) break;
		const matching = sourceFiles.filter((f) => f.startsWith(pattern) && !addedFiles.has(f)).slice(0, 10); // Sample 10 files per pattern
		contextFiles.push(...matching);
		matching.forEach((f) => addedFiles.add(f));
	}

	// Limit total context files
	const selectedFiles = contextFiles.slice(0, 50);

	let contextContent = '';
	for (const file of selectedFiles) {
		const content = await getFileContent(file);
		contextContent += `\n\n=== File: ${file} ===\n${content}`;
	}

	const prompt = `# Code Review Request

## Commit Information
- **Hash**: ${commitInfo.hash}
- **Message**: ${commitInfo.message}
- **Author**: ${commitInfo.author}
- **Timestamp**: ${commitInfo.timestamp}

## Commit Statistics
\`\`\`
${diff}
\`\`\`

## Full Commit Diff
\`\`\`
${fullDiff.substring(0, 20000)}${fullDiff.length > 20000 ? '\n... (diff truncated)' : ''}
\`\`\`

## Repository Context
The following files provide context about the codebase structure and related code:

${contextContent.substring(0, 100000)}${contextContent.length > 100000 ? '\n... (context truncated)' : ''}

## Review Instructions
Please provide a comprehensive code review of this commit. Consider:
1. **Code Quality**: Is the code clean, readable, and well-structured?
2. **Potential Bugs**: Are there any obvious bugs, edge cases, or potential issues?
3. **Best Practices**: Does the code follow best practices and patterns used in the codebase?
4. **Performance**: Are there any performance concerns?
5. **Security**: Are there any security vulnerabilities?
6. **Testing**: Is adequate testing in place?
7. **Documentation**: Is the code adequately documented?
8. **Consistency**: Is the code consistent with the rest of the codebase?

Please provide specific, actionable feedback with line references where applicable.
`;

	return prompt;
}

async function saveReview(commitInfo: CommitInfo, reviewPrompt: string, reviewContent?: string) {
	const reviewFile = join(REVIEWS_DIR, `commit-${commitInfo.hash.substring(0, 8)}.md`);

	const content = `# Code Review: ${commitInfo.hash.substring(0, 8)}

**Commit**: \`${commitInfo.hash}\`  
**Message**: ${commitInfo.message}  
**Author**: ${commitInfo.author}  
**Date**: ${commitInfo.timestamp}  
**Reviewed**: ${new Date().toISOString()}

---

## Review Prompt

${reviewPrompt}

---

${reviewContent ? `## Review Result\n\n${reviewContent}` : '## Review Pending\n\nThis review is ready to be processed. Copy the prompt above into Cursor chat for review.'}
`;

	await writeFile(reviewFile, content, 'utf-8');
	return reviewFile;
}

async function main() {
	const commitHash = process.argv[2];

	if (!commitHash) {
		console.error('Usage: review-commit.ts <commit-hash>');
		process.exit(1);
	}

	try {
		await ensureReviewsDir();

		const reviewed = await getReviewedCommits();
		if (reviewed.has(commitHash)) {
			console.log(`Commit ${commitHash.substring(0, 8)} has already been reviewed.`);
			return;
		}

		console.log(`Reviewing commit ${commitHash.substring(0, 8)}...`);

		const commitInfo = getCommitInfo(commitHash);
		const diff = getCommitDiff(commitHash);
		const fullDiff = getCommitFullDiff(commitHash);

		console.log('Generating review prompt...');
		const reviewPrompt = await generateReviewPrompt(commitInfo, diff, fullDiff);

		console.log('Saving review...');
		const reviewFile = await saveReview(commitInfo, reviewPrompt);

		await markCommitAsReviewed(commitHash);

		console.log(`\n✅ Review saved to: ${reviewFile}`);
		console.log(`\n📋 To get the review, copy the prompt from the file above into Cursor chat.`);
		console.log(`\n💡 Tip: You can open the file with: code ${reviewFile}`);
	} catch (error) {
		console.error('Error reviewing commit:', error);
		process.exit(1);
	}
}

main();
