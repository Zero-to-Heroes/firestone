import { CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class SpawnTimeCountChangedParser implements ActionParser {
	readonly ParserName = 'SpawnTimeCountChangedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.SPAWN_TIME_COUNT as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity) ?? null;
		if (entity == null) {
			return null;
		}

		if (entity.GetTag(GameTag.CARDTYPE) !== (CardType.ENCHANTMENT as number)) {
			return null;
		}

		const cardId = !entity.CardId ? null : entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'SPAWN_TIME_COUNT_CHANGED',
				GameEventHelper.CreateProvider(
					'SPAWN_TIME_COUNT_CHANGED',
					cardId as any,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						Count: tagChange.Value,
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
