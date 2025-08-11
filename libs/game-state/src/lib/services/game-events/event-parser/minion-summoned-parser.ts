import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard, toTagsObject } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { revealCard } from '../card-reveal';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class MinionSummonedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData?.creatorCardId;
		const creatorEntityId = gameEvent.additionalData?.creatorEntityId;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = getProcessedCard(cardId, entityId, deck, this.cards);
		const costFromTags = gameEvent.additionalData.tags?.find((t) => t.Name === GameTag.COST)?.Value;
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			refManaCost: dbCard.cost,
			actualManaCost: costFromTags ?? dbCard.cost,
			rarity: dbCard.rarity?.toLowerCase(),
			creatorCardId: creatorCardId,
			creatorEntityId: creatorEntityId,
			zone: 'PLAY',
			temporaryCard: false,
			playTiming: GameState.playTiming++,
			putIntoPlay: true,
			tags: toTagsObject(gameEvent.additionalData.tags),
		});

		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.board, card);

		// In Broxigar's demons' case, the card is first REVEALED, which creates in the other zone,
		// then it's summoned, which puts it on board
		let newOtherZone = deck.otherZone;
		if (newOtherZone.some((e) => e.entityId === entityId)) {
			newOtherZone = newOtherZone.filter((e) => e.entityId !== entityId);
		}
		const newPlayerDeck = deck.update({
			board: newBoard,
			otherZone: newOtherZone,
		});

		// const playerDeckAfterReveal = isPlayer ? newPlayerDeck : currentState.playerDeck;
		// const opponentDeckAfterReveal = isPlayer ? currentState.opponentDeck : revealCard(newPlayerDeck, card);

		// return currentState.update({
		// 	playerDeck: playerDeckAfterReveal,
		// 	opponentDeck: opponentDeckAfterReveal,
		// });

		return Object.assign(new GameState(), currentState, {
			playerDeck: isPlayer ? newPlayerDeck : currentState.playerDeck,
			opponentDeck: isPlayer ? currentState.opponentDeck : revealCard(newPlayerDeck, card, this.cards),
		});
	}

	event(): string {
		return GameEvent.MINION_SUMMONED;
	}
}
