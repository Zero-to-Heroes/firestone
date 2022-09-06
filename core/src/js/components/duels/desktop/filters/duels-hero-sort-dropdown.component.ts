import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsHeroSortFilterType } from '../../../../models/duels/duels-hero-sort-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsHeroSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-hero-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-hero-sort-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/sort-dropdown.component.scss`,
	],
	template: `
		<sort-dropdown
			*ngIf="filter$ | async as value"
			class="duels-hero-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></sort-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroSortDropdownComponent
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
				value: 'player-winrate',
				label: this.i18n.translateString('app.duels.filters.hero-sort.player-winrate'),
			} as HeroSortFilterOption,
			{
				value: 'global-winrate',
				label: this.i18n.translateString('app.duels.filters.hero-sort.global-winrate'),
			} as HeroSortFilterOption,
			{
				value: 'games-played',
				label: this.i18n.translateString('app.duels.filters.hero-sort.games-played'),
			} as HeroSortFilterOption,
		] as readonly HeroSortFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsActiveHeroSortFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['duels-treasures', 'duels-stats'].includes(selectedCategoryId),
				})),
				// Don't know why this is necessary, but without it, the filter doesn't update
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: HeroSortFilterOption) {
		this.stateUpdater.next(new DuelsHeroSortFilterSelectedEvent(option.value));
	}
}

interface HeroSortFilterOption extends IOption {
	value: DuelsHeroSortFilterType;
}
