import { MatchInfo } from '@models/match-info';
import { PlayerInfo } from '@models/player-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetMatchInfoOperation extends MindVisionOperationFacade<MatchInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getMatchInfo',
			() => mindVision.getMatchInfo(),
			// matchInfo => !matchInfo || (matchInfo.LocalPlayer.Standard.LeagueId === -1 && !matchInfo.LocalPlayer.Standard.LegendRank),
			// The fact that the matchInfo is empty will depend on who calls it, so let the caller handle that
			(matchInfo: InternalMatchInfo) => false,
			(matchInfo: InternalMatchInfo) => {
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
			(matchInfo: InternalMatchInfo) => {
				const isEmpty = !matchInfo?.LocalPlayer?.Name;
				if (isEmpty) {
					console.debug('[GetMatchInfoOperation] matchInfo is empty', matchInfo, JSON.stringify(matchInfo));
				}
				// console.debug('is matchinfo empty?', !matchInfo?.LocalPlayer?.name);
				// console.debug('matchinfo', matchInfo);
				// console.debug('matchinfo str', JSON.stringify(matchInfo));
				return isEmpty;
			},
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

interface InternalMatchInfo {
	readonly BrawlSeasonId: number;
	readonly FormatType: number;
	readonly GameType: number;
	readonly MissionId: number;
	readonly BoardDbId: number;
	readonly LocalPlayer: InternalPlayer;
	readonly OpposingPlayer: InternalPlayer;
	readonly Spectator: number;
}

interface InternalPlayer {
	readonly Name: string;
	readonly Id: number;
	readonly Standard: InternalRank;
	readonly Wild: InternalRank;
	readonly Classic: InternalRank;
	readonly CardBackId: number;
	readonly Account: InternalAccount;
	readonly BattleTag: InternalBattleTag;
}

interface InternalRank {
	readonly LeagueId: number;
	readonly RankValue: number;
	readonly LegendRank: number;
	readonly StarLevel: number;
	readonly SeasonId: number;
}

interface InternalAccount {
	readonly Hi: number;
	readonly Lo: number;
}

interface InternalBattleTag {
	readonly Name: string;
	readonly Number: number;
}
