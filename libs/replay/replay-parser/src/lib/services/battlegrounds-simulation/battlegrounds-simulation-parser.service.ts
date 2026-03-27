import { Injectable } from '@angular/core';
import { CardType, GameTag, GameType, Zone } from '@firestone-hs/reference-data';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BoardSecret } from '@firestone-hs/simulate-bgs-battle/dist/board-secret';
import { Damage, GameAction } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-action';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { Map } from 'immutable';
import { Game } from '../../models/game/game';
import {
	Action,
	ActionParserConfig,
	ActionTurn,
	AttackAction,
	DamageAction,
	Entity,
	MinionDeathAction,
	PlayerEntity,
	PowerTargetAction,
	StartTurnAction,
	SummonAction,
	Turn,
} from '../../models/models';
import { AllCardsService } from '../all-cards.service';
import { NarratorService } from '../gamepipeline/narrator.service';
import { ExtendedGameSample } from './extended-game-sample';

@Injectable({
	providedIn: 'root',
})
export class BattlegroundsSimulationParserService {
	constructor(
		private allCards: AllCardsService,
		private narrator: NarratorService,
	) {}

	public async parse(
		bgsSimulation: GameSample,
		config: ActionParserConfig = new ActionParserConfig(),
	): Promise<Game> {
		await this.allCards.initializeCardsDb();
		const bgsSimulationWithIds: ExtendedGameSample = {
			...bgsSimulation,
			playerEntityId: bgsSimulation.actions[0].playerEntityId,
			playerHeroPowerEntityId: 100000002,
			playerCardId: bgsSimulation.actions[0].playerCardId,
			playerHeroPowerCardId: bgsSimulation.actions[0].playerHeroPowerCardId,
			playerHeroPowerUsed: bgsSimulation.actions[0].playerHeroPowerUsed,
			opponentEntityId: bgsSimulation.actions[0].opponentEntityId,
			opponentHeroPowerEntityId: 200000002,
			opponentCardId: bgsSimulation.actions[0].opponentCardId,
			opponentHeroPowerCardId: bgsSimulation.actions[0].opponentHeroPowerCardId,
			opponentHeroPowerUsed: bgsSimulation.actions[0].opponentHeroPowerUsed,
		};

		const playerEntity: PlayerEntity = this.buildPlayerEntity(bgsSimulationWithIds);
		const opponentEntity: PlayerEntity = this.buildOpponentEntity(bgsSimulationWithIds);
		const playerHeroPowerEntity: Entity = this.buildPlayerHeroPowerEntity(bgsSimulationWithIds, playerEntity);
		const opponentHeroPowerEntity: Entity = this.buildOpponentHeroPowerEntity(bgsSimulationWithIds, opponentEntity);
		let game: Game = Game.createGame({
			players: [playerEntity, opponentEntity] as readonly PlayerEntity[],
			turns: Map.of(
				0,
				this.buildSingleBgsTurn(
					bgsSimulationWithIds,
					playerEntity,
					opponentEntity,
					playerHeroPowerEntity,
					opponentHeroPowerEntity,
				),
			),
			gameType: GameType.GT_BATTLEGROUNDS,
		} as Game);
		game = this.narrator.populateActionTextForLastTurn(game);
		game = this.narrator.createGameStoryForLastTurn(game);
		// console.log('built game', game, game.turns.toJS(), 'from', bgsSimulationWithIds);
		return game;
	}

	private buildSingleBgsTurn(
		bgsSimulation: ExtendedGameSample,
		playerEntity: PlayerEntity,
		opponentEntity: PlayerEntity,
		playerHeroPowerEntity: Entity,
		opponentHeroPowerEntity: Entity,
	): Turn {
		return ActionTurn.create({
			turn: 'battle',
			activePlayer: undefined,
			actions: bgsSimulation.actions.map((action) =>
				this.buildGameAction(action, playerEntity, opponentEntity, bgsSimulation.anomalies),
			),
		} as any as ActionTurn);
	}

