export class GameForUpload {
	id: string;
	reviewId: string;
	title: string;

	spectating: boolean;

	gameMode: string;
	gameFormat: string;
	buildNumber: number;
	scenarioId: string;
	playerRank: string;
	opponentRank: string;
	result: string;
	arenaInfo: any;
	durationTimeSeconds: number;
	durationTurns: number;
	ended: boolean;

	player: Player = new Player();
	opponent: Player = new Player();

	deckstring: string;
	deckName: string;
	replay: string;

	// We don't send this over the network, but it avoids compression / decompression when
	// using it locally in the GS
	uncompressedXmlReplay: string;
	path: string;
	replayBytes: any[];

	static createEmptyGame(id: string): GameForUpload {
		const game = new GameForUpload();
		game.id = id;
		return game;
	}
}

export class Player {
	name: string;
	class: string;
	hero: string;
}
