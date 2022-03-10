import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetDuelsHeroOptionsOperation extends MindVisionOperationFacade<readonly number[]> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, i18n: LocalizationFacadeService) {
		super(
			ow,
			'getDuelsHeroOptions',
			(forceReset?: boolean) => mindVision.getDuelsHeroOptions(),
			(info) => false,
			(info) => info,
			3,
			1500,
		);
	}
}
