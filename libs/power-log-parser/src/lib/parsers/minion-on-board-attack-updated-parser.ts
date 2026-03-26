import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MinionOnBoardAttackUpdatedParser implements ActionParser {
	readonly ParserName = 'MinionOnBoardAttackUpdatedParser';

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
			(node.Object as TagChange).Name === (GameTag.ATK as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.PLAY as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const initialAttack = entity.GetTag(GameTag.ATK);
		const newAttack = tagChange.Value;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		let sourceEntityId: number | null = null;
		let sourceCardId: string | null = null;
		if (node.Parent != null && node.Parent.Object instanceof Action) {
			const parentAction = node.Parent.Object as Action;
			sourceEntityId = parentAction.Entity;
			sourceCardId = this.GameState.CurrentEntities.get(parentAction.Entity)?.CardId ?? null;
		}
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'MINION_ON_BOARD_ATTACK_UPDATED',
				GameEventHelper.CreateProvider(
					'MINION_ON_BOARD_ATTACK_UPDATED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						InitialAttack: initialAttack,
						NewAttack: newAttack,
						SourceEntityId: sourceEntityId,
						SourceCardId: sourceCardId,
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
