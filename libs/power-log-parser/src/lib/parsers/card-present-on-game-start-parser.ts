import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { FullEntity, Game, Node } from '../models';
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
};

export class CardPresentOnGameStartParser implements ActionParser {
	readonly ParserName = 'CardPresentOnGameStartParser';

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
			node.Type === FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			node.Parent != null &&
			node.Parent.Type === Game
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const cardId = fullEntity.CardId;
		if (
			fullEntity.GetTag(GameTag.CARDTYPE) !== (CardType.MINION as number) ||
			fullEntity.GetTag(GameTag.HAS_BEEN_REBORN) === 1
		) {
			return null;
		}
		const controllerId = fullEntity.GetEffectiveController();
		const startingHealth = fullEntity.GetTag(GameTag.HEALTH);
		const creator = Oracle.FindCardCreator(this.GameState, fullEntity, node);
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'CARD_ON_BOARD_AT_GAME_START',
				GameEventHelper.CreateProvider(
					'CARD_ON_BOARD_AT_GAME_START',
					cardId,
					controllerId,
					fullEntity.Id,
					this.StateFacade,
					{
						Health: startingHealth,
						CreatorCardId: creator?.[0] ?? null,
						Tags: fullEntity.GetTagsCopy(),
					},
				),
				true,
				node,
			),
		];
	}
}
