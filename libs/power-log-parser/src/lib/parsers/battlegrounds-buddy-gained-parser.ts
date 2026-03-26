import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsBuddyGainedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsBuddyGainedParser';

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
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.BACON_PLAYER_NUM_HERO_BUDDIES_GAINED as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const hero = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (hero == null) {
			return null;
		}

		const heroCardId = hero.CardId;
		const heroes = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.CardId === heroCardId)
			.filter((entity) => entity.GetTag(GameTag.BACON_PLAYER_NUM_HERO_BUDDIES_GAINED) >= tagChange.Value);
		if (heroes.length > 0) {
			return null;
		}

		if (hero?.CardId != null && hero.CardId.length > 0 && !hero.IsBaconBartender() && tagChange.Value >= 1) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'BATTLEGROUNDS_BUDDY_GAINED',
					() => ({
						Type: 'BATTLEGROUNDS_BUDDY_GAINED',
						Value: {
							CardId: hero.CardId,
							PlayerId: hero.GetTag(GameTag.PLAYER_ID, 0),
							TotalBuddies: tagChange.Value,
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
