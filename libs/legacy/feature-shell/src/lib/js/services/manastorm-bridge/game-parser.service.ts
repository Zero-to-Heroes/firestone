import { Injectable } from '@angular/core';
import { extractTotalDuration, extractTotalTurns, Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MatchResultType } from '../../models/mainwindow/replays/match-result.type';
import { GameForUpload as Game } from './game-for-upload';

@Injectable()
export class GameParserService {
	plugin: any;
	initialized: boolean;

	constructor(private cards: CardsFacadeService) {}

	public extractDuration(replay: Replay, game: Game) {
		game.durationTimeSeconds = extractTotalDuration(replay);
		game.durationTurns = extractTotalTurns(replay);
	}

	public extractMatchup(replay: Replay, game: Game): void {
		if (!replay) {
			console.error('[manastorm-bridge] invalid game, not adding any meta data');
			return;
		}

		game.player = {
			hero: replay.mainPlayerCardId,
			class: this.cards.getCard(replay.mainPlayerCardId)?.playerClass?.toLowerCase(),
			name: replay.mainPlayerName,
		};
		game.opponent = {
			hero: replay.opponentPlayerCardId,
			class: this.cards.getCard(replay.opponentPlayerCardId)?.playerClass?.toLowerCase(),
			name: replay.opponentPlayerName,
		};

		game.title =
			!!game.player?.name && !!game.opponent?.name
				? game.player.name.replace('"', '') + ' vs ' + game.opponent.name.replace('"', '')
				: 'Unknown matchup';

		game.result = replay.result as MatchResultType;
	}
}
