import { BlockType, CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsMinionsBoughtParser implements ActionParser {
	readonly ParserName = 'BattlegroundsMinionsBoughtParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	private Cards: string[] = [
		CardIds.DragToBuy,
		CardIds.DragToBuySpell_TB_BaconShop_DragBuy_Spell,
	];

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			node.Type === Action &&
			(node.Object as Action).Type === (BlockType.POWER as number) &&
			this.GameState.CurrentEntities.has((node.Object as Action).Entity) &&
			this.Cards.includes(this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const controllerTagChange = action.Data.filter((data) => data instanceof TagChange)
			.map((data) => data as unknown as TagChange)
			.find((tag) => tag.Name === (GameTag.CONTROLLER as number));
		if (controllerTagChange == null) {
			return null;
		}

		const boughtMinion = this.GameState.CurrentEntities.get(controllerTagChange.Entity)!;
		const cardId = boughtMinion.CardId;
		const controller = controllerTagChange.Value;
		return [
			GameEventProvider.Create(
				(node.Object as Action).TimeStamp,
				'BATTLEGROUNDS_MINION_BOUGHT',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_MINION_BOUGHT',
					cardId,
					controller,
					boughtMinion.Entity,
					this.StateFacade,
					null,
				),
				true,
				node,
			),
		];
	}
}
