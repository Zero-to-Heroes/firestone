import { Injectable } from '@angular/core';
import { SimpleIOService } from '../plugins/simple-io.service';
import { GameForUpload } from './game-for-upload';
import { GameHelper } from './game-helper.service';

@Injectable()
export class ReplayManager {
	constructor(private gameHelper: GameHelper, private plugin: SimpleIOService) {
		console.log('[manastorm-bridge] starting replay-manager service');
	}

	public async saveLocally(game: GameForUpload): Promise<GameForUpload> {
		console.log('[manastorm-bridge] ready to save game locally');
		if (!game.player || !game.opponent) {
			console.error(
				'[manastorm-bridge] Could not find player and opponent, not saving replay',
				game.player,
				game.opponent,
				game,
			);
			return;
		}
		const plugin = await this.plugin.get();
		const directory = plugin.LOCALAPPDATA + '/Overwolf/ZeroToHeroes/Replays/';
		const playerName = game.player.name.replace('"', '');
		const opponentName = game.opponent.name.replace('"', '');
		const matchupName = `${playerName}(${game.player.class})_vs_${opponentName}(${game.opponent.class})`;
		const fileName = `${matchupName}_${new Date().getTime()}.hszip`;
		console.log('[manastorm-bridge] saving locally', directory + fileName);
		return new Promise<GameForUpload>(resolve => {
			plugin.writeLocalAppDataZipFile(
				directory + fileName,
				'replay.xml',
				this.gameHelper.getXmlReplay(game),
				false,
				(status, message) => {
					console.log('[manastorm-bridge] local zip file saved', status, message);
					game.path = directory + fileName;
					plugin.getBinaryFile(game.path, -1, async (binaryStatus, data) => {
						console.log(
							'[manastorm-bridge] reading binary file before storing it in localstorage',
							game.path,
							binaryStatus,
						);
						const split = data.split(',');
						const bytes = [];
						for (let i = 0; i < split.length; i++) {
							bytes[i] = parseInt(split[i]);
						}
						game.replayBytes = bytes;
						resolve(game);
					});
				},
			);
		});
	}
}
