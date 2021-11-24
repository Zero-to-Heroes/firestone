import { Injectable } from '@angular/core';
import { ImageLocalizationOptions, LocalizationService } from './localization.service';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class LocalizationFacadeService {
	private service: LocalizationService;

	constructor(private readonly ow: OverwolfService) {
		this.service = this.ow.getMainWindow().localizationService;
	}

	public getCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		return this.service.getCardImage(cardId, options);
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		return this.service.getNonLocalizedCardImage(cardId, options);
	}
}
