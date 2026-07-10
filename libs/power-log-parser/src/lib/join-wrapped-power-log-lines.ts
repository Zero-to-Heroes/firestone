const POWER_LOG_LINE_PREFIX = /^D \d/;

/** True when square brackets in `text` are not balanced (entity clause wraps to the next line). */
export function hasUnclosedSquareBrackets(text: string): boolean {
	let depth = 0;
	for (const ch of text) {
		if (ch === '[') {
			depth++;
		} else if (ch === ']') {
			depth--;
		}
	}
	return depth > 0;
}

function isPowerLogLine(line: string): boolean {
	return POWER_LOG_LINE_PREFIX.test(line.trim());
}

/** True when `line` is the second physical line of a wrapped entityName clause. */
export function isEntityNameContinuationLine(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed.length || isPowerLogLine(trimmed)) {
		return false;
	}
	// Client error/warning lines and other tooling headers must not be merged.
	if (/^[A-Z] \d/.test(trimmed)) {
		return false;
	}
	// Wrapped entity fragments always carry the id= clause on the continuation line.
	return /\bid=\d+/.test(trimmed);
}

/**
 * Some locales wrap long `entityName=` values across physical log lines. The continuation
 * line does not repeat the `D <timestamp> ...` prefix.
 */
export function shouldJoinWrappedPowerLogLine(previousLine: string, nextLine: string): boolean {
	if (!previousLine?.trim()?.length || !nextLine?.trim()?.length) {
		return false;
	}
	if (!isEntityNameContinuationLine(nextLine)) {
		return false;
	}
	return hasUnclosedSquareBrackets(previousLine);
}

/** Join wrapped entity-name continuations onto the previous log line (space-separated). */
export function joinWrappedPowerLogLines(lines: readonly string[]): string[] {
	const joined: string[] = [];
	for (const line of lines) {
		if (joined.length === 0) {
			joined.push(line);
			continue;
		}
		const previous = joined[joined.length - 1]!;
		if (shouldJoinWrappedPowerLogLine(previous, line)) {
			joined[joined.length - 1] = `${previous} ${line.trim()}`;
		} else {
			joined.push(line);
		}
	}
	return joined;
}
