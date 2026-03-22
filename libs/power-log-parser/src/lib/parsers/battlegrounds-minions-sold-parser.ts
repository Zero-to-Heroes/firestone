import { BlockType, CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsMinionsSoldParser implements ActionParser {
	readonly ParserName = 'BattlegroundsMinionsSoldParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

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
			this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId ===
				CardIds.DragToSell
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const zoneTagChange = action
			.GetDataRecursive()
			.filter((data) => data instanceof TagChange)
			.map((data) => data as unknown as TagChange)
			.find(
				(tag) =>
					tag.Name === (GameTag.ZONE as number) && tag.Value === (Zone.SETASIDE as number),
			);
		if (zoneTagChange == null) {
			return null;
		}

		const soldMinion = this.GameState.CurrentEntities.get(zoneTagChange.Entity)!;
		const cardId = soldMinion.CardId;
		const controller = soldMinion.GetEffectiveController();
		return [
			GameEventProvider.Create(
				(node.Object as Action).TimeStamp,
				'BATTLEGROUNDS_MINION_SOLD',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_MINION_SOLD',
					cardId,
					controller,
					soldMinion.Entity,
					this.StateFacade,
					null,
				),
				true,
				node,
			),
		];
	}
}
