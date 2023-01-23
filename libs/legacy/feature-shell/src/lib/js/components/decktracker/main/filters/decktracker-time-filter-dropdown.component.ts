import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { DeckTimeFilterType } from '@models/mainwindow/decktracker/deck-time-filter.type';
import { ChangeDeckTimeFilterEvent } from '@services/mainwindow/store/events/decktracker/change-deck-time-filter-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { formatPatch } from '@services/utils';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-time-filter-dropdown',
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
export class DecktrackerTimeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

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
				([main, nav]) => main.decktracker.filters?.time,
				([main, nav]) => main.decktracker.patch,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, patch, currentView]) => !!filter && !!patch && !!currentView),
				this.mapData(([filter, patch, currentView]) => {
					const options = [
						{
							value: 'all-time',
							label: this.i18n.translateString('app.decktracker.filters.time-filter.all-time'),
						} as TimeFilterOption,
						{
							value: 'season-start',
							label: this.i18n.translateString('app.decktracker.filters.time-filter.season-start'),
						} as TimeFilterOption,
						{
							value: 'last-patch',
							label: this.i18n.translateString('app.decktracker.filters.time-filter.last-patch'),
							tooltip: formatPatch(patch, this.i18n),
						} as TimeFilterOption,
						{
							value: 'past-30',
							label: this.i18n.translateString('app.decktracker.filters.time-filter.past-30'),
						} as TimeFilterOption,
						{
							value: 'past-7',
							label: this.i18n.translateString('app.decktracker.filters.time-filter.past-7'),
						} as TimeFilterOption,
						{
							value: 'past-1',
							label: this.i18n.translateString('app.decktracker.filters.time-filter.past-1'),
						} as TimeFilterOption,
					];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: !['constructed-deckbuilder', 'constructed-meta-decks'].includes(currentView),
					};
				}),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new ChangeDeckTimeFilterEvent((option as TimeFilterOption).value));
	}
}

interface TimeFilterOption extends IOption {
	value: DeckTimeFilterType;
}
