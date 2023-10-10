import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-dust-filter-dropdown',
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
export class ConstructedDustFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	options: DustFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.options = [
			{
				value: 'all',
				label: this.i18n.translateString('app.duels.filters.dust.all'),
			} as DustFilterOption,
			{
				value: '0',
				label: this.i18n.translateString('app.duels.filters.dust.own'),
			} as DustFilterOption,
			{
				value: '400',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 400 }),
			} as DustFilterOption,
			{
				value: '1600',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 1600 }),
			} as DustFilterOption,
			{
				value: '3200',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 3200 }),
			} as DustFilterOption,
		];
		this.filter$ = combineLatest([
			this.listenForBasicPref$((prefs) => prefs.constructedMetaDecksDustFilter ?? 'all'),
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.currentView),
		]).pipe(
			this.mapData(([filter, [currentView]]) => {
				console.debug('dust filter', filter, this.options);
				return {
					filter: '' + filter,
					placeholder: this.options.find((option) => option.value === '' + filter)?.label,
					visible: ['constructed-meta-decks', 'constructed-meta-deck-details'].includes(currentView),
				};
			}),
		);
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			constructedMetaDecksDustFilter: option.value === 'all' ? 'all' : +option.value,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}

interface DustFilterOption extends IOption {
	value: string /*ConstructedMetaDecksDustFilterType*/;
}
