import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { BaseEntity, FullEntity, PlayerEntity } from './models';
import { Tag, Options } from './models';
import { ParserState } from './state/parser-state';
import { StateFacade } from './state/state-facade';
import { GameState } from './state/game-state';
import {
	GameStateShort,
	GameStateShortPlayer,
	GameStateShortSmallEntity,
	GameStateShortEnchantment,
} from './state/game-state-short';
import { Logger } from './logger';

export function buildGameState(
	parserState: ParserState,
	helper: StateFacade,
	gameState: GameState,
): GameStateShort {
	if (parserState == null || helper.LocalPlayer == null || helper.OpponentPlayer == null) {
		return new GameStateShort();
	}

	const allEntities = [...gameState.CurrentEntities.values()];
	const fullEntitiesMap = gameState.CurrentEntities;

	const result = new GameStateShort();
	result.ActivePlayerId = gameState.GetActivePlayerId();
	result.Player = buildPlayerState(
		parserState,
		allEntities,
		fullEntitiesMap,
		helper.LocalPlayer.PlayerId,
	);
	result.Opponent = buildPlayerState(
		parserState,
		allEntities,
		fullEntitiesMap,
		helper.OpponentPlayer.PlayerId,
	);
	return result;
}

function buildPlayerState(
	parserState: ParserState,
	allEntities: FullEntity[],
	fullEntitiesMap: Map<number, FullEntity>,
	playerId: number,
): GameStateShortPlayer {
	const player = new GameStateShortPlayer();
	player.PlayerEntity = buildPlayerEntity(parserState, allEntities, fullEntitiesMap, playerId);
	player.Hero = buildHero(allEntities, fullEntitiesMap, playerId);
	player.Weapon = buildWeapon(allEntities, fullEntitiesMap, playerId);
	player.Hand = buildZone(allEntities, fullEntitiesMap, Zone.HAND as number, playerId);
	player.Board = buildBoard(allEntities, fullEntitiesMap, playerId);
	player.Secrets = buildSecrets(allEntities, fullEntitiesMap, playerId);
	player.Deck = buildZone(allEntities, fullEntitiesMap, Zone.DECK as number, playerId);
	player.AllEntities = allEntities
		.filter((entity) => entity.GetEffectiveController() === playerId)
		.map((entity) => buildSmallEntity(entity, fullEntitiesMap, allEntities));
	player.LettuceAbilities = buildZone(
		allEntities,
		fullEntitiesMap,
		Zone.LETTUCE_ABILITY as number,
		playerId,
	);
	return player;
}

function buildPlayerEntity(
	parserState: ParserState,
	allEntities: FullEntity[],
	fullEntitiesMap: Map<number, FullEntity>,
	playerId: number,
): GameStateShortSmallEntity {
	const playerEntityId = parserState
		.getPlayers()
		.find((e) => e.PlayerId === playerId)
		?.GetTag(GameTag.ENTITY_ID);
	if (playerEntityId == null) {
		return new GameStateShortSmallEntity();
	}
	const player = allEntities
		.filter((e) => e.Entity === playerEntityId)
		.map((entity) => buildSmallEntity(entity, fullEntitiesMap, allEntities))
		.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))[0];
	return player ?? new GameStateShortSmallEntity();
}

function buildHero(
	allEntities: FullEntity[],
	fullEntitiesMap: Map<number, FullEntity>,
	playerId: number,
): GameStateShortSmallEntity {
	try {
		const hero = allEntities
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((entity) => entity.GetEffectiveController() === playerId)
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.map((entity) => buildSmallEntity(entity, fullEntitiesMap, allEntities))
			.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION))[0];
		return hero ?? new GameStateShortSmallEntity();
	} catch (e) {
		Logger.Log('Warning: issue when trying to build hero', '' + e);
		return new GameStateShortSmallEntity();
	}
}

