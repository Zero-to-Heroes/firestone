import { OverwolfService } from '@firestone/shared/framework/core';
import { MatchInfo } from '../../../external-models/match-info';
import { PlayerInfo } from '../../../external-models/player-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetMatchInfoOperation extends MindVisionOperationFacade<MatchInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getMatchInfo',
			() => mindVision.getMatchInfo(),
			// matchInfo => !matchInfo || (matchInfo.LocalPlayer.Standard.LeagueId === -1 && !matchInfo.LocalPlayer.Standard.LegendRank),
			// The fact that the matchInfo is empty will depend on who calls it, so let the caller handle that
			(matchInfo: InternalMatchInfo) => !matchInfo?.LocalPlayer?.Name,
			(matchInfo: InternalMatchInfo) => {
				const localPlayer = this.extractPlayerInfo(matchInfo.LocalPlayer);
				const opponent = this.extractPlayerInfo(matchInfo.OpposingPlayer);
				const result = {
					localPlayer: localPlayer,
					opponent: opponent,
					boardId: matchInfo.BoardDbId,
					anomalies: [],
				};
				return result;
			},
			3,
			1500,
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
				seasonId: matchPlayer.Standard?.SeasonId,
				starLevel: matchPlayer.Standard?.StarLevel,
			},
			wild: {
				leagueId: matchPlayer.Wild?.LeagueId,
				rankValue: matchPlayer.Wild?.RankValue,
				legendRank: matchPlayer.Wild?.LegendRank,
				seasonId: matchPlayer.Wild?.SeasonId,
				starLevel: matchPlayer.Wild?.StarLevel,
			},
			classic: {
				leagueId: matchPlayer.Classic?.LeagueId,
				rankValue: matchPlayer.Classic?.RankValue,
				legendRank: matchPlayer.Classic?.LegendRank,
				seasonId: matchPlayer.Classic?.SeasonId,
				starLevel: matchPlayer.Classic?.StarLevel,
			},
			twist: {
				leagueId: matchPlayer.Twist?.LeagueId,
				rankValue: matchPlayer.Twist?.RankValue,
				legendRank: matchPlayer.Twist?.LegendRank,
				seasonId: matchPlayer.Twist?.SeasonId,
				starLevel: matchPlayer.Twist?.StarLevel,
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
	readonly Twist: InternalRank;
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
