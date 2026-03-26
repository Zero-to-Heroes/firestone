import { BlockType, CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const SPECIAL_POWER_CARDS: string[] = [
	CardIds.DewProcess,
	CardIds.LorekeeperPolkelt,
	CardIds.OrderInTheCourt,
	CardIds.SphereOfSapience,
	CardIds.CityChiefEsho_TLC_110,
	CardIds.TimelessCausality_TIME_061,
];

export class SpecialCardPowerParser implements ActionParser {
	readonly ParserName = 'SpecialCardPowerParser';

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
		let action: Action | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.Action &&
			((action = node.Object as Action).Type === (BlockType.POWER as number) ||
				action.Type === (BlockType.TRIGGER as number)) &&
			this.GameState.CurrentEntities.has(action.Entity) &&
			SPECIAL_POWER_CARDS.includes(this.GameState.CurrentEntities.get(action.Entity)!.CardId)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const relatedEntities = action.Data.filter((data): data is FullEntity => data instanceof FullEntity).map(
			(e) => this.GameState.CurrentEntities.get(e.Entity)!,
		);
		const relatedCards = relatedEntities.map((e) => ({
			EntityId: e.Entity,
			CardId: e.CardId,
			OriginalEntityId: e.GetTag(GameTag.LINKED_ENTITY, -1),
		}));
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'SPECIAL_CARD_POWER_TRIGGERED',
				GameEventHelper.CreateProvider(
					'SPECIAL_CARD_POWER_TRIGGERED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						RelatedCards: relatedCards,
					},
				),
				true,
				node,
			),
		];
	}
}
