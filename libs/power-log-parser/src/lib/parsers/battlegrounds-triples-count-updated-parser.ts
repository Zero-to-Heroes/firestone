import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsTriplesCountUpdatedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsTriplesCountUpdatedParser';

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
			this.StateFacade.IsBattlegrounds() &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.PLAYER_TRIPLES as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const hero = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (hero?.CardId != null && !hero.IsBaconBartender() && tagChange.Value > 0) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'BATTLEGROUNDS_TRIPLE',
					() => ({
						Type: 'BATTLEGROUNDS_TRIPLE',
						Value: {
							CardId: hero.CardId,
							PlayerId: hero.GetTag(GameTag.PLAYER_ID),
						},
					}),
					false,
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
