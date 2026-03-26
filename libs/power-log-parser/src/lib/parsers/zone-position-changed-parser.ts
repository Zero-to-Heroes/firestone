import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class ZonePositionChangedParser implements ActionParser {
	readonly ParserName = 'ZonePositionChangedParser';

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
			(node.Object as TagChange).Name === (GameTag.ZONE_POSITION as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		if (tagChange.Value === 0) {
			return null;
		}

		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const currentPosition = entity.GetZone();
		const zonePosition = tagChange.Value;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'ZONE_POSITION_CHANGED',
				GameEventHelper.CreateProvider(
					'ZONE_POSITION_CHANGED',
					null as any,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						ZonePosition: zonePosition,
						ZoneUpdates: [
							{
								CardId: cardId,
								EntityId: entity.Id,
								ControllerId: controllerId,
								Zone: currentPosition,
								NewPosition: zonePosition,
							},
						],
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
