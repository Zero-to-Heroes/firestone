import { Injectable } from '@angular/core';
import { CardIds, CardType, GameTag, isBattlegrounds, Race, Zone } from '@firestone-hs/reference-data';
import {
	addBoardTribe,
	countBoardTribes,
	DarkGiftGameContext,
	DarkGiftMinionView,
	getAllCardsInGame,
	getDarkDiscoveryTurnFloor,
	getMostCommonTribes,
	isDarkDiscoveryPoolMinion,
	pickDarkGiftBoardCardIds,
	resolveGuaranteedTribes,
	toDarkGiftMinionView,
} from '@firestone/battlegrounds/core';
import {
	EntityLike,
	GameStateFacadeService,
	getBoard,
	getControllerEntity,
	getEffectiveController,
	getEntitiesForPlayer,
	getEntityTag,
} from '@firestone/game-state';
import { CardMousedOverService } from '@firestone/memory';
import {
	AbstractFacadeService,
	AppInjector,
	CardRulesService,
	CardsFacadeService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { auditTime, BehaviorSubject, combineLatest, distinctUntilChanged, map } from 'rxjs';

export interface DarkGiftLiveContext extends DarkGiftGameContext {
	readonly currentTurn: number;
	readonly usesLeft: number | null;
	readonly mostCommonTribes: readonly Race[];
	readonly minions: readonly DarkGiftMinionView[];
}

@Injectable({ providedIn: 'root' })
export class BgsDarkGiftOverlayService extends AbstractFacadeService<BgsDarkGiftOverlayService> {
	public buttonHovered$$: BehaviorSubject<boolean>;
	public context$$: BehaviorSubject<DarkGiftLiveContext | null>;

	private gameState: GameStateFacadeService;
	private mouseOver: CardMousedOverService;
	private allCards: CardsFacadeService;
	private cardRules: CardRulesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsDarkGiftOverlayService', () => !!this.buttonHovered$$);
	}

	protected override assignSubjects() {
		this.buttonHovered$$ = this.mainInstance.buttonHovered$$;
		this.context$$ = this.mainInstance.context$$;
	}

	protected async init() {
		this.buttonHovered$$ = new BehaviorSubject<boolean>(false);
		this.context$$ = new BehaviorSubject<DarkGiftLiveContext | null>(null);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.mouseOver = AppInjector.get(CardMousedOverService);
		this.allCards = AppInjector.get(CardsFacadeService);
		this.cardRules = AppInjector.get(CardRulesService);

		await waitForReady(this.gameState, this.mouseOver, this.cardRules);
		await this.allCards.waitForReady();

		this.mouseOver.mousedOverCard$$
			.pipe(
				map((card) => ({
					hovered: card?.CardId === CardIds.DarkDiscoveryToken_BG36_Button_DarkGift,
					cardId: card?.CardId ?? null,
					entityId: card?.EntityId ?? null,
					playerId: card?.PlayerId ?? null,
					zone: card?.Zone ?? null,
				})),
				distinctUntilChanged(
					(a, b) =>
						a.hovered === b.hovered &&
						a.cardId === b.cardId &&
						a.entityId === b.entityId &&
						a.playerId === b.playerId,
				),
			)
			.subscribe((info) => {
				this.buttonHovered$$.next(info.hovered);
			});

		let seenDarkGiftsThisGame = false;
		combineLatest([this.gameState.gameState$$, this.cardRules.rules$$, this.buttonHovered$$])
			.pipe(
				auditTime(200),
				map(([state, cardRules, buttonHovered]) => {
					if (
						!state?.gameStarted ||
						state.gameEnded ||
						!state.bgState.currentGame ||
						!state.bgState.heroSelectionDone ||
						!isBattlegrounds(state.metadata?.gameType)
					) {
						seenDarkGiftsThisGame = false;
						return null;
					}
					const currentTurn = state.currentTurnNumeric ?? 0;
					const game = state.bgState.currentGame;
					const player = game.getMainPlayer();
					const playerId = state.localPlayerId;
					const entities = state.parserState?.CurrentEntities;
					const button =
						playerId != null
							? getEntitiesForPlayer(entities, playerId).find(
									(e) => e.CardId === CardIds.DarkDiscoveryToken_BG36_Button_DarkGift,
								)
							: undefined;
					if (
						!!button ||
						buttonHovered ||
						game.anomalies?.includes(CardIds.DarkGifts_BG36_Anomaly_002) ||
						(playerId != null &&
							getEntityTag(
								getControllerEntity(entities, state.parserState?.ControllerEntityMap, playerId),
								GameTag.BACON_DARK_GIFTS_ACTIVE,
								0,
							) > 0)
					) {
						seenDarkGiftsThisGame = true;
					}
					if (!seenDarkGiftsThisGame) {
						return null;
					}
					const usesTag = button ? getEntityTag(button, GameTag.TAG_SCRIPT_DATA_NUM_2, -1) : -1;
					const controller =
						playerId != null
							? getControllerEntity(entities, state.parserState?.ControllerEntityMap, playerId)
							: undefined;
					const trinkets = [player?.lesserTrinket, player?.greaterTrinket].filter((t): t is string => !!t);
					const anomalies = game.anomalies ?? [];
					const availableTribes = game.availableRaces ?? [];
					const controllerIds = [player?.playerId, playerId].filter((id): id is number => id != null);
					const parserMinions = uniqueEntities(
						controllerIds.flatMap((id) =>
							getBoard(entities, id).filter(
								(entity) => getEntityTag(entity, GameTag.CARDTYPE) === CardType.MINION,
							),
						),
					);
					const parserBoardCardIds = parserMinions
						.map((entity) => entity.CardId)
						.filter((id): id is string => !!id);
					const deckBoardCards = state.playerDeck?.board ?? [];
					const deckBoardCardIds = deckBoardCards.map((c) => c.cardId).filter((id): id is string => !!id);
					const liveBoardCardIds = uniqueIds(
						parserBoardCardIds.length ? parserBoardCardIds : deckBoardCardIds,
					);
					const preCombatBoardCardIds = (player?.getLastKnownBoardState() ?? [])
						.map((entity) => entity.cardID)
						.filter((id): id is string => !!id);
					const simBoardCardIds = (game.lastFaceOff()?.battleInfo?.playerBoard?.board ?? [])
						.map((entity) => entity.cardId)
						.filter((id): id is string => !!id);
					const snapshotBoardCardIds = preCombatBoardCardIds.length ? preCombatBoardCardIds : simBoardCardIds;
					const boardCardIds = pickDarkGiftBoardCardIds(game.phase, liveBoardCardIds, snapshotBoardCardIds);
					const tribeCounts = countBoardTribes(
						boardCardIds,
						availableTribes,
						this.allCards,
						trinkets,
						anomalies,
					);
					if (game.phase !== 'combat' && !getMostCommonTribes(tribeCounts).length) {
						for (const entity of parserMinions) {
							addBoardTribe(tribeCounts, getEntityTag(entity, GameTag.CARDRACE, 0), availableTribes);
						}
						for (const card of deckBoardCards) {
							addBoardTribe(tribeCounts, card.tags?.[GameTag.CARDRACE] ?? 0, availableTribes);
						}
					}
					const pool = getAllCardsInGame(
						availableTribes,
						{
							hasTimewarped: !!game.hasTimewarped,
							hasSpells: !!game.hasSpells,
							hasTrinkets: !!game.hasTrinkets,
							hasDarkmoonPrizes: !!game.hasPrizes,
						},
						state.metadata?.gameType,
						anomalies,
						player?.cardId ?? '',
						[player?.heroPowerCardId].filter((id): id is string => !!id),
						this.allCards,
						cardRules,
					)
						.filter((card) => card.type?.toUpperCase() === CardType[CardType.MINION])
						.filter((card) => isDarkDiscoveryPoolMinion(card))
						.map((card) => toDarkGiftMinionView(card, trinkets, anomalies));
					const mostCommonTribes = resolveGuaranteedTribes(
						tribeCounts,
						player?.getLastKnownComposition()?.tribe,
					);
					const context: DarkGiftLiveContext = {
						currentTurn,
						turn: getDarkDiscoveryTurnFloor(currentTurn),
						isTenPlus: currentTurn >= 10,
						tavernTier: player?.getCurrentTavernTier() ?? 1,
						availableTribes,
						battlecriesTriggered: Math.max(
							0,
							getEntityTag(controller, GameTag.BATTLECRIES_TRIGGERED_THIS_GAME, 0),
						),
						deathrattlesTriggered: Math.max(
							0,
							getEntityTag(controller, GameTag.DEATHRATTLES_TRIGGERED_THIS_GAME, 0),
						),
						tavernSpellsCast: Math.max(
							0,
							getEntityTag(controller, GameTag.TAVERN_SPELLS_PLAYED_THIS_GAME, 0),
						),
						usesLeft: usesTag >= 0 ? usesTag : 3,
						mostCommonTribes,
						minions: pool,
					};
					if (buttonHovered) {
						const lastKnownBoard = player?.getLastKnownBoardState() ?? [];
						const simBoard = game.lastFaceOff()?.battleInfo?.playerBoard?.board ?? [];
						console.debug('[bgs-dark-gifts] overlay context', {
							currentTurn,
							phase: game.phase,
							localPlayerId: playerId,
							bgsPlayerId: player?.playerId,
							controllerIds,
							entitiesType: entities?.constructor?.name,
							entitiesSize: entityCollectionSize(entities),
							buttonFound: !!button,
							parserMinions: parserMinions.map((entity) => ({
								id: entity.Id,
								cardId: entity.CardId,
								controller: getEffectiveController(entity),
								cardType: getEntityTag(entity, GameTag.CARDTYPE),
								race: getEntityTag(entity, GameTag.CARDRACE, 0),
								raceName: Race[getEntityTag(entity, GameTag.CARDRACE, 0)],
							})),
							playMinions: listPlayMinions(entities),
							deckBoard: deckBoardCards.map((card) => ({
								cardId: card.cardId,
								entityId: card.entityId,
								race: card.tags?.[GameTag.CARDRACE] ?? null,
								raceName: Race[card.tags?.[GameTag.CARDRACE] ?? 0],
							})),
							liveBoardCardIds,
							preCombatBoardCardIds,
							simBoardCardIds,
							boardCardIds,
							lastKnownBoard: lastKnownBoard.map((entity) => ({
								keys: entity ? Object.keys(entity) : [],
								cardID: entity?.cardID,
								cardId: (entity as { cardId?: string } | undefined)?.cardId,
							})),
							simBoard: simBoard.map((entity) => ({
								keys: entity ? Object.keys(entity) : [],
								cardId: entity?.cardId,
								cardID: (entity as { cardID?: string } | undefined)?.cardID,
							})),
							boardHistoryLength: player?.boardHistory?.length ?? 0,
							tribeCounts: tribeCountsToLog(tribeCounts),
							composition: player?.getLastKnownComposition(),
							compositionHistory: player?.compositionHistory,
							mostCommonTribes: mostCommonTribes.map((tribe) => Race[tribe]),
							availableTribes: availableTribes.map((tribe) => Race[tribe]),
						});
					}
					return context;
				}),
			)
			.subscribe((context) => this.context$$.next(context));
	}
}

