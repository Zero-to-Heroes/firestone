import { Injectable } from '@angular/core';
import { CardAnalysis, MatchAnalysis } from '@firestone-hs/assign-constructed-archetype';
import { decode } from '@firestone-hs/deckstrings';
import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { getBaseCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { StatGameModeType } from '@firestone/stats/data-access';
import { GameForUpload } from '../model/game-for-upload/game-for-upload';
import { cardDrawn } from './match-analysis/parsers/cards-draw-parser';
import { cardsInHand } from './match-analysis/parsers/cards-in-hand-parser';
import { extractPlayedCards } from './match-analysis/played-card-extractor';
import { ReplayParser } from './match-analysis/replay-parser';

const GAME_MODES_WITH_ANALYSIS: readonly StatGameModeType[] = [
	'ranked',
	'arena',
	'duels',
	'paid-duels',
	'tavern-brawl',
	'casual',
	'friendly',
	'practice',
];

@Injectable()
export class MatchAnalysisService {
	constructor(private readonly allCards: CardsFacadeService) {}

	public buildMatchStats(game: GameForUpload): MatchAnalysis | null {
		if (!GAME_MODES_WITH_ANALYSIS.includes(game.gameMode)) {
			console.debug('[match-analysis] not analyzing game mode', game.gameMode);
			return null;
		}
		if (!game.deckstring?.length == null) {
			return null;
		}

		const replay: Replay = game.replay;

		const parser = new ReplayParser(replay, [cardsInHand, cardDrawn]);
		let cardsAfterMulligan: { cardId: string; kept: boolean }[] = [];
		let cardsBeforeMulligan: string[] = [];
		let cardsDrawn: { cardId: string; cardDbfId: number; turn: number }[] = [];
		parser.on('cards-in-hand', (event) => {
			if (cardsBeforeMulligan?.length === 0) {
				cardsBeforeMulligan = event.cardsInHand.map((cardId) => getBaseCardId(cardId));
			} else {
				cardsAfterMulligan = event.cardsInHand.map((cardId) => {
					const baseCardId = getBaseCardId(cardId);
					return {
						cardId: baseCardId,
						kept: cardsBeforeMulligan.includes(baseCardId),
					};
				});
			}
		});
		parser.on('card-draw', (event) => {
			const baseCardId = getBaseCardId(event.cardId);
			// console.debug('card drawn', event.cardId);
			cardsDrawn = [
				...cardsDrawn,
				{ cardId: baseCardId, cardDbfId: this.allCards.getCard(baseCardId).dbfId, turn: event.turn },
			];
		});
		parser.parse();

		const finalCardsAfterMulligan = [...cardsAfterMulligan];
		const finalCardsDrawn = [...cardsDrawn];

		const deckDefinition = decode(game.deckstring);
		// List of cards, ordered by id, including duplicates
		const deckCards = deckDefinition.cards
			.flatMap((pair) => new Array(pair[1]).fill(this.allCards.getCard(pair[0]).id))
			.sort();
		const cardsAnalysis: readonly CardAnalysis[] = deckCards.map((cardId) => {
			// Remove the info from cards after mulligan
			const cardAfterMulligan = cardsAfterMulligan.find((c) => c.cardId === cardId);
			if (cardAfterMulligan) {
				cardsAfterMulligan = cardsAfterMulligan.filter((c) => c !== cardAfterMulligan);
			}
			const cardBeforeMulliganIdx = cardsBeforeMulligan.indexOf(cardId);
			if (cardBeforeMulliganIdx !== -1) {
				// Remove the info from cardsBeforeMulligan array, but be careful not to remove duplicates
				cardsBeforeMulligan.splice(cardBeforeMulliganIdx, 1);
			}
			const cardDrawn = cardsDrawn.find((c) => c.cardId === cardId);
			if (cardDrawn) {
				cardsDrawn = cardsDrawn.filter((c) => c !== cardDrawn);
			}

			return {
				cardId: cardId,
				drawnBeforeMulligan: cardBeforeMulliganIdx !== -1,
				mulligan: !!cardAfterMulligan,
				kept: cardAfterMulligan?.kept ?? false,
				drawnTurn: cardDrawn?.turn,
			};
		});

		const result: MatchAnalysis = {
			cardsAnalysis: cardsAnalysis,
			cardsAfterMulligan: finalCardsAfterMulligan,
			cardsDrawn: finalCardsDrawn,
		};
		return result;
	}

	public buildCardsPlayed(playerId: number, replay: Replay): readonly string[] {
		return extractPlayedCards(replay, playerId);
	}
}
