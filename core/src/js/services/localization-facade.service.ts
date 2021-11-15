import { Injectable } from '@angular/core';
import { LocalizationService } from './localization.service';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class LocalizationFacadeService {
	private service: LocalizationService;

	constructor(private readonly ow: OverwolfService) {
		this.service = this.ow.getMainWindow().localizationService;
	}

	public getCardImage(
		cardId: string,
		options?: { isBgs?: boolean; isPremium?: boolean; isHighRes?: boolean },
	): string {
		return this.service.getCardImage(cardId, options);
	}
}
