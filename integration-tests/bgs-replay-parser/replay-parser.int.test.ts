import {
	BgsPostMatchStats,
	parseBattlegroundsGame,
	parseHsReplayString,
	Replay,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsPlayer } from '../../core/src/js/models/battlegrounds/bgs-player';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	test('sanity', async () => {
		const replayXml = replayXmlTest;
		const replay: Replay = parseHsReplayString(replayXml);
		console.debug('additional result', replay.additionalResult);

		const stats: BgsPostMatchStats = parseBattlegroundsGame(replayXml, BgsPlayer.create({} as BgsPlayer), []);

		expect(stats).not.toBe(null);
		// console.debug(stats.leaderboardPositionOverTurn);
	});
});
