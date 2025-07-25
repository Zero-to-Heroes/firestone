import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { BgsTrinketActiveTabType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { arraysEqual } from '../../../../services/utils';

@Component({
	standalone: false,
	selector: 'battlegrounds-trinket-type-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-trinket-type-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTrinketTypeFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: TrinketTypeFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.options = [
			{
				value: 'lesser',
				label: this.i18n.translateString('app.battlegrounds.filters.trinket-type.lesser'),
			} as TrinketTypeFilterOption,
			{
				value: 'greater',
				label: this.i18n.translateString('app.battlegrounds.filters.trinket-type.greater'),
			} as TrinketTypeFilterOption,
		];
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsTrinketsActiveTab)),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([filter, selectedCategoryId]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: selectedCategoryId === 'bgs-category-meta-trinkets',
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: /* TrinketTypeFilterOption*/ IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsTrinketsActiveTab: option.value as BgsTrinketActiveTabType,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}

interface TrinketTypeFilterOption extends IOption {
	value: BgsTrinketActiveTabType;
}
