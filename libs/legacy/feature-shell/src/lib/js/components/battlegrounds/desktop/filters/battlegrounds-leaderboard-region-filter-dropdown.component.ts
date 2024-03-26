import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
@Component({
	selector: 'battlegrounds-leaderboard-region-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			class="filter"
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsLeaderboardRegionFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	filter$: Observable<{
		filter: string;
		placeholder: string;
		options: IOption[];
		visible: boolean;
	}>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly store: AppUiStoreFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		this.filter$ = combineLatest([
			this.store.listen$(([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId),
			this.prefs.preferences$((prefs) => prefs.bgsLeaderboardRegionFilter),
		]).pipe(
			filter(([[selectedCategoryId], [filter]]) => !!selectedCategoryId),
			this.mapData(([[selectedCategoryId], [filter]]) => {
				const allRegions = ['EU', 'US', 'AP'];
				const options: FilterOption[] = allRegions.map(
					(option) =>
						({
							value: option,
							label: this.i18n.translateString(`global.region.${option.toLowerCase()}`) || option,
						} as FilterOption),
				);
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
					visible: ['bgs-category-leaderboard'].includes(selectedCategoryId),
				};
			}),
		);

		// Because we await
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: FilterOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsLeaderboardRegionFilter: option?.value as 'EU' | 'US' | 'AP',
		};
		await this.prefs.savePreferences(newPrefs);
	}
}

interface FilterOption extends IOption {
	value: string;
}
