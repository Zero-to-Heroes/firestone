import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEvent, GameEventProvider } from '../game-event';
import { Action, MetaData, Node, NodeType } from '../models';
import { MetaDataType } from '../enums';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

interface HealingInternal {
	SourceEntityId: number;
	SourceControllerId: number;
	TargetEntityId: number;
	TargetControllerId: number;
	Healing: number;
	Timestamp: string;
}

export class HealingParser implements ActionParser {
	readonly ParserName = 'HealingParser';

	private GameState: GameState;
	private Helper: StateFacade;

	constructor(parserState: ParserState, helper: StateFacade) {
		this.GameState = parserState.GameState;
		this.Helper = helper;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.Action &&
			this.hasHealingTag(node.Object as Action)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const healingTags = action.Data.filter((d): d is MetaData => d instanceof MetaData).filter(
			(meta) => meta.Meta === (MetaDataType.HEALING as number),
		);
		const totalHealings: Record<string, Record<string, HealingInternal>> = {};
		for (const healingTag of healingTags) {
			for (const info of healingTag.MetaInfo) {
				const healingTarget = this.GameState.CurrentEntities.get(info.Entity)!;
				const targetEntityId = healingTarget.Id;
				const targetCardId = this.GameState.GetCardIdForEntity(healingTarget.Id);
				const targetControllerId = healingTarget.GetEffectiveController();
				const healingSource = this.getHealingSource(action);
				const sourceEntityId = healingSource.Id;
				const sourceCardId = this.GameState.GetCardIdForEntity(healingSource.Id);
				const sourceControllerId = healingSource.GetEffectiveController();

				let currentSourceHealings = totalHealings[sourceCardId!];
				if (!currentSourceHealings) {
					currentSourceHealings = {};
					totalHealings[sourceCardId!] = currentSourceHealings;
				}

				let currentTargetHealings = currentSourceHealings[targetCardId!];
				if (!currentTargetHealings) {
					currentTargetHealings = {
						SourceEntityId: sourceEntityId,
						SourceControllerId: sourceControllerId,
						TargetEntityId: targetEntityId,
						TargetControllerId: targetControllerId,
						Healing: 0,
						Timestamp: info.TimeStamp,
					};
					currentSourceHealings[targetCardId!] = currentTargetHealings;
				}
				currentTargetHealings.Healing = currentTargetHealings.Healing + healingTag.Data;
			}
		}

		const result: GameEventProvider[] = [];
		for (const healingSource of Object.keys(totalHealings)) {
			const targetHealings = totalHealings[healingSource];
			const firstTarget = Object.values(targetHealings)[0];
			const timestamp = firstTarget.Timestamp;
			result.push(
				GameEventProvider.Create(
					timestamp,
					'HEALING',
					() =>
						({
							Type: 'HEALING',
							Value: {
								SourceCardId: healingSource,
								SourceEntityId: Object.values(targetHealings)[0].SourceEntityId,
								SourceControllerId: Object.values(targetHealings)[0].SourceControllerId,
								Targets: targetHealings,
								LocalPlayer: this.Helper.LocalPlayer,
								OpponentPlayer: this.Helper.OpponentPlayer,
							},
						}) as GameEvent,
					true,
					node,
				),
			);
		}

		return result;
	}

	private hasHealingTag(action: Action): boolean {
		return action.Data.filter((d): d is MetaData => d instanceof MetaData).some(
			(meta) => meta.Meta === (MetaDataType.HEALING as number),
		);
	}

	private getHealingSource(action: Action): any {
		return this.GameState.CurrentEntities.get(action.Entity)!;
	}
}
