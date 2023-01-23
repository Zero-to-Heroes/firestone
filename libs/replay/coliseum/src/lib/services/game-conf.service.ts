import { Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { Game } from '@firestone-hs/replay-parser';

@Injectable({
	providedIn: 'root',
})
export class GameConfService {
	private game: Game;

	public updateConfig(game: Game) {
		this.game = game;
	}

	public isBattlegrounds(): boolean {
		return (
			this.game &&
			(this.game.gameType === GameType.GT_BATTLEGROUNDS ||
				this.game.gameType === GameType.GT_BATTLEGROUNDS_FRIENDLY)
		);
	}
}
