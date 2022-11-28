import { AdventuresInfo } from '@models/memory/memory-duels';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetAdventuresInfoOperation extends MindVisionOperationFacade<AdventuresInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, i18n: LocalizationFacadeService) {
		super(
			ow,
			'getAdventuresInfo',
			(forceReset?: boolean) => mindVision.getAdventuresInfo(),
			(info) => false,
			(info) => info,
			1,
			500,
		);
	}
}
