import { CardIds, MetaTags } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, MetaData, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const SPECIAL_TARGET_CARD_IDS: string[] = [CardIds.FuturisticForefather_TIME_041];

export class SpecialTargetParser implements ActionParser {
	readonly ParserName = 'SpecialTargetParser';

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
			(node.Object as MetaData).Meta === (MetaTags.TARGET as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const meta = node.Object as MetaData;
		const target = meta.MetaInfo[0]?.Entity;
		if (target == null) {
			return null;
		}

		const parent = node.Parent;
		if (parent?.Type !== Action) {
			return null;
		}

		const parentAction = parent.Object as Action;
		const parentEntity = this.GameState.CurrentEntities.get(parentAction.Entity);
		if (!SPECIAL_TARGET_CARD_IDS.includes(parentEntity?.CardId ?? '')) {
			return null;
		}

		return [
			GameEventProvider.Create(
				meta.TimeStamp,
				'SPECIAL_TARGET',
				GameEventHelper.CreateProvider(
					'SPECIAL_TARGET',
					parentEntity!.CardId,
					parentEntity!.GetController(),
					parentEntity!.Id,
					this.StateFacade,
					{
						TargetCardId: this.GameState.CurrentEntities.get(target)?.CardId,
						TargetEntityId: target,
					},
				),
				true,
				node,
			),
		];
	}
}
