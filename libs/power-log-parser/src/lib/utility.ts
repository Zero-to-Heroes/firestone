import { ReplayParser } from './replay-parser';

export class Utility {
	/**
	 * Converts a power.log line timestamp string (local time-of-day, see ReplayParser.NormalizeTimestamp)
	 * to UTC milliseconds since Unix epoch, matching the C# Utility.GetUtcTimestamp behavior.
	 */
	static GetUtcTimestamp(time: string): number {
		if (!time?.trim()) {
			return 0;
		}

		const match = time.match(/^(\d+):(\d+):(\d+)(?:\.(\d+))?$/);
		if (!match) {
			return 0;
		}

		const hours = parseInt(match[1], 10);
		const minutes = parseInt(match[2], 10);
		const seconds = parseInt(match[3], 10);
		const fracDigits = match[4] ?? '';
		const ms = fracDigits.length
			? Math.floor(parseFloat(`0.${fracDigits}`) * 1000)
			: 0;

		const now = new Date();
		let logDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds, ms);

		const parserStart = ReplayParser.start ? new Date(ReplayParser.start) : now;
		if (logDate < parserStart) {
			logDate = new Date(logDate.getTime() + 24 * 60 * 60 * 1000);
		}

		return logDate.getTime();
	}
}
