import { Injectable } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Injectable()
export class TipService {
	private numberOfTips = 11;
	private previousIndex = -1;
	private excludedTips = [7];

	constructor(private readonly i18n: LocalizationFacadeService) {}

	public getRandomTip(): string {
		let randomIndex = this.previousIndex;
		while (randomIndex === this.previousIndex || this.excludedTips.includes(randomIndex)) {
			randomIndex = Math.floor(Math.random() * this.numberOfTips);
		}
		this.previousIndex = randomIndex;
		const result = this.i18n.translateString(`app.tips.tip-${randomIndex}`);
		return result;
	}
}
