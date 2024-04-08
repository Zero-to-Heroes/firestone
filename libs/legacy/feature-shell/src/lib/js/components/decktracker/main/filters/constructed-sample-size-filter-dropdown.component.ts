import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

@Component({
	selector: 'constructed-sample-size-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedSampleSizeFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;
	options: IOption[] = [50, 100, 200, 500, 1000, 2000, 4000].map((value) => ({
		value: '' + value,
		label: this.i18n.translateString('app.decktracker.filters.sample-size-filter', { value: value }),
	}));

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: ConstructedNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDecksSampleSizeFilter)),
			this.nav.currentView$$,
		]).pipe(
			filter(([filter, currentView]) => !!filter && !!currentView),
			this.mapData(([filter, currentView]) => {
				return {
					filter: '' + filter,
					options: this.options,
					placeholder: this.options.find((option) => +option.value === filter)?.label,
					visible: ['constructed-meta-decks'].includes(currentView),
				};
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, constructedMetaDecksSampleSizeFilter: +option.value };
		await this.prefs.savePreferences(newPrefs);
	}
}
