import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameEvent, GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { globalEffectQuestlines, globalEffectQuestlinesTriggers } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class QuestCreatedInGameParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;
		const creatorEntityId = gameEvent.additionalData ? gameEvent.additionalData.creatorEntityId : null;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const dbCard = getProcessedCard(cardId, entityId, deck, this.cards);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			refManaCost: dbCard.cost,
			rarity: dbCard.rarity,
			creatorCardId: creatorCardId,
			creatorEntityId: creatorEntityId,
			zone: 'SECRET',
			putIntoPlay: true,
		});
		// console.debug('[quest-created-in-game] created card', card, dbCard);
		const previousOtherZone = deck.otherZone;
		// Because when we discover a quest (BG), the quest is already in the otherZone, but with another "zone" attribute
		const newOtherZone: readonly DeckCard[] = this.helper.empiricReplaceCardInZone(previousOtherZone, card, true);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		if (
			globalEffectQuestlinesTriggers.includes(cardId as CardIds) ||
			// For Twist passive abilities
			dbCard.mechanics?.includes(GameTag[GameTag.OBJECTIVE])
		) {
			// console.debug('[quest-created-in-game] adding objective to global effects', card);
			const stepCard = globalEffectQuestlines.find((q) => q.questStepCreated === cardId);
			const globalEffectCard = !!stepCard?.stepReward ? this.cards.getCard(stepCard.stepReward) : dbCard;
			// console.debug('[quest-created-in-game] globalEffectCard', globalEffectCard);
			newGlobalEffects = this.helper.addSingleCardToZone(
				deck.globalEffects,
				DeckCard.create({
					// We don't want to remove the quests from global effects once they are completed, but we do
					// want to remove objectives once they are completed
					entityId: dbCard.mechanics?.includes(GameTag[GameTag.OBJECTIVE]) ? entityId : null,
					cardId: globalEffectCard.id,
					cardName: globalEffectCard.name,
					refManaCost: globalEffectCard.cost,
					rarity: globalEffectCard.rarity,
					creatorCardId: cardId,
					zone: 'SECRET',
				} as DeckCard),
			);
			// console.debug('[quest-created-in-game] newGlobalEffects', newGlobalEffects);
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
