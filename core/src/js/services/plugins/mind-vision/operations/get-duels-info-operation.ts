import { GameFormat } from '@firestone-hs/reference-data';
import { DuelsInfo } from '@models/duels-info';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';

export class GetDuelsInfoOperation extends MindVisionOperationFacade<DuelsInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService, i18n: LocalizationFacadeService) {
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
					HeroCardId: 'HERO_01', // Fake
				} as DuelsInfo),
			3,
			1500,
		);
	}
}
