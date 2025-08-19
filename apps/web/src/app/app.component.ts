import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, Injector } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { sleep } from '@firestone/shared/framework/common';
import { CardsFacadeStandaloneService, ILocalizationService, setAppInjector } from '@firestone/shared/framework/core';
import { WebShellComponent } from '@firestone/shared/web-shell';
import { TranslateModule } from '@ngx-translate/core';
import { AnalyticsService } from '../../../../libs/shared/framework/core/src';

@Component({
	standalone: true,
	selector: 'web-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	imports: [CommonModule, WebShellComponent, TranslateModule],
})
export class AppComponent implements AfterContentInit {
	title = 'Firestone Web';

	ready = false;

	constructor(
		private readonly allCards: CardsFacadeStandaloneService,
		private readonly injector: Injector,
		private readonly i18n: ILocalizationService,
		private readonly analytics: AnalyticsService,
	) {
		setAppInjector(injector);
	}

	async ngAfterContentInit() {
		await this.allCards.init(new AllCardsService(), 'enUS');
		await this.i18nReady();
		this.ready = true;
	}

	private async i18nReady() {
		while (this.i18n.translateString('app.battlegrounds.tier-list.tier') == 'app.battlegrounds.tier-list.tier') {
			await sleep(100);
			console.debug('[debug] waiting for i18n');
		}
	}
}
