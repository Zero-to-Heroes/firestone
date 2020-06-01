import {
	BattleResultHistory,
	BgsPlayer,
	BgsPostMatchStats as IBgsPostMatchStats,
	parseBattlegroundsGame,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';

const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.onmessage = async ev => {
	const input = ev.data;
	console.log('received message in worker');

	const replayXml: string = input.replayXml;
	const mainPlayer: BgsPlayer = input.mainPlayer;
	const battleResultHistory: readonly BattleResultHistory[] = input.battleResultHistory;
	// Here it's serialized, so we lose the methods and only keey the data
	const result: IBgsPostMatchStats = parseBattlegroundsGame(replayXml, mainPlayer, battleResultHistory);

	console.log('worker result');

	ctx.postMessage(JSON.stringify(result));
};
