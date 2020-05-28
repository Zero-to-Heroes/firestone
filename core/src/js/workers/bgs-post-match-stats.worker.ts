import {
	BattleResultHistory,
	BgsPlayer,
	parseBattlegroundsGame,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsPostMatchStats } from '../models/battlegrounds/post-match/bgs-post-match-stats';

const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.onmessage = async ev => {
	const input = ev.data;
	console.log('received message in worker', input, ev);

	const replayXml: string = input.replayXml;
	const mainPlayer: BgsPlayer = input.mainPlayer;
	const battleResultHistory: readonly BattleResultHistory[] = input.battleResultHistory;
	const result: BgsPostMatchStats = parseBattlegroundsGame(replayXml, mainPlayer, battleResultHistory);

	console.log('worker result', result);

	ctx.postMessage(JSON.stringify(result));
};
