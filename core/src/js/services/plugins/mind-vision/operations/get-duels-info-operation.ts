import { GameFormat } from '@firestone-hs/reference-data';
import { DuelsInfo } from '@models/memory/memory-duels';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetDuelsInfoOperation extends MindVisionOperationFacade<DuelsInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, i18n: LocalizationFacadeService) {
		super(
			ow,
			'getDuelsInfo',
			(forceReset?: boolean) => mindVision.getDuelsInfo(forceReset),
			(info) => false,
			(info) =>
				({
					...info,
					FormatType: GameFormat.FT_WILD,
					Name: i18n.translateString('app.duels.deck-stat.default-deck-name-blank'),
				} as DuelsInfo),
			3,
			1500,
		);
	}
}
