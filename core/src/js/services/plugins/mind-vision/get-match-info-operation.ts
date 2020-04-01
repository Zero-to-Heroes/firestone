import { PlayerInfo } from '../../../models/player-info';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetMatchInfoOperation extends MindVisionOperationFacade<{ localPlayer: any; opponent: any }> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getMatchInfo',
			() => mindVision.getMatchInfo(),
			matchInfo => !matchInfo,
			matchInfo => {
				const localPlayer = this.extractPlayerInfo(matchInfo.LocalPlayer);
				const opponent = this.extractPlayerInfo(matchInfo.OpposingPlayer);
				const result = {
					localPlayer: localPlayer,
					opponent: opponent,
				};
				return result;
			},
		);
	}

	private extractPlayerInfo(matchPlayer: any): PlayerInfo {
		console.log('extracting player info', matchPlayer);
		return {
			name: matchPlayer.Name,
			cardBackId: matchPlayer.CardBackId,
			standard: {
				leagueId: matchPlayer.Standard.LeagueId,
				rankValue: matchPlayer.Standard.RankValue,
				legendRank: matchPlayer.Standard.LegendRank,
			},
			wild: {
				leagueId: matchPlayer.Wild.LeagueId,
				rankValue: matchPlayer.Wild.RankValue,
				legendRank: matchPlayer.Wild.LegendRank,
			},
		} as PlayerInfo;
	}
}
