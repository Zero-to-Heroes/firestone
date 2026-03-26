import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { FullEntity, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class HeroRevealedParser implements ActionParser {
	readonly ParserName = 'HeroRevealedParser';

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
		let fullEntity: FullEntity;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.FullEntity &&
			(fullEntity = node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			fullEntity.GetCardType() === (CardType.HERO as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const cardId = fullEntity.CardId;
		const controllerId = fullEntity.GetEffectiveController();
		const health = fullEntity.GetTag(GameTag.HEALTH);
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'HERO_REVEALED',
				GameEventHelper.CreateProvider('HERO_REVEALED', cardId, controllerId, fullEntity.Id, this.StateFacade, {
					Health: health,
				}),
				true,
				node,
			),
		];
	}
}
