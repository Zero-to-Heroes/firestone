import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DeckRankingCategoryType } from '../../../../models/mainwindow/decktracker/deck-ranking-category.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckRankCategoryFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-rank-category-filter-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-rank-category-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
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
export class DecktrackerRankCategoryDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: ConstructedNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.filter$ = combineLatest([
			this.store.listen$(([main, nav]) => main.decktracker.filters?.rankingCategory),
			this.nav.currentView$$,
		]).pipe(
			filter(([[filter], currentView]) => !!filter && !!currentView),
			this.mapData(([[filter], currentView]) => {
				const options = [
					{
						value: 'leagues',
						label: this.i18n.translateString('app.decktracker.filters.rank-category.leagues'),
					} as RankingCategoryOption,
					{
						value: 'legend',
						label: this.i18n.translateString('app.decktracker.filters.rank-category.legend'),
					} as RankingCategoryOption,
				];
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
					visible: currentView === 'ladder-ranking',
				};
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new ChangeDeckRankCategoryFilterEvent((option as RankingCategoryOption).value));
	}
}

interface RankingCategoryOption extends IOption {
	value: DeckRankingCategoryType;
}