	private buildGameAction(
		action: GameAction,
		playerEntity: PlayerEntity,
		opponentEntity: PlayerEntity,
		anomalies: readonly string[],
	): Action {
		const damages = this.buildDamages(action.type, action.damages, playerEntity, opponentEntity);
		const playerRewardEntity: Entity = this.buildPlayerRewardEntity(action, playerEntity);
		const opponentRewardEntity: Entity = this.buildOpponentRewardEntity(action, opponentEntity);
		if (action.type === 'start-of-combat') {
			const result = StartTurnAction.create(
				{
					playerId: action.playerEntityId,
					opponentId: action.opponentEntityId,
					entities: this.buildEntities(action, playerRewardEntity, opponentRewardEntity, anomalies, damages),
				} as StartTurnAction,
				this.allCards,
			);
			// // console.log('built attack action', result, result.entities.toJS());
			return result;
		} else if (action.type === 'player-attack') {
			const result = AttackAction.create(
				{
					playerId: action.playerEntityId,
					opponentId: action.opponentEntityId,
					entities: this.buildEntities(action, playerRewardEntity, opponentRewardEntity, anomalies, damages),
					originId: playerEntity.id,
					targetId: opponentEntity.id,
					targets: [[playerEntity.id, opponentEntity.id]] as readonly number[][],
					damages: damages,
				} as AttackAction,
				this.allCards,
			);
			// // console.log('built attack action', result, result.entities.toJS());
			return result;
		} else if (action.type === 'opponent-attack') {
			const result = AttackAction.create(
				{
					playerId: action.playerEntityId,
					opponentId: action.opponentEntityId,
					entities: this.buildEntities(action, playerRewardEntity, opponentRewardEntity, anomalies, damages),
					originId: opponentEntity.id,
					targetId: playerEntity.id,
					targets: [[opponentEntity.id, playerEntity.id]] as readonly number[][],
					damages: damages,
				} as AttackAction,
				this.allCards,
			);
			// // console.log('built attack action', result, result.entities.toJS());
			return result;
		} else if (action.type === 'attack') {
			const result = AttackAction.create(
				{
					playerId: action.playerEntityId,
					opponentId: action.opponentEntityId,
					entities: this.buildEntities(action, playerRewardEntity, opponentRewardEntity, anomalies, damages),
					originId: action.sourceEntityId,
					targetId: action.targetEntityId,
					targets: [[action.sourceEntityId, action.targetEntityId]] as readonly number[][],
					damages: damages,
				} as AttackAction,
				this.allCards,
			);
			// // console.log('built attack action', result, result.entities.toJS());
			return result;
		} else if (action.type === 'damage') {
			return DamageAction.create(
				{
					playerId: action.playerEntityId,
					opponentId: action.opponentEntityId,
					entities: this.buildEntities(action, playerRewardEntity, opponentRewardEntity, anomalies, damages),
					damages: damages,
				} as DamageAction,
				this.allCards,
			);
		} else if (action.type === 'power-target') {
			// // console.log('parsing powertargetaction', action);
			const targetIds: readonly number[] = action.targetEntityIds ?? [action.targetEntityId];
			return PowerTargetAction.create(
				{
					playerId: action.playerEntityId,
					opponentId: action.opponentEntityId,
					entities: this.buildEntities(action, playerRewardEntity, opponentRewardEntity, anomalies, damages),
					originId: action.sourceEntityId,
					targetIds: targetIds,
					targets: targetIds.map((targetId) => [action.sourceEntityId, targetId]) as readonly [
						number,
						number,
					][],
				} as PowerTargetAction,
				this.allCards,
			);
		} else if (action.type === 'spawn') {
			return SummonAction.create(
				{
					playerId: action.playerEntityId,
					opponentId: action.opponentEntityId,
					originId: action.sourceEntityId,
					entities: this.buildEntities(action, playerRewardEntity, opponentRewardEntity, anomalies, null),
					entityIds: action.spawns.map((entity) => entity.entityId) as readonly number[],
				} as SummonAction,
				this.allCards,
			);
		} else if (action.type === 'minion-death') {
			return MinionDeathAction.create(
				{
					playerId: action.playerEntityId,
					opponentId: action.opponentEntityId,
					entities: this.buildEntities(action, playerRewardEntity, opponentRewardEntity, anomalies, null),
					deadMinions: action.deaths.map((entity) => entity.entityId) as readonly number[],
				} as MinionDeathAction,
				this.allCards,
			);
		}
	}

