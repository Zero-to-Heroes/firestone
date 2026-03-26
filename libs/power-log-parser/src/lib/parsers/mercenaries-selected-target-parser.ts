import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MercenariesSelectedTargetParser implements ActionParser {
	readonly ParserName = 'MercenariesSelectedTargetParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.LETTUCE_SELECTED_TARGET as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();

		if (tagChange.Value === 0) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'MERCENARIES_UNSELECTED_TARGET',
					GameEventHelper.CreateProvider(
						'MERCENARIES_UNSELECTED_TARGET',
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
						null,
					),
					true,
					node,
				),
			];
		} else {
			const targetEntityId = tagChange.Value;
			const targetEntity = this.GameState.CurrentEntities.get(targetEntityId)!;
			const targetCardId = this.GameState.GetCardIdForEntity(targetEntityId);
			const targetControllerId = targetEntity.GetEffectiveController();

			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'MERCENARIES_SELECTED_TARGET',
					GameEventHelper.CreateProvider(
						'MERCENARIES_SELECTED_TARGET',
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
						{
							TargetControllerId: targetControllerId,
							TargetCardId: targetCardId,
							TargetEntityId: targetEntityId,
						},
					),
					true,
					node,
				),
			];
		}
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
