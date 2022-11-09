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
import { filter } from 'rxjs/operators';
import { DeckRankFilterType } from '../../../../models/mainwindow/decktracker/deck-rank-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckRankFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-rank-filter-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'decktracker-rank-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
		`../../../../../css/component/decktracker/main/filters/decktracker-rank-filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			class="filter"
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
export class DecktrackerRankFilterDropdownComponent
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

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.decktracker.filters?.rank,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, currentView]) => !!filter && !!currentView),
				this.mapData(([filter, currentView]) => {
					const options = [
						{
							value: 'all',
							label: this.i18n.translateString('app.decktracker.filters.rank-filter.all'),
						} as DeckRankOption,
						{
							value: 'silver',
							label: this.i18n.translateString('app.decktracker.filters.rank-filter.silver'),
						} as DeckRankOption,
						{
							value: 'gold',
							label: this.i18n.translateString('app.decktracker.filters.rank-filter.gold'),
						} as DeckRankOption,
						{
							value: 'platinum',
							label: this.i18n.translateString('app.decktracker.filters.rank-filter.platinum'),
						} as DeckRankOption,
						{
							value: 'diamond',
							label: this.i18n.translateString('app.decktracker.filters.rank-filter.diamond'),
						} as DeckRankOption,
						{
							value: 'legend',
							label: this.i18n.translateString('app.decktracker.filters.rank-filter.legend'),
						} as DeckRankOption,
						{
							value: 'legend-500',
							label: this.i18n.translateString('app.decktracker.filters.rank-filter.legend-500'),
						} as DeckRankOption,
					] as readonly DeckRankOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: !['ladder-ranking', 'constructed-deckbuilder', 'constructed-meta-decks'].includes(
							currentView,
						),
					};
				}),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: DeckRankOption) {
		this.stateUpdater.next(new ChangeDeckRankFilterEvent(option.value));
	}
}

interface DeckRankOption extends IOption {
	value: DeckRankFilterType;
}
