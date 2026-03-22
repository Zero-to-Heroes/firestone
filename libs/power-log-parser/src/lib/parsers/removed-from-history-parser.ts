import { ActionParser } from '../action-parser';
import { MetaDataType } from '../enums';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { MetaData, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class RemovedFromHistoryParser implements ActionParser {
	readonly ParserName = 'RemovedFromHistoryParser';

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
			node.Type === MetaData &&
			(node.Object as MetaData).Meta === (MetaDataType.HISTORY_REMOVE_ENTITIES as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const meta = node.Object as MetaData;
		const infos = meta.MetaInfo;
		const result: GameEventProvider[] = [];
		for (const info of infos) {
			const entity = this.GameState.CurrentEntities.get(info.Entity);
			if (entity?.Entity != null) {
				result.push(
					GameEventProvider.Create(
						meta.TimeStamp,
						'REMOVE_FROM_HISTORY',
						GameEventHelper.CreateProvider(
							'REMOVE_FROM_HISTORY',
							entity.CardId,
							entity.GetController(),
							entity.Id,
							this.StateFacade,
							null,
						),
						true,
						node,
					),
				);
			}
		}
		return result;
	}
}
