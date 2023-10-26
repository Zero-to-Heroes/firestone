import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { GameStatsLoaderService } from '../../../services/stats/game/game-stats-loader.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'region-filter-dropdown',
	styleUrls: [],
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{
		filter: string;
		placeholder: string;
		options: IOption[];
		visible: boolean;
	}>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly gamesLoader: GameStatsLoaderService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.gamesLoader.isReady();

		this.filter$ = combineLatest([
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.currentView),
			this.gamesLoader.gameStats$$,
			this.store.listenPrefs$((prefs) => prefs.regionFilter),
		]).pipe(
			filter(([[currentView], stats, [filter]]) => !!currentView),
			this.mapData(([[currentView], stats, [filter]]) => {
				const allOptions = ['all'];
				const allRegions = new Set(stats?.stats?.map((stat) => stat.region).filter((region) => !!region));
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

		// Because we await
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
