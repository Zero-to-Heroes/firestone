import { PlayerInfo } from '../../../models/player-info';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetMatchInfoOperation extends MindVisionOperationFacade<{ localPlayer: any; opponent: any }> {
	constructor(private readonly mindVision: MindVisionService) {
		super(
			'getMatchInfo',
			() => this.mindVision.getMatchInfo(),
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
		return {
			name: matchPlayer.Name,
			cardBackId: matchPlayer.CardBackId,
			standardLegendRank: matchPlayer.StandardLegendRank,
			standardRank: matchPlayer.StandardRank,
			wildLegendRank: matchPlayer.WildLegendRank,
			wildRank: matchPlayer.WildRank,
		} as PlayerInfo;
	}
}
