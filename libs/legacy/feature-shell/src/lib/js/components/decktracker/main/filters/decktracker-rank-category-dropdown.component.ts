import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { DeckRankingCategoryType, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckRankCategoryFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-rank-category-filter-event';

@Component({
	standalone: false,
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: ConstructedNavigationService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.mainWindowStateFacade);

		this.filter$ = combineLatest([
			this.mainWindowStateFacade.mainWindowState$$.pipe(
				this.mapData((state) => state.decktracker.filters.rankingCategory),
			),
			this.nav.currentView$$,
		]).pipe(
			filter(([filter, currentView]) => !!filter && !!currentView),
			this.mapData(([filter, currentView]) => {
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
			this.cdr.markForCheck();
		}
	}

	onSelected(option: IOption) {
		this.mainWindowStateFacade.send(new ChangeDeckRankCategoryFilterEvent((option as RankingCategoryOption).value));
	}
}

interface RankingCategoryOption extends IOption {
	value: DeckRankingCategoryType;
}
