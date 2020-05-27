import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { reparseReplay } from '../../core/src/js/services/battlegrounds/store/event-parsers/stats/replay-parser';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	test('minion damage is correct', async () => {
		const replayXml = replayXmlTest;
		console.time('start parsing');
		const replay: Replay = parseHsReplayString(replayXml);
		console.timeEnd('startParsing');

		const stats = reparseReplay(replay);

		expect(stats).not.toBe(null);
		console.debug(stats.minionsBoughtOverTurn);
		console.debug(stats.minionsSoldOverTurn);

		// expect(stats.hpOverTurn['TB_BaconShop_HERO_56'].length).toBe(14);
		// expect(stats.hpOverTurn['TB_BaconShop_HERO_56'][13].value).toBeLessThanOrEqual(0);
	});
});
