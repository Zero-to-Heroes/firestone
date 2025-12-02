import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule, TimeFilterOption } from '@firestone/battlegrounds/view';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-card-search',
	styleUrls: [],
	template: `
		<fs-text-input
			class="search"
			[placeholder]="'app.battlegrounds.tier-list.card-search-placeholder' | fsTranslate"
			[debounceTime]="100"
			(fsModelUpdate)="onCardSearchStringUpdated($event)"
		>
		</fs-text-input>
	`,
	imports: [CommonModule, SharedCommonViewModule, SharedFrameworkCoreModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBattlegroundsCardSearchComponent {
	constructor(private readonly prefs: PreferencesService) {}

	async onCardSearchStringUpdated(value: string) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveCardsSearch: value,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
