import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { reparseReplay } from '../../core/src/js/services/battlegrounds/store/event-parsers/stats/replay-parser';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	// http://replays.firestoneapp.com/?reviewId=0cd6fc24-1903-417e-8ba2-50b6ab8df990&turn=29&action=1
	test('minion damage is correct', async () => {
		const replayXml = replayXmlTest;
		const replay: Replay = parseHsReplayString(replayXml);

		const stats = reparseReplay(replay);

		expect(stats).not.toBe(null);
		console.debug(stats.coinsWastedOverTurn);

		expect(stats.hpOverTurn['TB_BaconShop_HERO_56'].length).toBe(14);
		expect(stats.hpOverTurn['TB_BaconShop_HERO_56'][13].value).toBeLessThanOrEqual(0);
	});
});
