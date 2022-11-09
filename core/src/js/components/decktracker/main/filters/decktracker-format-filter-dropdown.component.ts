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
import { filter } from 'rxjs/operators';
import { StatGameFormatType } from '../../../../models/mainwindow/stats/stat-game-format.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckFormatFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-format-filter-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'decktracker-format-filter-dropdown',
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
export class DecktrackerFormatFilterDropdownComponent
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
				([main, nav]) => main.decktracker.filters?.gameFormat,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, currentView]) => !!filter && !!currentView),
				this.mapData(([filter, currentView]) => {
					const options = [
						{
							value: 'all',
							label: this.i18n.translateString('app.decktracker.filters.format-filter.all-formats'),
						} as FormatFilterOption,
						{
							value: 'standard',
							label: this.i18n.translateString('app.decktracker.filters.format-filter.standard'),
						} as FormatFilterOption,
						{
							value: 'wild',
							label: this.i18n.translateString('app.decktracker.filters.format-filter.wild'),
						} as FormatFilterOption,
						{
							value: 'classic',
							label: this.i18n.translateString('app.decktracker.filters.format-filter.classic'),
						} as FormatFilterOption,
					] as readonly FormatFilterOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: !['deck-details', 'constructed-deckbuilder', 'constructed-meta-decks'].includes(
							currentView,
						),
					};
				}),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: FormatFilterOption) {
		this.stateUpdater.next(new ChangeDeckFormatFilterEvent(option.value));
	}
}

interface FormatFilterOption extends IOption {
	value: StatGameFormatType;
}
