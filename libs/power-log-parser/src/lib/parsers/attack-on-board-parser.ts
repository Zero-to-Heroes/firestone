import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, NodeType, TagChange } from '../models';
import { FullEntity } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';
import { hasSummoningSicknessForAttackOnBoard } from './attack-on-board-summoning';

interface AttackOnBoard {
	Player: AttackOnBoardForPlayer;
	Opponent: AttackOnBoardForPlayer;
}

interface AttackOnBoardForPlayer {
	Board: number;
	Hero: number;
}

export class AttackOnBoardParser implements ActionParser {
	readonly ParserName = 'AttackOnBoardParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			!this.StateFacade.IsBattlegrounds() &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.ATK as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			!this.StateFacade.IsBattlegrounds() &&
			node.Type === NodeType.Action
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity?.GetZone() !== (Zone.PLAY as number)) {
			return null;
		}

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'TOTAL_ATTACK_ON_BOARD',
				() => {
					const attackOnBoard = this.buildAttackOnBoard();
					if (attackOnBoard == null) {
						return null;
					}
					return {
						Type: 'TOTAL_ATTACK_ON_BOARD',
						Value: {
							CardId: null,
							ControllerId: -1,
							LocalPlayer: null,
							OpponentPlayer: null,
							EntityId: -1,
							AdditionalProps: {
								AttackOnBoard: attackOnBoard,
							},
						},
					};
				},
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		if (action.Data.length === 0) {
			return null;
		}

		const attackOnBoard = this.buildAttackOnBoard();
		if (attackOnBoard == null) {
			return null;
		}

		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'TOTAL_ATTACK_ON_BOARD',
				GameEventHelper.CreateProvider(
					'TOTAL_ATTACK_ON_BOARD',
					null as any,
					-1,
					-1,
					this.StateFacade,
					{
						AttackOnBoard: attackOnBoard,
					},
				),
				true,
				node,
			),
		];
	}

	private buildAttackOnBoard(): AttackOnBoard | null {
		if (this.StateFacade?.LocalPlayer == null || this.StateFacade?.OpponentPlayer == null) {
			return null;
		}

		const allEntities = [...this.GameState.CurrentEntities.values()];
		return {
			Player: this.buildAttackOnBoardForPlayer(
				this.StateFacade.LocalPlayer.PlayerId,
				this.GameState.CurrentEntities.get(this.StateFacade.LocalPlayer.Id),
				allEntities,
			),
			Opponent: this.buildAttackOnBoardForPlayer(
				this.StateFacade.OpponentPlayer.PlayerId,
				this.GameState.CurrentEntities.get(this.StateFacade.OpponentPlayer.Id),
				allEntities,
			),
		};
	}

	private buildAttackOnBoardForPlayer(
		playerId: number,
		playerEntity: FullEntity | undefined,
		allEntities: FullEntity[],
	): AttackOnBoardForPlayer {
		const entitiesForPlayer = allEntities.filter(
			(e) => e.IsInPlay() && e.GetEffectiveController() === playerId,
		);
		const hero = entitiesForPlayer.find(
			(entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number),
		);
		const isActivePlayer = playerEntity?.GetTag(GameTag.CURRENT_PLAYER) === 1;

		const entitiesOnBoardThatCanAttack = entitiesForPlayer.filter(
			(e) => e.IsMinionLike() && e.GetTag(GameTag.ATK) > 0 && this.canAttack(e, isActivePlayer, false),
		);
		const totalAttackOnBoard = entitiesOnBoardThatCanAttack
			.map((e) => this.getAttack(e))
			.reduce((sum, v) => sum + v, 0);

		let heroAttack = 0;
		if (hero != null) {
			const weapon = entitiesForPlayer.find(
				(entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.WEAPON as number),
			);
			if (weapon == null || weapon.GetTag(GameTag.CANNOT_ATTACK_HEROES) !== 1) {
				const baseHeroAttack = isActivePlayer
					? hero.GetTag(GameTag.ATK, 0)
					: (weapon?.GetTag(GameTag.ATK, 0) ?? 0);
				const windfuryMultiplier = this.getWindfuryMultiplier(hero);
				const attacksForWeapon =
					weapon == null
						? windfuryMultiplier
						: Math.max(0, weapon.GetTag(GameTag.HEALTH, 0) - weapon.GetTag(GameTag.DAMAGE, 0));
				const maxAttacks = Math.min(windfuryMultiplier, attacksForWeapon);
				const rawAttacksLeft =
					maxAttacks -
					hero.GetTag(GameTag.NUM_ATTACKS_THIS_TURN, 0) +
					hero.GetTag(GameTag.EXTRA_ATTACKS_THIS_TURN, 0);
				const attacksLeft = isActivePlayer
					? Math.min(maxAttacks, rawAttacksLeft)
					: windfuryMultiplier;
				heroAttack = this.canAttack(hero, isActivePlayer, true) ? attacksLeft * baseHeroAttack : 0;
			}
		}
		return {
			Board: totalAttackOnBoard,
			Hero: heroAttack,
		};
	}

	private canAttack(e: FullEntity, isActivePlayer: boolean, isHero: boolean): boolean {
		if (!isHero && e.HasTag(GameTag.CANNOT_ATTACK_HEROES)) {
			return false;
		}

		const isDormant = e.HasTag(GameTag.DORMANT);
		const cantAttack = e.HasTag(GameTag.CANT_ATTACK);
		const isFrozen = e.HasTag(GameTag.FROZEN);
		const canTitanAttack =
			!e.HasTag(GameTag.TITAN) ||
			(e.HasTag(GameTag.TITAN_ABILITY_USED_1) &&
				e.HasTag(GameTag.TITAN_ABILITY_USED_2) &&
				e.HasTag(GameTag.TITAN_ABILITY_USED_3));
		const canStarshipAttack =
			!e.HasTag(GameTag.STARSHIP) ||
			(!e.HasTag(GameTag.LAUNCHPAD) && (!isActivePlayer || e.GetTag(GameTag.NUM_TURNS_IN_PLAY) > 1));
		const hasSummoningSickness = hasSummoningSicknessForAttackOnBoard(e, isActivePlayer, isHero);
		return !isDormant && !hasSummoningSickness && !isFrozen && !cantAttack && canTitanAttack && canStarshipAttack;
	}

	private getAttack(e: FullEntity): number {
		const windfuryMultiplier = this.getWindfuryMultiplier(e);
		const availableAttacks = Math.max(
			0,
			windfuryMultiplier -
				e.GetTag(GameTag.NUM_ATTACKS_THIS_TURN, 0) +
				e.GetTag(GameTag.EXTRA_ATTACKS_THIS_TURN, 0),
		);
		const entityAttack = e.GetTag(GameTag.ATK, 0);
		return entityAttack * availableAttacks;
	}

	private getWindfuryMultiplier(e: FullEntity): number {
		return e.HasTag(GameTag.SILENCED)
			? 1
			: e.HasTag(GameTag.MEGA_WINDFURY)
				? 4
				: e.GetTag(GameTag.WINDFURY) === 3
					? 4
					: e.HasTag(GameTag.WINDFURY)
						? 2
						: 1;
	}
}
