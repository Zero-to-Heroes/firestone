import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ALL_BG_RACES, Race } from '@firestone-hs/reference-data';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-tribes-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-tribes-filter-dropdown-view
			class="battlegrounds-tribes-filter-dropdown"
			[allTribes]="allTribes"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			[validationErrorTooltip]="validationErrorTooltip"
			(valueSelected)="onSelected($event)"
		></battlegrounds-tribes-filter-dropdown-view>
	`,
	imports: [CommonModule, BattlegroundsViewModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBattlegroundsTribesFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	allTribes = ALL_BG_RACES;
	currentFilter$: Observable<readonly Race[]>;

	validationErrorTooltip: string;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.validationErrorTooltip = this.i18n.translateString(
			'app.battlegrounds.filters.tribe.validation-error-tooltip',
		);

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveTribesFilter));

		this.cdr.detectChanges();
	}

	onSelected(tribes: readonly Race[]) {
		this.prefs.updatePrefs('bgsActiveTribesFilter', [...(tribes ?? [])].sort());
	}
}
