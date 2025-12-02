import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const REPO_ROOT = process.cwd();
const REVIEWS_DIR = join(REPO_ROOT, '.cursor', 'reviews');

async function listReviews() {
	if (!existsSync(REVIEWS_DIR)) {
		console.log('No reviews directory found. Make a commit first!');
		return;
	}

	const { readdir } = await import('fs/promises');
	const files = await readdir(REVIEWS_DIR);
	const reviewFiles = files
		.filter((f) => f.startsWith('commit-') && f.endsWith('.md'))
		.sort()
		.reverse(); // Most recent first

	if (reviewFiles.length === 0) {
		console.log('No reviews found. Make a commit first!');
		return;
	}

	console.log('\n📋 Available Reviews:\n');
	reviewFiles.forEach((file, index) => {
		const hash = file.replace('commit-', '').replace('.md', '');
		console.log(`  ${index + 1}. ${hash}`);
	});

	const commitHash = process.argv[2];
	if (commitHash) {
		const reviewFile = join(REVIEWS_DIR, `commit-${commitHash}.md`);
		if (!existsSync(reviewFile)) {
			console.log(`\n❌ Review not found for commit ${commitHash}`);
			return;
		}

		const content = await readFile(reviewFile, 'utf-8');

		// Extract the review prompt section (everything between "## Review Prompt" and "## Review Result" or end)
		const promptMatch = content.match(/## Review Prompt\n\n([\s\S]*?)(?:\n\n## Review Result|\n*$)/);
		if (promptMatch) {
			const prompt = promptMatch[1].trim();
			console.log('\n' + '='.repeat(80));
			console.log('📝 REVIEW PROMPT (Copy this into Cursor chat):');
			console.log('='.repeat(80));
			console.log('\n' + prompt);
			console.log('\n' + '='.repeat(80));
			console.log('\n💡 Copy the prompt above and paste it into Cursor chat for review.');
			console.log(`\n📁 Full review file: ${reviewFile}`);
		} else {
			console.log('\n📄 Full Review File:');
			console.log('='.repeat(80));
			console.log(content);
		}
	} else {
		console.log('\n💡 Usage: npx tsx tools/commit-reviewer/send-to-chat.ts <commit-hash>');
		console.log('   Example: npx tsx tools/commit-reviewer/send-to-chat.ts abc12345');
	}
}

listReviews().catch(console.error);
