/**
 * Rewind non-regression suite.
 *
 * For every `.log` file under `test-tools/non-reg/power-logs/rewind/`, replay it through
 * the full parser + GameStateService stack and compare the final `stringify(GameState)`
 * against a committed golden at `.../goldens/<basename>.state.json`.
 *
 * The correctness property we care about: refactoring the rewind machinery must not change
 * the consumer-visible final state for any log in the corpus. Event-shape changes are OK
 * (this suite does not assert against them) as long as the end-state matches.
 *
 * ### First run / updating goldens
 *
 * Set `UPDATE_REWIND_GOLDENS=1` to (re)write goldens instead of asserting:
 *
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   UPDATE_REWIND_GOLDENS=1 npx jest test-tools/non-reg/rewind-nonreg.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 *
 * ### Asserting (CI / local verification)
 *
 *   npx jest test-tools/non-reg/rewind-nonreg.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import {
	ensureGoldensDir,
	goldenPathForLog,
	isGoldenUpdateMode,
	listRewindLogFiles,
	runRewindReplay,
} from '../lib/rewind-golden-harness';

describe('Rewind non-regression (GameState end-state goldens)', () => {
	const logs = listRewindLogFiles();
	if (logs.length === 0) {
		it('has rewind logs committed', () => {
			throw new Error(
				'No .log files found under test-tools/non-reg/power-logs/rewind/. ' +
					'Commit rewind logs there before running this suite.',
			);
		});
		return;
	}

	const updateMode = isGoldenUpdateMode();

	for (const logFile of logs) {
		it(
			`${logFile} final GameState matches golden`,
			async () => {
				const { goldenPath, serialized } = await runRewindReplay(logFile);

				if (updateMode) {
					ensureGoldensDir();
					// Normalize to LF on write so the round-trip stays byte-stable across
					// platforms; goldens are checked in once and compared everywhere.
					fs.writeFileSync(goldenPath, serialized.replace(/\r\n/g, '\n'));
					return;
				}

				if (!fs.existsSync(goldenPath)) {
					throw new Error(
						`Golden not found at ${goldenPath}. Run with UPDATE_REWIND_GOLDENS=1 to create it.`,
					);
				}
				const golden = fs.readFileSync(goldenPath, 'utf8');
				// Normalize line endings on both sides. If the golden gets checked out as
				// CRLF on Windows (e.g. via core.autocrlf=true) while the in-memory
				// `serialized` always uses LF, a strict string compare would fire on every
				// line - swamping the actual semantic diff. We don't care about line
				// endings here, only state content.
				expect(serialized.replace(/\r\n/g, '\n')).toEqual(golden.replace(/\r\n/g, '\n'));
			},
			300_000,
		);
	}
});
