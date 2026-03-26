import { CardIds, CardType } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsTrinketSelectionParser implements ActionParser {
	readonly ParserName = 'BattlegroundsTrinketSelectionParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			node.Type === FullEntity &&
			(node.Object as FullEntity).GetCardType() === (CardType.BATTLEGROUND_TRINKET as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Parent == null || node.Parent.Type !== Action) {
			return null;
		}

		const parentAction = node.Parent.Object as Action;
		const entity = this.GameState.CurrentEntities.get(parentAction.Entity);
		if (
			entity?.CardId !== CardIds.LesserTrinketToken_BG30_Trinket_1st &&
			entity?.CardId !== CardIds.GreaterTrinket_BG30_Trinket_2nd
		) {
			// Don't return null here - we also want to show data for trinkets created by other trinkets or hero powers
		}

		const controllerId = entity!.GetEffectiveController();
		const options = parentAction.Data.filter((d) => d instanceof FullEntity)
			.map((d) => d as unknown as FullEntity)
			.filter((f) => f.GetCardType() === (CardType.BATTLEGROUND_TRINKET as number))
			.map((f) => ({
				CardId: f.CardId,
				Cost: f.GetCost(),
			}));
		if (options.length !== 4) {
			return null;
		}

		return [
			GameEventProvider.Create(
				parentAction.TimeStamp,
				'BATTLEGROUNDS_TRINKET_SELECTION',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_TRINKET_SELECTION',
					entity!.CardId,
					controllerId,
					entity!.Entity,
					this.StateFacade,
					{
						Options: options,
					},
				),
				true,
				node,
			),
		];
	}
}
