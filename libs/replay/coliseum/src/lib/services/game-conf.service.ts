import { Injectable } from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
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
		return this.game && isBattlegrounds(this.game.gameType);
	}
}
