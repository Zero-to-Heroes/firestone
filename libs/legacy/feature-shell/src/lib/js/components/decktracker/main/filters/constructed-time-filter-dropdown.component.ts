import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { TimePeriod } from '@firestone-hs/constructed-deck-stats';
import { OverwolfService } from '@firestone/shared/framework/core';
import { formatPatch } from '@legacy-import/src/lib/js/services/utils';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-time-filter-dropdown',
	styleUrls: [
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
export class ConstructedTimeFilterDropdownComponent
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
		this.filter$ = combineLatest([
			this.store.listen$(([main, nav]) => main.decktracker.patch),
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.currentView),
			this.store.listenPrefs$((prefs) => prefs.constructedMetaDecksTimeFilter),
		]).pipe(
			filter(([[patch], [currentView], [filter]]) => !!currentView),
			this.mapData(([[patch], [currentView], [filter]]) => {
				const options: FilterOption[] = ['current-season', 'past-30', 'past-7', 'past-3', 'last-patch'].map(
					(option) =>
						({
							value: option,
							label: this.i18n.translateString(`app.decktracker.filters.time-filter.${option}`),
							tooltip: option === 'last-patch' ? formatPatch(patch, this.i18n) : undefined,
						} as FilterOption),
				);
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
					visible: [
						'constructed-meta-decks',
						'constructed-meta-deck-details',
						'constructed-meta-archetypes',
						'constructed-meta-archetype-details',
					].includes(currentView),
				};
			}),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				constructedMetaDecksTimeFilter: (option as FilterOption).value,
			})),
		);
	}
}

interface FilterOption extends IOption {
	value: TimePeriod;
	tooltip?: string;
}
