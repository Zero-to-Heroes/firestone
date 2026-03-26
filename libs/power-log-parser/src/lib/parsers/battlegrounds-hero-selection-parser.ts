import { CardType, GameTag, Mulligan, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsHeroSelectionParser implements ActionParser {
	readonly ParserName = 'BattlegroundsHeroSelectionParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, helper: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = helper;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.MULLIGAN_STATE as number) &&
			(node.Object as TagChange).Value === (Mulligan.INPUT as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const playerId = this.StateFacade.LocalPlayer!.PlayerId;
		const fullEntities = [...this.GameState.CurrentEntities.values()]
			.filter((data) => data.GetEffectiveController() === playerId)
			.filter((data) => data.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((data) => data.GetTag(GameTag.ZONE) === (Zone.HAND as number))
			.filter(
				(data) =>
					data.GetTag(GameTag.BACON_HERO_CAN_BE_DRAFTED) === 1 ||
					data.GetTag(GameTag.BACON_SKIN) === 1,
			);
		fullEntities.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION));
		if (fullEntities.length > 0) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'BATTLEGROUNDS_HERO_SELECTION',
					() => {
						if (!this.StateFacade.IsBattlegrounds()) {
							return null;
						}
						return {
							Type: 'BATTLEGROUNDS_HERO_SELECTION',
							Value: {
								Options: fullEntities.map((entity) => ({
									CardId: entity.CardId,
									EntityId: entity.Id,
								})),
							},
						};
					},
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