const uniqueEntities = <T extends { Id: number }>(entities: readonly T[]): T[] => {
	const seen = new Set<number>();
	return entities.filter((entity) => {
		if (seen.has(entity.Id)) {
			return false;
		}
		seen.add(entity.Id);
		return true;
	});
};

const uniqueIds = (ids: readonly string[]): string[] => [...new Set(ids)];

const entityCollectionSize = (entities: Map<number, unknown> | undefined | null): number => {
	if (!entities) {
		return 0;
	}
	if (typeof entities.size === 'number') {
		return entities.size;
	}
	return Object.keys(entities).length;
};

const listEntities = (entities: Map<number, EntityLike> | undefined | null): EntityLike[] => {
	if (!entities) {
		return [];
	}
	if (typeof entities.values === 'function') {
		return [...entities.values()].filter((entity): entity is EntityLike => !!entity);
	}
	return Object.values(entities).filter((entity): entity is EntityLike => !!entity);
};

const listPlayMinions = (entities: Map<number, EntityLike> | undefined | null) => {
	return listEntities(entities)
		.filter(
			(entity) =>
				getEntityTag(entity, GameTag.ZONE) === (Zone.PLAY as number) &&
				getEntityTag(entity, GameTag.CARDTYPE) === CardType.MINION,
		)
		.map((entity) => ({
			id: entity.Id,
			cardId: entity.CardId,
			controller: getEffectiveController(entity),
			cardType: getEntityTag(entity, GameTag.CARDTYPE),
			race: getEntityTag(entity, GameTag.CARDRACE, 0),
			raceName: Race[getEntityTag(entity, GameTag.CARDRACE, 0)],
		}));
};

const tribeCountsToLog = (counts: ReadonlyMap<Race, number>): Record<string, number> => {
	const result: Record<string, number> = {};
	for (const [tribe, count] of counts.entries()) {
		result[Race[tribe] ?? `${tribe}`] = count;
	}
	return result;
};
