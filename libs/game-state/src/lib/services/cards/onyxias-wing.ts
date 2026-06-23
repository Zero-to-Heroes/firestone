/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Onyxia's Wing (CATA_155t / CATA_155t1) — Colossal limb from Arisen Onyxia (CATA_155).
 * Text: When summoned, get a random 2-Cost minion. It costs Health this turn. Herald twice to upgrade.
 * The random minion mana band is stored in {@link GameTag.TAG_SCRIPT_DATA_NUM_1} (upgrades with Herald).
 */
import { CardClass, CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getControllerEntity, getEntityTag } from '../parser-entity-utils';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { resolveStoredRandomMinionCost } from './stored-random-minion-cost';
import { filterCards } from './utils';

const CATACLYSM_COLOSSAL_BY_CLASS: Partial<Record<CardClass, string>> = {
	[CardClass.DEATHKNIGHT]: CardIds.ArisenOnyxia_CATA_155,
	[CardClass.DEMONHUNTER]: CardIds.AzsharaOceanLord_CATA_151,
	[CardClass.DRUID]: CardIds.Wickerfang_CATA_139,
	[CardClass.MAGE]: CardIds.ArchmageKalec_CATA_458,
	[CardClass.HUNTER]: CardIds.Magmaw_CATA_550,
	[CardClass.PALADIN]: CardIds.Chromatus_CATA_432,
	[CardClass.PRIEST]: CardIds.TheBlackBlood_CATA_300,
	[CardClass.ROGUE]: CardIds.Sinestra_CATA_154,
	[CardClass.SHAMAN]: CardIds.AlakirLordOfStorms_CATA_153,
	[CardClass.WARLOCK]: CardIds.ChogallMastermind_CATA_726,
	[CardClass.WARRIOR]: CardIds.RagnarosTheGreatFire_CATA_150,
};

export const OnyxiasWing: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.ArisenOnyxia_OnyxiasWingToken_CATA_155t, CardIds.ArisenOnyxia_OnyxiasWingToken_CATA_155t1],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const wingEntityId = input.creatorEntityId ?? input.card.creatorEntityId ?? input.card.entityId;
		const cost = resolveWingPoolCost(wingEntityId, input.card.cardId ?? OnyxiasWing.cardIds[0], input);
		return {
			cardType: CardType.MINION,
			cost,
			possibleCards: filterCards(
				OnyxiasWing.cardIds[0],
				input.allCards,
				(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
				input.options,
			),
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost = resolveWingPoolCost(input.entityId, input.cardId, input);
		return filterCards(
			OnyxiasWing.cardIds[0],
			input.allCards,
			(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};

const resolveWingPoolCost = (
	entityId: number | null | undefined,
	referenceCardId: string,
	input: GuessInfoInput | StaticGeneratingCardInput,
): number => {
	const storedInput: StaticGeneratingCardInput =
		'inputOptions' in input
			? input
			: {
					entityId: entityId ?? input.card.entityId,
					cardId: referenceCardId,
					allCards: input.allCards,
					inputOptions: {
						format: input.gameState.metadata.formatType,
						gameType: input.gameState.metadata.gameType,
						scenarioId: input.gameState.metadata.scenarioId,
						currentClass: input.options.currentClass ?? '',
						deckState: input.deckState,
						opponentDeckState: input.opponentDeckState,
						gameState: input.gameState,
						validArenaPool: input.options.validArenaPool,
						initialDecklist: input.options.initialDecklist ?? [],
					},
				};
	const fromScript = resolveStoredRandomMinionCost(storedInput, OnyxiasWing.cardIds[0], {
		useCreatorEntityFallback: false,
	});
	if (fromScript > 2) {
		return fromScript;
	}
	const side = storedInput.inputOptions.deckState.isOpponent ? 'opponent' : 'player';
	const heraldAmount = getHeraldAmount(storedInput.inputOptions.gameState, side) ?? 0;
	return heraldAmount >= 4 ? 8 : heraldAmount >= 2 ? 4 : fromScript;
};

export const getHeraldAmount = (gameState: GameState, side: 'player' | 'opponent'): number | null => {
	if (!getColossalForSide(gameState, side)) {
		return null;
	}
	const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
	const eventCount = deck?.heraldCountThisGame ?? 0;
	const playerId = side === 'player' ? gameState.localPlayerId : gameState.opponentPlayerId;
	const controllerEntity =
		playerId != null
			? getControllerEntity(
					gameState.parserState?.CurrentEntities,
					gameState.parserState?.ControllerEntityMap,
					playerId,
				)
			: undefined;
	const fullStateCount = getEntityTag(controllerEntity, GameTag.HERALD_COLOSSAL_AMOUNT, 0);
	// Prefer event-based count for real-time updates; fall back to fullGameState for replays/rewinds
	const amount = eventCount > 0 ? eventCount : (fullStateCount ?? null);
	return amount != null && amount > 0 ? amount : null;
};

export const getColossalForSide = (gameState: GameState, side: 'player' | 'opponent'): string | undefined => {
	const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
	const playerId = side === 'player' ? gameState.localPlayerId : gameState.opponentPlayerId;
	const controllerEntity =
		playerId != null
			? getControllerEntity(
					gameState.parserState?.CurrentEntities,
					gameState.parserState?.ControllerEntityMap,
					playerId,
				)
			: undefined;
	const playerClass = getEntityTag(controllerEntity, GameTag.HERALD_COLOSSAL_CLASS);
	const result = playerClass != null ? CATACLYSM_COLOSSAL_BY_CLASS[playerClass] : undefined;
	return result;
};