	private buildDamages(
		actionType: string,
		damages: Damage[],
		playerEntity: PlayerEntity,
		opponentEntity: PlayerEntity,
	): Map<number, number> {
		if (!damages || damages.length === 0) {
			return null;
		}

		if (actionType === 'player-attack') {
			const damage = !!damages?.length ? damages[0].damage ?? 0! : 0;
			return Map([[opponentEntity.id, damage]]);
		} else if (actionType === 'opponent-attack') {
			const damage = !!damages?.length ? damages[0].damage ?? 0! : 0;
			return Map([[playerEntity.id, damage]]);
		}

		const result: { [damagedEntityId: number]: number } = {};
		for (const damage of damages) {
			result[damage.targetEntityId] = (result[damage.targetEntityId] || 0) + damage.damage;
		}
		const arrayFromWhichToBuildMap: readonly [number, number][] = Object.keys(result).map((damagedEntityId) => [
			parseInt(damagedEntityId),
			result[damagedEntityId],
		]);
		// // console.log('building damage array', arrayFromWhichToBuildMap, result, damages);
		return Map(arrayFromWhichToBuildMap);
	}

	private buildEntities(
		action: GameAction,
		playerRewardEntity: Entity,
		opponentRewardEntity: Entity,
		anomalies: readonly string[],
		damages: Map<number, number>,
	): Map<number, Entity> {
		const playerEntity = this.buildGenericPlayerEntity(
			'Player',
			action.playerEntityId,
			action.playerEntityId,
			action.playerCardId,
		);
		const opponentEntity = this.buildGenericPlayerEntity(
			'Opponent',
			action.opponentEntityId,
			action.opponentEntityId,
			action.opponentCardId,
		);
		const playerHeroPowerEntity = this.buildGenericHeroPowerEntity(
			action.playerHeroPowerCardId,
			action.playerHeroPowerEntityId,
			action.playerHeroPowerUsed,
			playerEntity.playerId,
		);
		const opponentHeroPowerEntity = this.buildGenericHeroPowerEntity(
			action.opponentHeroPowerCardId,
			action.opponentHeroPowerEntityId,
			action.opponentHeroPowerUsed,
			opponentEntity.playerId,
		);
		const anomalyEntities = (anomalies ?? []).map((anomaly) => this.buildAnomalyEntity(anomaly));
		const allSourceEntities = [
			...(action.playerBoard || []),
			...(action.opponentBoard || []),
			// ...(action.spawns || []), // They are already present on the board
			...(action.deaths || []),
		];
		// // console.log('parsing action', action.type, allSourceEntities, action);
		const friendlyBoardEntities: readonly Entity[] = allSourceEntities
			.filter((entity) => entity.friendly)
			.map((boardEntity, index) =>
				this.buildEntity(
					boardEntity,
					this.findPositionOnBoard(action, boardEntity.entityId) ?? index,
					playerEntity,
					damages,
				),
			);
		const opponentBoardEntities: readonly Entity[] = allSourceEntities
			.filter((entity) => !entity.friendly)
			.map((boardEntity, index) =>
				this.buildEntity(
					boardEntity,
					this.findPositionOnBoard(action, boardEntity.entityId) ?? index,
					opponentEntity,
					damages,
				),
			);
		const allHandEntities = [...(action.playerHand || []), ...(action.opponentHand || [])];
		const friendlyHandEntities: readonly Entity[] = allHandEntities
			.filter((entity) => entity.friendly)
			.map((entity, index) => this.buildEntity(entity, index, playerEntity, damages, Zone.HAND));
		const opponentHandEntities: readonly Entity[] = allHandEntities
			.filter((entity) => !entity.friendly)
			.map((entity, index) => this.buildEntity(entity, index, opponentEntity, damages, Zone.HAND));
		const playerSecretEntities: readonly Entity[] = (action.playerSecrets || []).map((entity, index) =>
			this.buildSecretEntity(entity, index, playerEntity, damages),
		);
		const opponentSecretEntities: readonly Entity[] = (action.opponentSecrets || []).map((entity, index) =>
			this.buildSecretEntity(entity, index, opponentEntity, damages),
		);
		const playerTrinketEntities: readonly Entity[] = (action.playerTrinkets || []).map((entity, index) =>
			this.buildTrinketEntity(entity, playerEntity, index),
		);
		const opponentTrinketEntities: readonly Entity[] = (action.opponentTrinkets || []).map((entity, index) =>
			this.buildTrinketEntity(entity, opponentEntity, index),
		);

		// // console.log('split entities', friendlyEntities, opponentEntities);
		const allEntities: readonly Entity[] = [
			Object.assign(new PlayerEntity(), playerEntity, {
				damageForThisAction: damages && damages.get(playerEntity.id) ? damages.get(playerEntity.id) : undefined,
			} as PlayerEntity),
			Object.assign(new PlayerEntity(), opponentEntity, {
				damageForThisAction:
					damages && damages.get(opponentEntity.id) ? damages.get(opponentEntity.id) : undefined,
			} as PlayerEntity),
			playerHeroPowerEntity,
			opponentHeroPowerEntity,
			playerRewardEntity,
			opponentRewardEntity,
			...anomalyEntities,
			...friendlyBoardEntities,
			...opponentBoardEntities,
			...friendlyHandEntities,
			...opponentHandEntities,
			...playerSecretEntities,
			...opponentSecretEntities,
			...playerTrinketEntities,
			...opponentTrinketEntities,
		].filter((e) => !!e);
		const mapEntries: readonly [number, Entity][] = allEntities.map((entity) => [entity.id, entity]);
		// // console.log('map entries', mapEntries);
		const result: Map<number, Entity> = Map(mapEntries);
		// // console.log('built entities', result.get(1), result);
		return result;
	}

