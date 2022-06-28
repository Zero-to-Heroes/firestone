import { Injectable } from '@angular/core';
import { extractTotalDuration, extractTotalTurns, Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { MatchResultType } from '../../models/mainwindow/replays/match-result.type';
import { StatGameFormatType } from '../../models/mainwindow/stats/stat-game-format.type';
import { StatGameModeType } from '../../models/mainwindow/stats/stat-game-mode.type';
import { GameForUpload as Game } from './game-for-upload';

@Injectable()
export class GameParserService {
	plugin: any;
	initialized: boolean;

	constructor(private cards: CardsFacadeService) {}

	public toFormatType(formatType: number): StatGameFormatType {
		switch (formatType) {
			case 0:
				return 'unknown';
			case 1:
				return 'wild';
			case 2:
				return 'standard';
			case 3:
				return 'classic';
			default:
				console.warn('unsupported format type', formatType);
				return 'unknown';
		}
	}

	public toGameType(gameType: number): StatGameModeType {
		switch (gameType) {
			case 0:
				return 'unknown';
			case 1:
				return 'practice';
			case 2:
				return 'friendly';
			case 4:
				return 'tutorial';
			case 5:
				return 'arena';
			case 7:
				return 'ranked';
			case 8:
				return 'casual';
			case 16:
			case 17:
			case 18:
			case 19:
			case 20:
			case 21:
			case 22:
				return 'tavern-brawl';
			case GameType.GT_BATTLEGROUNDS:
				return 'battlegrounds';
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
				return 'battlegrounds-friendly';
			case GameType.GT_MERCENARIES_AI_VS_AI:
				return 'mercenaries-ai-vs-ai';
			case GameType.GT_MERCENARIES_FRIENDLY:
				return 'mercenaries-friendly';
			case GameType.GT_MERCENARIES_PVE:
				return 'mercenaries-pve';
			case GameType.GT_MERCENARIES_PVP:
				return 'mercenaries-pvp';
			case GameType.GT_MERCENARIES_PVE_COOP:
				return 'mercenaries-pve-coop';
			case GameType.GT_PVPDR:
				return 'duels';
			case GameType.GT_PVPDR_PAID:
				return 'paid-duels';
			default:
				console.warn('unsupported game type', gameType);
				return 'unknown';
		}
	}

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
