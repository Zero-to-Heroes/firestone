import { MatchInfo } from '@models/match-info';
import { PlayerInfo } from '@models/player-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';

export class GetMatchInfoOperation extends MindVisionOperationFacade<MatchInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getMatchInfo',
			() => mindVision.getMatchInfo(),
			// matchInfo => !matchInfo || (matchInfo.LocalPlayer.Standard.LeagueId === -1 && !matchInfo.LocalPlayer.Standard.LegendRank),
			// The fact that the matchInfo is empty will depend on who calls it, so let the caller handle that
			(matchInfo) => false,
			(matchInfo) => {
				const localPlayer = this.extractPlayerInfo(matchInfo.LocalPlayer);
				const opponent = this.extractPlayerInfo(matchInfo.OpposingPlayer);
				const result = {
					localPlayer: localPlayer,
					opponent: opponent,
					boardId: matchInfo.BoardDbId,
				};
				return result;
			},
			3,
			1500,
			(matchInfo) => !matchInfo?.LocalPlayer?.name,
		);
	}

	private extractPlayerInfo(matchPlayer: any): PlayerInfo {
		return {
			name: matchPlayer.Name,
			cardBackId: matchPlayer.CardBackId,
			standard: {
				leagueId: matchPlayer.Standard?.LeagueId,
				rankValue: matchPlayer.Standard?.RankValue,
				legendRank: matchPlayer.Standard?.LegendRank,
			},
			wild: {
				leagueId: matchPlayer.Wild?.LeagueId,
				rankValue: matchPlayer.Wild?.RankValue,
				legendRank: matchPlayer.Wild?.LegendRank,
			},
			classic: {
				leagueId: matchPlayer.Classic?.LeagueId,
				rankValue: matchPlayer.Classic?.RankValue,
				legendRank: matchPlayer.Classic?.LegendRank,
			},
		} as PlayerInfo;
	}
}