	private findPositionOnBoard(action: GameAction, entityId: number): number {
		if (!action.deaths) {
			return undefined;
		}

		for (let i = 0; i < action.deaths.length; i++) {
			if (action.deaths[i].entityId === entityId) {
				return action.deadMinionsPositionsOnBoard[i];
			}
		}
		return undefined;
	}

	private buildEntity(
		boardEntity: BoardEntity,
		boardPosition: number,
		playerEntity: PlayerEntity,
		damages: Map<number, number>,
		zone = Zone.PLAY,
	): Entity {
		const refCard = this.allCards.getCard(boardEntity.cardId);
		const tags: { [tagName: string]: number } = {
			[GameTag[GameTag.CONTROLLER]]: playerEntity.playerId,
			[GameTag[GameTag.CARDTYPE]]: CardType.MINION,
			[GameTag[GameTag.ZONE]]: zone ?? Zone.PLAY,
			[GameTag[GameTag.ZONE_POSITION]]: boardPosition,
			[GameTag[GameTag.ATK]]: boardEntity.attack,
			[GameTag[GameTag.HEALTH]]: boardEntity.maxHealth ?? boardEntity.health,
			[GameTag[GameTag.DAMAGE]]: (boardEntity.maxHealth ?? boardEntity.health) - boardEntity.health,
			[GameTag[GameTag.TAUNT]]: boardEntity.taunt ? 1 : 0,
			[GameTag[GameTag.POISONOUS]]: boardEntity.poisonous || boardEntity.venomous ? 1 : 0,
			[GameTag[GameTag.DIVINE_SHIELD]]: boardEntity.divineShield ? 1 : 0,
			[GameTag[GameTag.REBORN]]: boardEntity.reborn ? 1 : 0,
			[GameTag[GameTag.WINDFURY]]: boardEntity.windfury ? 1 : 0,
			[GameTag[GameTag.DEATHRATTLE]]: refCard.mechanics?.includes(GameTag[GameTag.DEATHRATTLE]) ? 1 : 0,
			[GameTag[GameTag.TRIGGER_VISUAL]]: refCard.mechanics?.includes(GameTag[GameTag.TRIGGER_VISUAL]) ? 1 : 0,
			[GameTag[GameTag.STEALTH]]: boardEntity.stealth ? 1 : 0,
			[GameTag[GameTag.PREMIUM]]: refCard.battlegroundsNormalDbfId || refCard.premium ? 1 : 0,
			[GameTag[GameTag.TECH_LEVEL]]: refCard.techLevel,
		};
		return Entity.create({
			id: boardEntity.entityId,
			cardID: boardEntity.cardId,
			tags: tags,
			damageForThisAction:
				damages && damages.get(boardEntity.entityId) ? damages.get(boardEntity.entityId) : undefined,
		} as Entity);
	}

