import { PackInfo } from '@firestone/collection/view';
import { GameStatusService } from '@firestone/shared/common/service';
import { BoostersInfo } from '../../../models/boosters-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBoostersInfoOperation extends MindVisionOperationFacade<readonly PackInfo[]> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getBoostersInfo',
			() => mindVision.getBoostersInfo(),
			(boostersInfo: BoostersInfo) => !boostersInfo?.Boosters?.length,
			(boostersInfo: BoostersInfo) => {
				return boostersInfo.Boosters.map(
					(booster) =>
						({
							packType: booster.BoosterId,
							totalObtained: booster.EverGrantedCount,
							unopened: booster.Count,
						}) as PackInfo,
				) as readonly PackInfo[];
			},
		);
	}
}
