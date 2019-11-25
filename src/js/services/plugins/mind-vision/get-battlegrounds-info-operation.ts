import { BattlegroundsInfo } from '../../../models/battlegrounds-info';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetBattlegroundsInfoOperation extends MindVisionOperationFacade<BattlegroundsInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getBattlegroundsInfo',
			() => mindVision.getBattlegroundsInfo(),
			battlegroundsInfo => battlegroundsInfo.Rating <= 0,
			battlegroundsInfo =>
				Object.assign(new BattlegroundsInfo(), {
					rating: battlegroundsInfo.Rating,
					previousRating: battlegroundsInfo.PreviousRating,
				} as BattlegroundsInfo),
		);
	}
}
