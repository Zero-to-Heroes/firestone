import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class ConstructedAnomalyParser implements ActionParser {
	readonly ParserName = 'ConstructedAnomalyParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			((node.Object as TagChange).Name === (GameTag.ANOMALY1 as number) ||
				(node.Object as TagChange).Name === (GameTag.ANOMALY2 as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Value);
		if (entity == null) {
			return null;
		}

		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'ANOMALY_REVEALED',
				GameEventHelper.CreateProvider('ANOMALY_REVEALED', cardId, controllerId, entity.Id, this.StateFacade),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
