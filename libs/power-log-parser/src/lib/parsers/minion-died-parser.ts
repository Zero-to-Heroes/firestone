import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MinionDiedParser implements ActionParser {
	readonly ParserName = 'MinionDiedParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.Action &&
			(node.Object as Action).Type === (BlockType.DEATHS as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const deathTags = action
			.GetDataRecursive()
			.filter((d): d is TagChange => d instanceof TagChange)
			.filter((t) => t.Name === (GameTag.ZONE as number) && t.Value === (Zone.GRAVEYARD as number))
			.filter((t) => this.GameState.CurrentEntities.get(t.Entity)?.IsMinionLike() ?? false);

		const deadMinions = deathTags
			.map((tag) => {
				const entity = this.GameState.CurrentEntities.get(tag.Entity)!;
				if (entity.GetCardType() !== (CardType.MINION as number)) {
					return null;
				}
				return {
					CardId: entity.CardId,
					EntityId: entity.Id,
					ControllerId: entity.GetEffectiveController(),
					Cost: entity.GetCost(),
					Timestamp: tag.TimeStamp,
				};
			})
			.filter((death) => death != null);

		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'MINIONS_DIED',
				GameEventHelper.CreateProvider('MINIONS_DIED', null as any, -1, -1, this.StateFacade, {
					DeadMinions: deadMinions,
					ActivePlayerId: this.GameState.GetActivePlayerId(),
				}),
				true,
				node,
			),
		];
	}
}
