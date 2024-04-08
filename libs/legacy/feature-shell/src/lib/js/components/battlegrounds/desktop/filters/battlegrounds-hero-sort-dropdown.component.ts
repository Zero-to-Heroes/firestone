import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { BgsHeroSortFilterType } from '@firestone/battlegrounds/view';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsHeroSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-hero-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-hero-sort-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-hero-sort-dropdown"
			[attr.aria-label]="'Sort by'"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroSortDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	options: HeroSortFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.options = [
			{
				value: 'tier',
				label: this.i18n.translateString('app.battlegrounds.filters.hero-sort.tier'),
			} as HeroSortFilterOption,
			{
				value: 'average-position',
				label: this.i18n.translateString('app.battlegrounds.filters.hero-sort.average-position'),
			} as HeroSortFilterOption,
			{
				value: 'mmr',
				label: this.i18n.translateString('app.battlegrounds.filters.hero-sort.mmr'),
			} as HeroSortFilterOption,
			{
				value: 'games-played',
				label: this.i18n.translateString('app.battlegrounds.filters.hero-sort.games-played'),
			} as HeroSortFilterOption,
			{
				value: 'last-played',
				label: this.i18n.translateString('app.battlegrounds.filters.hero-sort.last-played'),
			} as HeroSortFilterOption,
		];
		this.filter$ = combineLatest([
			this.store.listen$(
				([main, nav, prefs]) => prefs.bgsActiveHeroSortFilter,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([[filter, currentView], categoryId]) => !!filter && !!categoryId && !!currentView),
			this.mapData(([[filter, currentView], categoryId]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible:
					(categoryId === 'bgs-category-personal-heroes' ||
						categoryId === 'bgs-category-meta-heroes' ||
						categoryId === 'bgs-category-personal-quests') &&
					!['categories', 'category'].includes(currentView),
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new BgsHeroSortFilterSelectedEvent((option as HeroSortFilterOption).value));
	}
}

interface HeroSortFilterOption extends IOption {
	value: BgsHeroSortFilterType;
}
