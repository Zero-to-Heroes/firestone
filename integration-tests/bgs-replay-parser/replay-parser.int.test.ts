import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import {
	BattleResultHistory,
	parseBattlegroundsGame,
	parseHsReplayString,
	Replay,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsPlayer } from '../../core/src/js/models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../core/src/js/models/battlegrounds/post-match/bgs-post-match-stats';
import { replayXmlTest } from './replay';

describe('BGS Replay-parser - basic test', () => {
	test('sanity', async () => {
		const replayXml = replayXmlTest;
		const replay: Replay = parseHsReplayString(replayXml);
		console.debug('additional result', replay.additionalResult);

		const mainPlayer: BgsPlayer = null;
		const battleResultHistory: readonly BattleResultHistory[] = [];
		const faceOffs: readonly BgsFaceOff[] = [];
		// Here it's serialized, so we lose the methods and only keey the data
		const stats: BgsPostMatchStats = parseBattlegroundsGame(replayXml, BgsPlayer.create({} as BgsPlayer), [], []);

		expect(stats).not.toBe(null);
		console.debug(stats.coinsWastedOverTurn);
	});
});
