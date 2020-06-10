import {
	parseBattlegroundsGame,
	parseHsReplayString,
	Replay,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsPlayer } from '../../core/src/js/models/battlegrounds/bgs-player';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	test('minion damage is correct', async () => {
		const replayXml = replayXmlTest;
		console.time('start parsing');
		const replay: Replay = parseHsReplayString(replayXml);
		console.timeEnd('startParsing');

		const stats = parseBattlegroundsGame(replayXml, BgsPlayer.create({} as BgsPlayer), []);

		expect(stats).not.toBe(null);
		console.debug(stats.mainPlayerHeroPowersOverTurn);
		console.debug(stats.rerollsOverTurn);

		// expect(stats.hpOverTurn['TB_BaconShop_HERO_56'].length).toBe(14);
		// expect(stats.hpOverTurn['TB_BaconShop_HERO_56'][13].value).toBeLessThanOrEqual(0);
	});
});
