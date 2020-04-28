import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { reparseReplay } from '../../core/src/js/services/battlegrounds/store/event-parsers/stats/replay-parser';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	test('minion damage is correct', async () => {
		const replayXml = replayXmlTest;
		const replay: Replay = parseHsReplayString(replayXml);

		const stats = reparseReplay(replay);

		console.log(stats);
		expect(stats).not.toBe(null);
	});
});
