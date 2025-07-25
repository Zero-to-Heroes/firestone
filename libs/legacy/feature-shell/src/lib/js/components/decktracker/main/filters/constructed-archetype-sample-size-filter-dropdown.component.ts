import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'constructed-archetype-sample-size-filter-dropdown',
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
export class ConstructedArchetypeSampleSizeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;
	options: IOption[] = [200, 500, 1000, 2000, 4000, 8000].map((value) => ({
		value: '' + value,
		label: this.i18n.translateString('app.decktracker.filters.sample-size-filter', { value: value }),
	}));

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: ConstructedNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.filter$ = combineLatest([
			this.listenForBasicPref$((prefs) => prefs.constructedMetaArchetypesSampleSizeFilter),
			this.nav.currentView$$,
		]).pipe(
			filter(([filter, currentView]) => !!filter && !!currentView),
			this.mapData(([filter, currentView]) => {
				return {
					filter: '' + filter,
					options: this.options,
					placeholder: this.options.find((option) => +option.value === filter)?.label,
					visible: ['constructed-meta-archetypes'].includes(currentView),
				};
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, constructedMetaArchetypesSampleSizeFilter: +option.value };
		await this.prefs.savePreferences(newPrefs);
	}
}
