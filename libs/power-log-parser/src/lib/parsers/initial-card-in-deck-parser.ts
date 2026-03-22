import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { FullEntity, Node } from '../models';
import { GameAction } from '../models/game-action';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class InitialCardInDeckParser implements ActionParser {
	readonly ParserName = 'InitialCardInDeckParser';

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
		// C# checks typeof(GameAction) — an abstract class — so this never matches
		// (the parent of initial deck FullEntities is typeof(Game), not typeof(GameAction))
		const appliesOnFullEntity =
			node.Type === FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.DECK as number) &&
			node.Parent?.Type === GameAction;
		return stateType === StateType.PowerTaskList && appliesOnFullEntity;
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const controllerId = fullEntity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'INITIAL_CARD_IN_DECK',
				GameEventHelper.CreateProvider(
					'INITIAL_CARD_IN_DECK',
					null as any,
					controllerId,
					fullEntity.Id,
					this.StateFacade,
					null,
				),
				true,
				node,
			),
		];
	}
}
