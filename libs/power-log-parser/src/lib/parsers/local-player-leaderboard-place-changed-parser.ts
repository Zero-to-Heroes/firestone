import { GameTag, GameType } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class LocalPlayerLeaderboardPlaceChangedParser implements ActionParser {
	readonly ParserName = 'LocalPlayerLeaderboardPlaceChangedParser';

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
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		const basePlace =
			tagChange.Name === (GameTag.PLAYER_LEADERBOARD_PLACE as number)
				? tagChange.Value
				: entity.GetTag(GameTag.PLAYER_LEADERBOARD_PLACE, 0);
		const baseFirst =
			tagChange.Name === (GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT as number)
				? tagChange.Value
				: entity.GetTag(GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT, 0);

		if (entity.GetEffectiveController() === this.StateFacade.LocalPlayer!.PlayerId) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED',
					GameEventHelper.CreateProviderWithDeferredProps(
						'LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED',
						null as any,
						-1,
						entity.Id,
						this.StateFacade,
						() => {
							const gameType = this.StateFacade.GetMetaData().GameType;
							const leaderboardPlace =
								gameType === (GameType.GT_BATTLEGROUNDS_DUO as number) ||
								gameType === (GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY as number) ||
								gameType === (GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI as number) ||
								gameType === (GameType.GT_BATTLEGROUNDS_DUO_VS_AI as number)
									? basePlace * 2 - baseFirst
									: basePlace;
							return {
								NewPlace: leaderboardPlace,
							};
						},
					),
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
