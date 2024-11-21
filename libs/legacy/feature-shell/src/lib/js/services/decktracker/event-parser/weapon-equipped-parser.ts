import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class WeaponEquippedParser implements EventParser {
	constructor(
		private readonly cards: CardsFacadeService,
		private readonly helper: DeckManipulationHelper,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.cards.getCard(cardId);
		// const creator = gameEvent.additionalData.creatorId;
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: this.i18n.getCardName(cardId, dbCard.name),
			refManaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'PLAY',
			temporaryCard: false,
			playTiming: GameState.playTiming++,
			creatorCardId: gameEvent.additionalData.creatorCardId,
		} as DeckCard);

		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.otherZone, card);
		const newPlayerDeck = deck.update({
			weapon: card,
			otherZone: newOtherZone,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.WEAPON_EQUIPPED;
	}
}
