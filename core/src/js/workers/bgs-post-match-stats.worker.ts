import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import {
	BattleResultHistory,
	BgsPlayer,
	BgsPostMatchStats as IBgsPostMatchStats,
	parseBattlegroundsGame,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';

// const ctx: Worker = self as any;

// Respond to message from parent thread
self.onmessage = async (ev) => {
	let input = ev.data;
	console.log('received message in worker');

	const replayXml: string = input.replayXml;
	const mainPlayer: BgsPlayer = input.mainPlayer;
	const battleResultHistory: readonly BattleResultHistory[] = input.battleResultHistory;
	const faceOffs: readonly BgsFaceOff[] = input.faceOffs;
	// Here it's serialized, so we lose the methods and only keey the data
	let result: IBgsPostMatchStats = parseBattlegroundsGame(replayXml, mainPlayer, battleResultHistory, faceOffs);

	// console.log('worker result', JSON.stringify(result, null, 4));

	(self as any).postMessage(JSON.stringify(result));
	result = null;
	input = null;
};
