import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { DeckRankingCategoryType } from '../../../../models/mainwindow/decktracker/deck-ranking-category.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckRankCategoryFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-rank-category-filter-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'decktracker-rank-category-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.decktracker.filters?.rankingCategory,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, currentView]) => !!filter && !!currentView),
				map(([filter, currentView]) => {
					const options = [
						{
							value: 'leagues',
							label: this.i18n.translateString('app.decktracker.filters.rank-category.leagues'),
						} as RankingCategoryOption,
						{
							value: 'legend',
							label: this.i18n.translateString('app.decktracker.filters.rank-category.legend'),
						} as RankingCategoryOption,
					] as readonly RankingCategoryOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: currentView === 'ladder-ranking',
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: RankingCategoryOption) {
		this.stateUpdater.next(new ChangeDeckRankCategoryFilterEvent(option.value));
	}
}

interface RankingCategoryOption extends IOption {
	value: DeckRankingCategoryType;
}
