import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { MmrGroupFilterType } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckRankGroupEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
	selector: 'decktracker-rank-group-dropdown',
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
export class DecktrackerRankGroupDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
				this.mapData((state) => state.decktracker.filters.rankingGroup),
			),
			this.nav.currentView$$,
		]).pipe(
			filter(([filter, currentView]) => !!filter && !!currentView),
			this.mapData(([filter, currentView]) => {
				const options = [
					{
						value: 'per-match',
						label: this.i18n.translateString('app.decktracker.filters.rank-group.per-match'),
					} as RankingGroupOption,
					{
						value: 'per-day',
						label: this.i18n.translateString('app.decktracker.filters.rank-group.per-day'),
						tooltip: this.i18n.translateString('app.decktracker.filters.rank-group.per-day-tooltip'),
					} as RankingGroupOption,
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
		this.mainWindowStateFacade.send(new ChangeDeckRankGroupEvent((option as RankingGroupOption).value));
	}
}

interface RankingGroupOption extends IOption {
	value: MmrGroupFilterType;
}
