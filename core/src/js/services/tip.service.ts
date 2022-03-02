import { Injectable } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Injectable()
export class TipService {
	private numberOfTips = 10;
	private previousIndex = -1;

	constructor(private readonly i18n: LocalizationFacadeService) {}

	public getRandomTip(): string {
		let randomIndex = this.previousIndex;
		while (randomIndex === this.previousIndex) {
			randomIndex = Math.floor(Math.random() * this.numberOfTips);
		}
		this.previousIndex = randomIndex;
		const result = this.i18n.translateString(`app.tips.tip-${randomIndex + 1}`);
		// console.debug('returning random tip', randomIndex, result);
		return result;
	}
}
