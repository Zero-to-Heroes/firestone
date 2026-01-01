import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ALL_BG_RACES, Race } from '@firestone-hs/reference-data';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { BaseFilterWithUrlComponent, FilterUrlConfig, parseArrayUrlParam } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-tribes-filter-dropdown',
	styleUrls: ['./cleanup-dropdown.scss'],
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
	extends BaseFilterWithUrlComponent<readonly Race[], Preferences>
	implements AfterContentInit
{
	allTribes = ALL_BG_RACES;
	currentFilter$: Observable<readonly Race[]>;

	validationErrorTooltip: string;

	protected filterConfig: FilterUrlConfig<readonly Race[], Preferences> = {
		paramName: 'tribes',
		preferencePath: 'bgsActiveTribesFilter',
		parseUrlParam: (value: string | string[]): readonly Race[] => {
			return parseArrayUrlParam<Race>(
				value,
				(v) => {
					// Try to find the Race enum value by key (string) or by numeric value
					const raceKey = v as keyof typeof Race;
					if (raceKey in Race && typeof Race[raceKey] === 'number') {
						return Race[raceKey] as Race;
					}
					// If it's a number, try to find it in the enum values
					const numValue = parseInt(v, 10);
					if (!isNaN(numValue) && Object.values(Race).includes(numValue)) {
						return numValue as Race;
					}
					return null;
				},
				undefined,
				[],
			);
		},
	};

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly prefs: PreferencesService,
		protected override readonly route: ActivatedRoute,
		protected override readonly router: Router,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr, prefs, route, router, new Preferences());
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.validationErrorTooltip = this.i18n.translateString(
			'app.battlegrounds.filters.tribe.validation-error-tooltip',
		);

		// Initialize URL synchronization
		this.initializeUrlSync();

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveTribesFilter));

		this.cdr.markForCheck();
	}

	onSelected(tribes: readonly Race[]) {
		this.prefs.updatePrefs('bgsActiveTribesFilter', [...(tribes ?? [])].sort());
	}
}
