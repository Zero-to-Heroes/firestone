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
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { GameStatsLoaderService } from '../../../services/stats/game/game-stats-loader.service';

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
	extends AbstractSubscriptionComponent
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly gamesLoader: GameStatsLoaderService,
		private readonly nav: ConstructedNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.gamesLoader, this.prefs);

		this.filter$ = combineLatest([
			this.gamesLoader.gameStats$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.regionFilter)),
		]).pipe(
			this.mapData(([stats, filter]) => {
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
