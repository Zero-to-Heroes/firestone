import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CollectionNavigationService } from '@firestone/collection/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'collection-hero-portrait-owned-filter',
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
export class CollectionHeroPortraitOwnedFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: CollectionNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		this.options = [
			{
				value: 'all',
				label: this.i18n.translateString('app.collection.filters.owned.all'),
			} as IOption,
			{
				value: 'own',
				label: this.i18n.translateString('app.collection.filters.owned.own'),
			} as IOption,
			{
				value: 'dontown',
				label: this.i18n.translateString('app.collection.filters.owned.dontown'),
			} as IOption,
		];
	}

	async ngAfterContentInit() {
		await Promise.all([this.nav.isReady(), this.prefs.isReady()]);

		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionActivePortraitOwnedFilter)),
			this.nav.currentView$$.pipe(this.mapData((currentView) => currentView)),
		]).pipe(
			filter(([filter, currentView]) => !!filter && !!currentView),
			this.mapData(([filter, currentView]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: currentView === 'hero-portraits',
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
			collectionActivePortraitOwnedFilter: option.value as any,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
