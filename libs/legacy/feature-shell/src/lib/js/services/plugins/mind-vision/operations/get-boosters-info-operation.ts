import { PackInfo } from '@firestone/collection/view';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BoostersInfo } from '@models/memory/boosters-info';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
export class GetBoostersInfoOperation extends MindVisionOperationFacade<readonly PackInfo[]> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
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
						} as PackInfo),
				) as readonly PackInfo[];
			},
		);
	}
}