	private buildSecretEntity(
		boardEntity: BoardSecret,
		boardPosition: number,
		playerEntity: PlayerEntity,
		damages: Map<number, number>,
	): Entity {
		const refCard = this.allCards.getCard(boardEntity.cardId);
		const tags: { [tagName: string]: number } = {
			[GameTag[GameTag.CONTROLLER]]: playerEntity.playerId,
			[GameTag[GameTag.CARDTYPE]]: CardType.SPELL,
			[GameTag[GameTag.ZONE]]: Zone.SECRET,
			[GameTag[GameTag.CLASS]]: GameTag[refCard.classes?.[0].toUpperCase() ?? 'NEUTRAL'],
			[GameTag[GameTag.ZONE_POSITION]]: boardPosition,
		};
		return Entity.create({
			id: boardEntity.entityId,
			cardID: boardEntity.cardId,
			tags: tags,
			damageForThisAction:
				damages && damages.get(boardEntity.entityId) ? damages.get(boardEntity.entityId) : undefined,
		} as Entity);
	}

	private buildTrinketEntity(boardEntity: BoardSecret, playerEntity: PlayerEntity, index: number): Entity {
		const refCard = this.allCards.getCard(boardEntity.cardId);
		const tags: { [tagName: string]: number } = {
			[GameTag[GameTag.CONTROLLER]]: playerEntity.playerId,
			[GameTag[GameTag.CARDTYPE]]: CardType.BATTLEGROUND_TRINKET,
			[GameTag[GameTag.ZONE]]: Zone.PLAY,
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_6]]: index + 1,
		};
		return Entity.create({
			id: boardEntity.entityId,
			cardID: boardEntity.cardId,
			tags: tags,
		} as Entity);
	}

	private buildPlayerEntity(bgsSimulation: ExtendedGameSample): PlayerEntity {
		return this.buildGenericPlayerEntity(
			'Player',
			bgsSimulation.playerEntityId,
			bgsSimulation.playerEntityId,
			bgsSimulation.playerCardId,
		);
	}

	private buildPlayerHeroPowerEntity(bgsSimulation: ExtendedGameSample, playerEntity: PlayerEntity): Entity {
		return this.buildGenericHeroPowerEntity(
			bgsSimulation.playerHeroPowerCardId,
			bgsSimulation.playerHeroPowerEntityId,
			bgsSimulation.playerHeroPowerUsed,
			playerEntity.playerId,
		);
	}

	private buildGenericHeroPowerEntity(cardId: string, entityId: number, used: boolean, playerId: number): Entity {
		if (!cardId) {
			return null;
		}

		const tags: { [tagName: string]: number } = {
			[GameTag[GameTag.CONTROLLER]]: playerId,
			[GameTag[GameTag.CARDTYPE]]: CardType.HERO_POWER,
			[GameTag[GameTag.ZONE]]: Zone.PLAY,
			[GameTag[GameTag.ENTITY_ID]]: Zone.PLAY,
			[GameTag[GameTag.EXHAUSTED]]: used ? 1 : 0,
		};
		return Entity.create({
			id: entityId,
			cardID: cardId,
			tags: tags,
		} as Entity);
	}

	private buildAnomalyEntity(cardId: string): Entity {
		if (!cardId) {
			return null;
		}

		const tags: { [tagName: string]: number } = {
			[GameTag[GameTag.CARDTYPE]]: CardType.BATTLEGROUND_ANOMALY,
			[GameTag[GameTag.ZONE]]: Zone.PLAY,
			[GameTag[GameTag.ENTITY_ID]]: Zone.PLAY,
		};
		return Entity.create({
			id: 6666666661,
			cardID: cardId,
			tags: tags,
		} as Entity);
	}

	private buildPlayerRewardEntity(action: GameAction, playerEntity: PlayerEntity): Entity {
		const cardId = action.playerRewardCardId ?? action.playerHeroPowers?.[1]?.cardId;
		const entityId = action.playerRewardEntityId ?? action.playerHeroPowers?.[1]?.entityId;
		console.debug('player quest reward card id', cardId);
		if (!cardId) {
			return null;
		}

		const tags: { [tagName: string]: number } = {
			[GameTag[GameTag.CONTROLLER]]: playerEntity.playerId,
			[GameTag[GameTag.CARDTYPE]]: CardType.BATTLEGROUND_QUEST_REWARD,
			[GameTag[GameTag.ZONE]]: Zone.PLAY,
			[GameTag[GameTag.ENTITY_ID]]: entityId,
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_1]]: action.playerRewardData,
		};
		console.debug('player quest reward tags', tags);
		return Entity.create({
			id: entityId,
			cardID: cardId,
			tags: tags,
		} as Entity);
	}

	private buildOpponentRewardEntity(action: GameAction, playerEntity: PlayerEntity): Entity {
		const cardId = action.opponentRewardCardId ?? action.opponentHeroPowers?.[1]?.cardId;
		const entityId = action.opponentRewardEntityId ?? action.opponentHeroPowers?.[1]?.entityId;
		if (!cardId) {
			return null;
		}

		const tags: { [tagName: string]: number } = {
			[GameTag[GameTag.CONTROLLER]]: playerEntity.playerId,
			[GameTag[GameTag.CARDTYPE]]: CardType.BATTLEGROUND_QUEST_REWARD,
			[GameTag[GameTag.ZONE]]: Zone.PLAY,
			[GameTag[GameTag.ENTITY_ID]]: entityId,
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_1]]: action.opponentRewardData,
		};
		return Entity.create({
			id: entityId,
			cardID: cardId,
			tags: tags,
		} as Entity);
	}

	private buildOpponentHeroPowerEntity(bgsSimulation: ExtendedGameSample, playerEntity: PlayerEntity): Entity {
		return this.buildGenericHeroPowerEntity(
			bgsSimulation.opponentHeroPowerCardId,
			bgsSimulation.opponentHeroPowerEntityId,
			bgsSimulation.opponentHeroPowerUsed,
			playerEntity.playerId,
		);
	}

	private buildOpponentEntity(bgsSimulation: ExtendedGameSample): PlayerEntity {
		return this.buildGenericPlayerEntity(
			'Opponent',
			bgsSimulation.opponentEntityId,
			bgsSimulation.opponentEntityId,
			bgsSimulation.opponentCardId,
		);
	}

	private buildGenericPlayerEntity(
		name: string,
		playerId: number,
		playerEntityId: number,
		playerCardId: string,
	): PlayerEntity {
		const tags: { [tagName: string]: number } = {
			[GameTag[GameTag.PLAYER_ID]]: playerId,
			[GameTag[GameTag.CARDTYPE]]: CardType.PLAYER,
			// Cheating here: using the same entity for player and hero
			[GameTag[GameTag.HERO_ENTITY]]: playerEntityId,
			[GameTag[GameTag.ZONE]]: Zone.PLAY,
		};
		return PlayerEntity.create({
			id: playerEntityId,
			playerId: playerId,
			cardID: playerCardId,
			name: name,
			tags: tags,
		} as PlayerEntity);
	}
}
