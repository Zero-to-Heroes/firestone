import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { BgsCardTierFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { arraysEqual } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-card-tier-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-card-tier-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardTierFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOption[];

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
				value: '1',
				label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: 1 }),
			} as IOption,
			{
				value: '2',
				label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: 2 }),
			} as IOption,
			{
				value: '3',
				label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: 3 }),
			} as IOption,
			{
				value: '4',
				label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: 4 }),
			} as IOption,
			{
				value: '5',
				label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: 5 }),
			} as IOption,
			{
				value: '6',
				label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: 6 }),
			} as IOption,
			{
				value: '7',
				label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: 7 }),
			} as IOption,
		];
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => '' + prefs.bgsActiveCardsTier)),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([filter, selectedCategoryId]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: selectedCategoryId === 'bgs-category-meta-cards',
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveCardsTier: parseInt(option.value) as BgsCardTierFilterType,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
