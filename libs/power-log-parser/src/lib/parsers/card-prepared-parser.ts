import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CardPreparedParser implements ActionParser {
	readonly ParserName = 'CardPreparedParser';

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
			(node.Object as TagChange).Name === (GameTag.PREPARE_REVEALED as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'CARD_PREPARED',
				GameEventHelper.CreateProvider(
					'CARD_PREPARED',
					entity?.CardId ?? '',
					entity?.GetController() ?? 0,
					tagChange.Entity,
					this.StateFacade,
					{
						PrepareValue: tagChange.Value,
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
