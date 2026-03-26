import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { MetaData, Node, NodeType } from '../models';
import { MetaDataType } from '../enums';
import { Logger } from '../logger';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BurnedCardParser implements ActionParser {
	readonly ParserName = 'BurnedCardParser';

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
			node.Type === NodeType.MetaData &&
			(node.Object as MetaData).Meta === (MetaDataType.BURNED_CARD as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const meta = node.Object as MetaData;
		if (meta == null) {
			Logger.Log('Could not find meta info', '');
		}
		const result: GameEventProvider[] = [];
		for (const info of meta.MetaInfo) {
			const entity = this.GameState.CurrentEntities.get(info.Entity)!;
			if (entity == null) {
				Logger.Log('Could not find entity', info.Entity);
			}
			const cardId = entity.CardId;
			if (cardId == null) {
				Logger.Log('Could not identify burned card id', info.Entity);
			}
			const controllerId = entity.GetEffectiveController();
			result.push(
				GameEventProvider.CreateWithDuplicate(
					meta.TimeStamp,
					'BURNED_CARD',
					GameEventHelper.CreateProvider(
						'BURNED_CARD',
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
					),
					(provider: GameEventProvider) => {
						if (provider == null) {
							Logger.Log('Error: trying to instantiate an event with null provider', node.CreationLogLine);
							return false;
						}
						const gameEvent = provider.SupplyGameEvent?.();
						if (gameEvent == null) {
							Logger.Log('Could not identify gameEvent', provider.CreationLogLine);
							return false;
						}
						if (gameEvent.Type !== 'CARD_REMOVED_FROM_DECK') {
							return false;
						}
						const obj = gameEvent.Value;
						return obj != null && obj.CardId === cardId;
					},
					true,
					node,
				),
			);
		}
		return result;
	}
}
