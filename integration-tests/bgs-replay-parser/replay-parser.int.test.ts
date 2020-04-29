import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { reparseReplay } from '../../core/src/js/services/battlegrounds/store/event-parsers/stats/replay-parser';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	// http://replays.firestoneapp.com/?reviewId=0cd6fc24-1903-417e-8ba2-50b6ab8df990&turn=29&action=1
	test('minion damage is correct', async () => {
		const replayXml = replayXmlTest;
		const replay: Replay = parseHsReplayString(replayXml);

		const stats = reparseReplay(replay);

		// console.debug(stats);
		// BGS_038
		// console.log(stats.totalMinionsDamageDealt['BGS_038']);
		// console.log(stats.totalMinionsDamageDealt['TB_BaconUps_108']);

		expect(stats).not.toBe(null);
		expect(stats.totalMinionsDamageDealt['BGS_038']).toBe(5 + 5 + 4 + 5 + 6 + 6 + 6);
		expect(stats.totalMinionsDamageTaken['BGS_038']).toBe(3 + 11 + 8 + 4 + 6 + 6 + 2 + 11);
	});
});
