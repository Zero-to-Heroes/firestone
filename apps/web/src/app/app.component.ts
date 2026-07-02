import { CommonModule } from '@angular/common';
import { AfterContentInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AllCardsService } from '@firestone-hs/reference-data';
import { sleep } from '@firestone/shared/framework/common';
import { CardsFacadeStandaloneService, ILocalizationService } from '@firestone/shared/framework/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	selector: 'web-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	imports: [CommonModule, RouterOutlet, TranslateModule],
})
export class AppComponent implements AfterContentInit {
	title = 'Firestone Web';

	ready = false;

	constructor(
		private readonly allCards: CardsFacadeStandaloneService,
		private readonly i18n: ILocalizationService,
	) {}

	async ngAfterContentInit() {
		await this.allCards.init(new AllCardsService(), 'enUS');
		await this.i18nReady();
		this.ready = true;
	}

	private async i18nReady() {
		while (this.i18n.translateString('app.battlegrounds.tier-list.tier') == 'app.battlegrounds.tier-list.tier') {
			await sleep(100);
		}
	}
}
