import { BlockType, CardIds, GameTag, Step, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

// TODO: Oracle
const Oracle = {
	FindCardCreator(
		_gameState: GameState,
		_entity: FullEntity,
		_node: Node,
	): [string, number] | null {
		return null;
	},
	PredictCardId(
		_gameState: GameState,
		_creatorCardId: string | null | undefined,
		_creatorEntityId: number,
		_node: Node,
		_cardId: string | null,
	): string | null {
		return null;
	},
};

export class CardTradedParser implements ActionParser {
	readonly ParserName = 'CardTradedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.DECK as number) &&
			this.isTrade(node.Parent)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const zoneInt = entity.GetTag(GameTag.ZONE) === -1 ? 0 : entity.GetTag(GameTag.ZONE);
		const initialZone = Zone[zoneInt] ?? String(zoneInt);
		let cardId: string | null = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (!cardId || cardId.length === 0) {
			const creator = Oracle.FindCardCreator(this.GameState, entity, node);
			cardId = Oracle.PredictCardId(this.GameState, creator?.[0], creator?.[1] ?? -1, node, cardId);
		}

		const isBeforeMulligan = this.GameState.GetGameEntity()?.GetTag(GameTag.NEXT_STEP) === -1;
		const isOpponentMulligan =
			this.GameState.GetGameEntity()?.GetTag(GameTag.NEXT_STEP) === (Step.BEGIN_MULLIGAN as number) &&
			entity.GetController() === this.StateFacade.OpponentPlayer?.PlayerId;
		if ((isOpponentMulligan || isBeforeMulligan) && cardId === CardIds.EncumberedPackMule) {
			cardId = '';
		}

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'TRADE_CARD',
				GameEventHelper.CreateProvider(
					'TRADE_CARD',
					cardId ?? null as any,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						InitialZone: initialZone,
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

	private isTrade(node: Node | null): boolean {
		return (
			node?.Type === NodeType.Action && (node.Object as Action).Type === (BlockType.DECK_ACTION as number)
		);
	}
}
