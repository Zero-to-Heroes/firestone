import { Injectable } from '@angular/core';
import { decode } from '@firestone-hs/deckstrings';
import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { getBaseCardId } from '@firestone-hs/reference-data';
import { CardAnalysis, MatchAnalysis } from '@firestone-hs/replay-metadata';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { StatGameModeType } from '@firestone/stats/data-access';
import { GameForUpload } from '../model/game-for-upload/game-for-upload';
import { cardDiscovered } from './match-analysis/parsers/cards-discovered-parser';
import { cardDrawn } from './match-analysis/parsers/cards-draw-parser';
import { cardsInHand } from './match-analysis/parsers/cards-in-hand-parser';
import { cardPlayed } from './match-analysis/parsers/cards-play-parser';
import { extractPlayedCards } from './match-analysis/played-card-extractor';
import { ReplayParser } from './match-analysis/replay-parser';

const GAME_MODES_WITH_ANALYSIS: readonly StatGameModeType[] = [
	'ranked',
	'arena',
	'arena-underground',
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
		if (!game.deckstring?.length) {
			return null;
		}

		const replay: Replay = game.replay;

		const parser = new ReplayParser(replay, this.allCards, [cardsInHand, cardDrawn, cardPlayed, cardDiscovered]);
		let cardsAfterMulligan: { cardId: string; kept: boolean }[] = [];
		let cardsBeforeMulligan: string[] = [];
		let cardsDrawn: MatchAnalysis['cardsDrawn'] = [];
		let cardsDiscovered: MatchAnalysis['cardsDiscovered'] = [];
		let cardsPlayed: { cardId: string; cardDbfId: number; turn: number }[] = [];
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
		parser.on('card-play', (event) => {
			const baseCardId = getBaseCardId(event.cardId);
			// console.debug('card played', event.cardId);
			cardsPlayed = [
				...cardsPlayed,
				{ cardId: baseCardId, cardDbfId: this.allCards.getCard(baseCardId).dbfId, turn: event.turn },
			];
		});
		parser.on('card-discovered', (event) => {
			const baseCardId = getBaseCardId(event.cardId);
			const sourceCardId = getBaseCardId(event.sourceCardId);
			// console.debug('card created', event.cardId, event.sourceCardId);
			cardsDiscovered = [
				...cardsDiscovered,
				{
					cardId: baseCardId,
					cardDbfId: this.allCards.getCard(baseCardId).dbfId,
					turn: event.turn,
					sourceCardId: sourceCardId,
				},
			];
		});
		parser.parse();

		const finalCardsBeforeMulligan = [...cardsBeforeMulligan];
		const finalCardsAfterMulligan = [...cardsAfterMulligan];
		const finalCardsDrawn = [...cardsDrawn];
		const finalCardsPlayed = [...cardsPlayed];

		const deckDefinition = decode(game.deckstring);
		// List of cards, ordered by id, including duplicates
		const deckCards = deckDefinition.cards
			.flatMap((pair) => new Array(pair[1]).fill(this.allCards.getCard(pair[0]).id))
			.sort();
		const cardsAnalysis: readonly CardAnalysis[] = deckCards.map((cardId) => {
			const refCard = this.allCards.getCard(cardId);
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
			const cardPlayed = cardsPlayed.find((c) => c.cardId === cardId);
			if (cardPlayed) {
				cardsPlayed = cardsPlayed.filter((c) => c !== cardPlayed);
			}

			const playedTurn = cardPlayed?.turn == null ? null : Math.ceil(cardPlayed.turn / 2);
			return {
				cardId: cardId,
				drawnBeforeMulligan: cardBeforeMulliganIdx !== -1,
				mulligan: !!cardAfterMulligan,
				kept: cardAfterMulligan?.kept ?? false,
				drawnTurn: cardDrawn?.turn,
				playedTurn: playedTurn,
				playedOnCurve: playedTurn == null || refCard.cost == null ? false : playedTurn <= refCard.cost,
			};
		});

		// console.debug(
		// 	'cards played',
		// 	cardsAnalysis.filter((c) => c.playedTurn),
		// );
		// console.debug('cardsCreated', cardsDiscovered);
		const result: MatchAnalysis = {
			cardsAnalysis: cardsAnalysis,
			// type: 'discovered' | 'generated'
			// sourceCardId: string
			cardsDiscovered: cardsDiscovered,
			cardsBeforeMulligan: finalCardsBeforeMulligan,
			cardsAfterMulligan: finalCardsAfterMulligan,
			cardsDrawn: finalCardsDrawn,
		};
		return result;
	}

	public buildCardsPlayed(playerId: number, replay: Replay): readonly string[] {
		return extractPlayedCards(replay, playerId);
	}
}
