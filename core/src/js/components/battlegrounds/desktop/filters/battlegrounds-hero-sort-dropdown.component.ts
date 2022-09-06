import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsHeroSortFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsHeroSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-hero-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-hero-sort-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/sort-dropdown.component.scss`,
	],
	template: `
		<sort-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-hero-sort-dropdown"
			[attr.aria-label]="'Sort by'"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></sort-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroSortDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	options: readonly HeroSortFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
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
		] as readonly HeroSortFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.bgsActiveHeroSortFilter,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			)
			.pipe(
				filter(([filter, categoryId, currentView]) => !!filter && !!categoryId && !!currentView),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([filter, categoryId, currentView]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						categoryId === 'bgs-category-personal-heroes' &&
						!['categories', 'category'].includes(currentView),
				})),
				// FIXME
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: HeroSortFilterOption) {
		this.stateUpdater.next(new BgsHeroSortFilterSelectedEvent(option.value));
	}
}

interface HeroSortFilterOption extends IOption {
	value: BgsHeroSortFilterType;
}
