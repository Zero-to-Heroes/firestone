import { GameTag, GameType } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsPlayerLeaderboardPlaceUpdatedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsPlayerLeaderboardPlaceUpdatedParser';

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
			((node.Object as TagChange).Name === (GameTag.PLAYER_LEADERBOARD_PLACE as number) ||
				(node.Object as TagChange).Name === (GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const hero = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (hero?.CardId != null && hero.CardId.length > 0 && !hero.IsBaconBartender()) {
			const basePlace =
				tagChange.Name === (GameTag.PLAYER_LEADERBOARD_PLACE as number)
					? tagChange.Value
					: hero.GetTag(GameTag.PLAYER_LEADERBOARD_PLACE, 0);
			const baseFirst =
				tagChange.Name === (GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT as number)
					? tagChange.Value
					: hero.GetTag(GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT, 0);
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'BATTLEGROUNDS_LEADERBOARD_PLACE',
					() => {
						if (!this.StateFacade.IsBattlegrounds()) {
							return null;
						}
						const gameType = this.StateFacade.GetMetaData().GameType;
						const leaderboardPlace =
							gameType === (GameType.GT_BATTLEGROUNDS_DUO as number) ||
							gameType === (GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY as number) ||
							gameType === (GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI as number) ||
							gameType === (GameType.GT_BATTLEGROUNDS_DUO_VS_AI as number)
								? basePlace * 2 - baseFirst
								: basePlace;
						return {
							Type: 'BATTLEGROUNDS_LEADERBOARD_PLACE',
							Value: {
								CardId: hero.CardId,
								PlayerId: hero.GetTag(GameTag.PLAYER_ID),
								LeaderboardPlace: leaderboardPlace,
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
