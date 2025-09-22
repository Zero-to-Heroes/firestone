import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { modifyDecksForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class PassiveTriggeredParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		console.log('[passive] will apply event', cardId, controllerId, localPlayer, entityId);
		if (!cardId) {
			console.log('[passive] no cardId for passive');
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const opponentDeck = !isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardData = cardId ? this.allCards.getCard(cardId) : null;
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: cardData?.name,
			refManaCost: cardData?.cost,
			rarity: cardData?.rarity?.toLowerCase(),
		} as DeckCard);

		const newGlobalEffects: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.globalEffects, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			globalEffects: newGlobalEffects,
		});

		const [playerDeckAfterSpecialCaseUpdate, opponentDeckAfterSpecialCaseUpdate] = modifyDecksForSpecialCards(
			cardId,
			entityId,
			false,
			newPlayerDeck,
			opponentDeck,
			this.allCards,
			this.helper,
			this.i18n,
		);
		if (playerDeckAfterSpecialCaseUpdate !== newPlayerDeck || opponentDeckAfterSpecialCaseUpdate !== opponentDeck) {
			console.log(
				'[passive] updated deck for passive',
				cardId,
				playerDeckAfterSpecialCaseUpdate !== newPlayerDeck,
				opponentDeckAfterSpecialCaseUpdate !== opponentDeck,
			);
		}

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: playerDeckAfterSpecialCaseUpdate,
			[!isPlayer ? 'playerDeck' : 'opponentDeck']: opponentDeckAfterSpecialCaseUpdate,
		});
	}

	event(): string {
		return GameEvent.PASSIVE_BUFF;
	}
}