function buildWeapon(
	allEntities: FullEntity[],
	fullEntitiesMap: Map<number, FullEntity>,
	playerId: number,
): GameStateShortSmallEntity {
	try {
		const weapons = allEntities
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.WEAPON as number))
			.filter((entity) => entity.GetEffectiveController() === playerId)
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.map((entity) => buildSmallEntity(entity, fullEntitiesMap, allEntities));
		return weapons[weapons.length - 1] ?? new GameStateShortSmallEntity();
	} catch (e) {
		Logger.Log('Warning: issue when trying to build weapon', '' + e);
		return new GameStateShortSmallEntity();
	}
}

function buildZone(
	allEntities: FullEntity[],
	fullEntitiesMap: Map<number, FullEntity>,
	zone: number,
	playerId: number,
): GameStateShortSmallEntity[] {
	try {
		return allEntities
			.filter((entity) => entity.GetTag(GameTag.ZONE) === zone)
			.filter((entity) => entity.GetEffectiveController() === playerId)
			.sort((a, b) => {
				const aPos = a.GetTag(GameTag.ZONE_POSITION) === -1 ? 99 : a.GetTag(GameTag.ZONE_POSITION);
				const bPos = b.GetTag(GameTag.ZONE_POSITION) === -1 ? 99 : b.GetTag(GameTag.ZONE_POSITION);
				return aPos - bPos;
			})
			.map((entity) => buildSmallEntity(entity, fullEntitiesMap, allEntities));
	} catch (e) {
		Logger.Log('Warning: issue when trying to build zone', '' + e);
		return [];
	}
}

function buildSecrets(
	allEntities: FullEntity[],
	fullEntitiesMap: Map<number, FullEntity>,
	playerId: number,
): GameStateShortSmallEntity[] {
	try {
		return allEntities
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.SECRET as number))
			.filter((entity) => entity.GetEffectiveController() === playerId)
			.map((entity) => buildSmallEntity(entity, fullEntitiesMap, allEntities))
			.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION));
	} catch (e) {
		Logger.Log('Warning: issue when trying to build secrets', '' + e);
		return [];
	}
}

function buildBoard(
	allEntities: FullEntity[],
	fullEntitiesMap: Map<number, FullEntity>,
	playerId: number,
): GameStateShortSmallEntity[] {
	try {
		return allEntities
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.filter((entity) => entity.GetEffectiveController() === playerId)
			.filter((entity) => entity.IsMinionLike())
			.map((entity) => buildSmallEntity(entity, fullEntitiesMap, allEntities))
			.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION));
	} catch (e) {
		Logger.Log('Warning: issue when trying to build board', '' + e);
		return [];
	}
}

function buildSmallEntity(
	entity: BaseEntity,
	fullEntitiesMap: Map<number, FullEntity>,
	allEntities: FullEntity[],
): GameStateShortSmallEntity {
	const small = new GameStateShortSmallEntity();
	small.entityId = entity.Id;
	small.cardId = entity instanceof FullEntity ? entity.CardId : '';
	small.attack = entity.GetTag(GameTag.ATK);
	small.health = entity.GetTag(GameTag.HEALTH);
	const durability = entity.GetTag(GameTag.DURABILITY_DEPRECATED);
	small.durability = durability === -1 ? entity.GetTag(GameTag.HEALTH) : durability;
	small.tags = entity.GetTagsCopy();
	small.enchantments = allEntities
		.filter((e) => e.GetTagSecure(GameTag.ATTACHED) === entity.Id)
		.filter((e) => e.GetZone() === (Zone.PLAY as number))
		.map((e) => {
			const ench = new GameStateShortEnchantment();
			ench.entityId = e.Entity;
			if (e.CardId === CardIds.PolarizingBeatboxer_PolarizedEnchantment) {
				const creator = fullEntitiesMap.get(e.GetTag(GameTag.CREATOR));
				ench.cardId = '' + (creator?.GetTag(GameTag.ENTITY_AS_ENCHANTMENT) ?? '');
			} else {
				ench.cardId = e.CardId;
			}
			ench.tags = e.GetTagsCopy();
			return ench;
		});
	return small;
}
