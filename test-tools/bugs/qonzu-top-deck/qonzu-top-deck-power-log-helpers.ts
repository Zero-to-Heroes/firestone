/**
 * Fixture-specific: in the support log, Q'onzu's discover puts entity 126 on the local player's deck;
 * the log reveals the true CardID before that (SHOW_ENTITY line).
 */
export function extractQonzuLeakedSpellIdFromPowerLogLines(lines: readonly string[]): string {
	for (const line of lines) {
		if (!line.includes('SHOW_ENTITY') || !line.includes('Updating Entity')) {
			continue;
		}
		if (!line.includes('id=126')) {
			continue;
		}
		const m = line.match(/CardID=([A-Za-z0-9_]+)/);
		if (m?.[1]) {
			return m[1];
		}
	}
	throw new Error(
		'[qonzu-top-deck] Could not extract leaked spell CardID (expect SHOW_ENTITY id=126 with CardID=).',
	);
}
