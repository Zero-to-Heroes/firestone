import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'region-filter-dropdown',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
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
export class RegionFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	filter$: Observable<{
		filter: string;
		placeholder: string;
		options: IOption[];
		visible: boolean;
	}>;

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
		this.filter$ = combineLatest(
			this.store.listen$(
				([main, nav]) => nav.navigationDecktracker.currentView,
				// Here we really want to use all the stats, not the gameStats$ observable
				([main, nav]) => main.stats?.gameStats?.stats,
			),
			this.store.listenPrefs$((prefs) => prefs.regionFilter),
		).pipe(
			filter(([[currentView, stats], [filter]]) => !!currentView),
			this.mapData(([[currentView, stats], [filter]]) => {
				const allOptions = ['all'];
				const allRegions = new Set(stats.map((stat) => stat.region).filter((region) => !!region));
				console.debug('allRegions', allRegions, stats);
				// Don't show the filter when only one region
				if (allRegions.size === 1) {
					return null;
				}
				for (const region of allRegions) {
					allOptions.push(BnetRegion[region].toLowerCase());
				}
				const options: FilterOption[] = allOptions.map(
					(option) =>
						({
							value: option,
							label: this.i18n.translateString(`global.region.${option}`) || option,
						} as FilterOption),
				);
				console.debug('placeholder', options.find((option) => option.value === filter)?.label, options, filter);
				return {
					filter: filter == 'all' ? 'all' : BnetRegion[filter].toLowerCase(),
					options: options,
					placeholder: options.find((option) =>
						option.value === 'all' ? filter === 'all' : option.value === BnetRegion[filter].toLowerCase(),
					)?.label,
					// visible: ['constructed-meta-decks'].includes(currentView),
					// TODO: only show it if there are multiple regions. And if only one region, make sure it is set to
					// 'all' (in case it is set to another region)
					visible: true,
				};
			}),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: FilterOption) {
		this.stateUpdater.next(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				regionFilter: !option?.value || option.value === 'all' ? 'all' : BnetRegion[option.value.toUpperCase()],
			})),
		);
	}
}

interface FilterOption extends IOption {
	value: string;
}
