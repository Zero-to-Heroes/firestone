import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class NumCardsPlayedThisTurnParser implements ActionParser {
	readonly ParserName = 'NumCardsPlayedThisTurnParser';

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
			!this.ParserState.IsBattlegrounds() &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.NUM_CARDS_PLAYED_THIS_TURN as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardsPlayed = tagChange.Value;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'NUM_CARDS_PLAYED_THIS_TURN',
				GameEventHelper.CreateProvider(
					'NUM_CARDS_PLAYED_THIS_TURN',
					null as any,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						NumCardsPlayed: cardsPlayed,
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
