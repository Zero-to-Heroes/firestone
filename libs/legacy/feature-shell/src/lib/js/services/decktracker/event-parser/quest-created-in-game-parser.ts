import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { globalEffectQuestlines, globalEffectQuestlinesTriggers } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class QuestCreatedInGameParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.QUEST_CREATED_IN_GAME;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const dbCard = this.cards.getCard(cardId);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: this.i18n.getCardName(cardId, dbCard.name),
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			creatorCardId: creatorCardId,
			zone: 'SECRET',
			putIntoPlay: true,
		} as DeckCard);
		const previousOtherZone = deck.otherZone;
		// Because when we discover a quest (BG), the quest is already in the otherZone, but with another "zone" attribute
		const newOtherZone: readonly DeckCard[] = this.helper.empiricReplaceCardInZone(previousOtherZone, card, true);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		if (globalEffectQuestlinesTriggers.includes(cardId as CardIds)) {
			const globalEffectCard = this.cards.getCard(
				globalEffectQuestlines.find((q) => q.questStepCreated === cardId).stepReward,
			);
			newGlobalEffects = this.helper.addSingleCardToZone(
				deck.globalEffects,
				DeckCard.create({
					cardId: globalEffectCard.id,
					cardName: this.i18n.getCardName(globalEffectCard.id, globalEffectCard.name),
					manaCost: globalEffectCard.cost,
					rarity: globalEffectCard.rarity,
					creatorCardId: cardId,
					zone: 'SECRET',
				} as DeckCard),
			);
		}

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			otherZone: newOtherZone,
			globalEffects: newGlobalEffects,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.QUEST_CREATED_IN_GAME;
	}
}
