import { BlockType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEvent, GameEventProvider } from '../game-event';
import { Action, MetaData, Node, TagChange } from '../models';
import { MetaDataType } from '../enums';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

interface DamageInternal {
	SourceCardId?: string;
	SourceEntityId: number;
	SourceControllerId: number;
	TargetEntityId: number;
	TargetControllerId: number;
	TargetCardId: string | null;
	Damage: number;
	Hits?: number;
	Timestamp: string;
	IsPayingWithHealth?: boolean;
}

export class DamageParser implements ActionParser {
	readonly ParserName = 'DamageParser';

	private GameState: GameState;
	private Helper: StateFacade;

	constructor(parserState: ParserState, helper: StateFacade) {
		this.GameState = parserState.GameState;
		this.Helper = helper;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.DAMAGE as number) &&
			node.Parent?.Type !== Action
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === Action &&
			this.hasDamageTag(node.Object as Action)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const impactedEntity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const gameEntity = this.GameState.GetGameEntity()!;
		const playerHero = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.IsHero())
			.find((entity) => entity.GetTag(GameTag.CONTROLLER) === this.Helper.LocalPlayer!.PlayerId);
		const opponentEntity = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.IsHero())
			.find((entity) => entity.GetTag(GameTag.PLAYER_ID) === playerHero?.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID));
		const targetCardId = impactedEntity?.CardId;

		if (
			this.Helper.IsBattlegrounds() &&
			impactedEntity.IsHero() &&
			(gameEntity.GetTag(GameTag.BOARD_VISUAL_STATE) === 2 ||
				gameEntity.GetTag(GameTag.BOARD_VISUAL_STATE) === -1) &&
			(opponentEntity?.CardId === targetCardId || opponentEntity?.CardId === 'TB_BaconShop_HERO_PH')
		) {
			return null;
		}
		const previousDamage = impactedEntity.GetTag(GameTag.DAMAGE, 0);
		const targetEntityId = impactedEntity?.Entity;
		const targetControllerId = impactedEntity.HasTag(GameTag.BACON_HERO_CAN_BE_DRAFTED)
			? impactedEntity.GetTag(GameTag.PLAYER_ID)
			: impactedEntity.GetEffectiveController();
		const actualDamage = Math.max(0, tagChange.Value - previousDamage - impactedEntity.GetTag(GameTag.ARMOR, 0));
		const damages: Record<string, DamageInternal> = {};
		damages[targetCardId + '-' + targetEntityId] = {
			SourceControllerId: -1,
			SourceEntityId: -1,
			TargetControllerId: targetControllerId,
			TargetEntityId: tagChange.Entity,
			TargetCardId: targetCardId,
			Damage: actualDamage,
			Timestamp: tagChange.TimeStamp,
		};
		const activePlayerId = this.GameState.GetActivePlayerId();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'DAMAGE',
				() =>
					({
						Type: 'DAMAGE',
						Value: {
							Targets: damages,
							LocalPlayer: this.Helper.LocalPlayer,
							OpponentPlayer: this.Helper.OpponentPlayer,
							ActivePlayerId: activePlayerId,
						},
					}) as GameEvent,
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const isPayingWithHealth = action.Type === (BlockType.PLAY as number);
		const damageTags = action.Data.filter((d): d is MetaData => d instanceof MetaData).filter(
			(meta) => meta.Meta === (MetaDataType.DAMAGE as number),
		);
		const totalDamages: Record<string, Record<string, DamageInternal>> = {};
		for (const damageTag of damageTags) {
			for (const info of damageTag.MetaInfo) {
				const damageTarget = this.GameState.CurrentEntities.get(info.Entity)!;
				if (
					this.Helper.IsBattlegrounds() &&
					damageTarget.IsHero() &&
					damageTarget.IsInPlay() &&
					damageTarget.GetController() !== this.Helper.LocalPlayer!.PlayerId &&
					!this.isDefendingDuringAction(action, info.Entity)
				) {
					continue;
				}

				const targetEntityId = damageTarget.Id;
				const targetCardId = this.GameState.GetCardIdForEntity(damageTarget.Id);
				const targetControllerId = damageTarget.HasTag(GameTag.BACON_HERO_CAN_BE_DRAFTED)
					? damageTarget.GetTag(GameTag.PLAYER_ID)
					: damageTarget.GetEffectiveController();
				const damageSource = this.getDamageSource(damageTarget, action, damageTag);
				const sourceEntityId = damageSource.Id;
				const sourceCardId = this.GameState.GetCardIdForEntity(damageSource.Id);
				const sourceControllerId = damageSource.HasTag(GameTag.BACON_HERO_CAN_BE_DRAFTED)
					? damageSource.GetTag(GameTag.PLAYER_ID)
					: damageSource.GetEffectiveController();

				const sourceKey = sourceCardId + '-' + sourceEntityId;
				let currentSourceDamages = totalDamages[sourceKey];
				if (!currentSourceDamages) {
					currentSourceDamages = {};
					totalDamages[sourceKey] = currentSourceDamages;
				}

				const targetKey = targetCardId + '-' + targetEntityId;
				let currentTargetDamages = currentSourceDamages[targetKey];
				if (!currentTargetDamages) {
					currentTargetDamages = {
						SourceEntityId: sourceEntityId,
						SourceControllerId: sourceControllerId,
						TargetEntityId: targetEntityId,
						TargetControllerId: targetControllerId,
						TargetCardId: targetCardId,
						Damage: 0,
						Hits: 0,
						Timestamp: info.TimeStamp,
						IsPayingWithHealth: isPayingWithHealth,
					};
					currentSourceDamages[targetKey] = currentTargetDamages;
				}
				currentTargetDamages.Damage = currentTargetDamages.Damage + damageTag.Data;
				currentTargetDamages.Hits = (currentTargetDamages.Hits ?? 0) + 1;
			}
		}

		const result: GameEventProvider[] = [];
		for (const damageSourceKey of Object.keys(totalDamages)) {
			const sourceCardId = damageSourceKey.split('-')[0];
			const targets = totalDamages[damageSourceKey];
			const firstTarget = Object.values(targets)[0];
			const timestamp = firstTarget.Timestamp;
			const sourceEntityId = firstTarget.SourceEntityId;
			const sourceControllerId = firstTarget.SourceControllerId;
			const activePlayerId = this.GameState.GetActivePlayerId();
			result.push(
				GameEventProvider.Create(
					timestamp,
					'DAMAGE',
					() =>
						({
							Type: 'DAMAGE',
							Value: {
								SourceCardId: sourceCardId,
								SourceEntityId: sourceEntityId,
								SourceControllerId: sourceControllerId,
								Targets: targets,
								LocalPlayer: this.Helper.LocalPlayer,
								OpponentPlayer: this.Helper.OpponentPlayer,
								ActivePlayerId: activePlayerId,
							},
						}) as GameEvent,
					true,
					node,
				),
			);
		}

		return result;
	}

	private isDefendingDuringAction(action: Action, entity: number): boolean {
		return action.Data.filter((data): data is TagChange => data instanceof TagChange)
			.filter((tag) => tag.Name === (GameTag.DEFENDING as number) && tag.Value === 1)
			.some((tag) => tag.Entity === entity);
	}

	private hasDamageTag(action: Action): boolean {
		return action.Data.filter((d): d is MetaData => d instanceof MetaData)
			.some((meta) => meta.Meta === (MetaDataType.DAMAGE as number));
	}

	private getDamageSource(target: any, action: Action, meta: MetaData): any {
		const actionSource = this.GameState.CurrentEntities.get(action.Entity)!;
		if (action.Type === (BlockType.ATTACK as number)) {
			let damageSource = action.Entity;
			if (target.Id === action.Entity) {
				const metaIndex = action.Data.indexOf(meta);
				for (let i = 0; i < metaIndex; i++) {
					const data = action.Data[i];
					if (
						data instanceof TagChange &&
						(data as TagChange).Name === (GameTag.PROPOSED_DEFENDER as number) &&
						(data as TagChange).Entity === this.GameState.GetGameEntity()!.Id
					) {
						damageSource = (data as TagChange).Value;
					}
				}
			}
			return this.GameState.CurrentEntities.get(damageSource)!;
		}
		return actionSource;
	}
}
