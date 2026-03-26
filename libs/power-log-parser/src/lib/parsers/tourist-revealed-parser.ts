import { BlockType, CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class TouristRevealedParser implements ActionParser {
	readonly ParserName = 'TouristRevealedParser';

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
			(node.Object as Action).Type === (BlockType.TRIGGER as number) &&
			this.GameState.CurrentEntities.get((node.Object as Action).Entity)?.CardId ===
				CardIds.TouristVfxEnchantment_VAC_422e
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		let touristEntity: FullEntity | null =
			action?.Data.filter((d): d is FullEntity => d instanceof FullEntity).find(
				(e) => e.GetTag(GameTag.TOURIST) > 0,
			) ?? null;

		if (touristEntity == null) {
			const parent = node.Parent;
			if (parent?.Type === NodeType.Action) {
				const parentAction = parent.Object as Action;
				const maybeTourist = this.GameState.CurrentEntities.get(parentAction.Entity);
				if (maybeTourist && maybeTourist.GetTag(GameTag.TOURIST) > 0) {
					touristEntity = maybeTourist;
				}
			}
		}

		if (touristEntity == null) {
			return null;
		}

		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'TOURIST_REVEALED',
				GameEventHelper.CreateProvider(
					'TOURIST_REVEALED',
					touristEntity.CardId,
					touristEntity.GetController(),
					touristEntity.Id,
					this.StateFacade,
					{
						TouristFor: touristEntity.GetTag(GameTag.TOURIST),
					},
				),
				true,
				node,
			),
		];
	}
}
