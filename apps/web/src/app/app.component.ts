import { CommonModule } from '@angular/common';
import { AfterContentInit, Component } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { CardsFacadeStandaloneService } from '@firestone/shared/framework/core';
import { WebShellComponent } from '@firestone/shared/web-shell';
import { TranslateModule } from '@ngx-translate/core';

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

	constructor(private readonly allCards: CardsFacadeStandaloneService) {}

	async ngAfterContentInit() {
		await this.allCards.init(new AllCardsService(), 'enUS');
		this.ready = true;
	}
}
