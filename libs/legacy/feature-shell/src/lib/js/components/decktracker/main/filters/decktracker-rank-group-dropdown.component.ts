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
import { IOption } from '@firestone/shared/common/view';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckRankGroupEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-rank-group-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

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
export class DecktrackerRankGroupDropdownComponent
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
			this.store.listen$(([main, nav]) => main.decktracker.filters?.rankingGroup),
			this.nav.currentView$$,
		]).pipe(
			filter(([[filter], currentView]) => !!filter && !!currentView),
			this.mapData(([[filter], currentView]) => {
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
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new ChangeDeckRankGroupEvent((option as RankingGroupOption).value));
	}
}

interface RankingGroupOption extends IOption {
	value: MmrGroupFilterType;
}
