import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArenaClassStatsService, ArenaCommonModule } from '@firestone/arena/common';
import {
	ArenaCardClassFilterType,
	ArenaCardTypeFilterType,
	ArenaClassFilterType,
	ArenaModeFilterType,
	ArenaTimeFilterType,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { filter, take, tap } from 'rxjs';
import { WebArenaFiltersComponent } from '../filters/_web-arena-filters.component';
import { WebArenaModeFilterDropdownComponent } from '../filters/web-arena-mode-filter-dropdown.component';
import { WebArenaTimeFilterDropdownComponent } from '../filters/web-arena-time-filter-dropdown.component';

@Component({
	standalone: true,
	selector: 'arena-cards',
	templateUrl: './arena-cards.component.html',
	styleUrls: ['./arena-cards.component.scss'],
	imports: [
		CommonModule,

		ArenaCommonModule,

		WebArenaFiltersComponent,
		WebArenaModeFilterDropdownComponent,
		WebArenaTimeFilterDropdownComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.arenaClassStats);
		console.debug('[arena-classes] after content init', this.prefs);

		// Initialize filters from URL parameters
		this.initializeFromUrlParams();

		// Set up URL parameter synchronization
		this.setupUrlParamSync();

		this.arenaClassStats.classStats$$
			.pipe(
				tap((stats) => console.debug('[arena-classes] class stats 0', stats)),
				filter((stats) => !!stats?.stats),
				this.mapData((stats) => {
					console.debug('[arena-classes] class stats', stats);
				}),
			)
			.subscribe();

		this.cdr.detectChanges();
	}

	private initializeFromUrlParams(): void {
		// Get initial URL parameters and update preferences
		this.route.queryParams.pipe(take(1)).subscribe(async (params) => {
			console.debug('[arena-cards] initializing from URL params', params);

			// Handle arenaActiveMode parameter
			if (params['arenaActiveMode']) {
				const mode = params['arenaActiveMode'] as ArenaModeFilterType;
				if (mode === 'arena' || mode === 'arena-underground') {
					await this.prefs.updatePrefs('arenaActiveMode', mode);
					console.debug('[arena-cards] updated arenaActiveMode from URL', mode);
				}
			}

			// Handle arenaActiveTimeFilter parameter
			if (params['arenaActiveTimeFilter']) {
				const timeFilter = params['arenaActiveTimeFilter'] as ArenaTimeFilterType;
				const validTimeFilters: ArenaTimeFilterType[] = [
					'last-patch',
					'current-season',
					'past-seven',
					'past-three',
				];
				if (validTimeFilters.includes(timeFilter)) {
					await this.prefs.updatePrefs('arenaActiveTimeFilter', timeFilter);
					console.debug('[arena-cards] updated arenaActiveTimeFilter from URL', timeFilter);
				}
			}

			// Handle arenaActiveClassFilter parameter
			if (params['arenaActiveClassFilter']) {
				const classFilter = params['arenaActiveClassFilter'] as ArenaClassFilterType;
				await this.prefs.updatePrefs('arenaActiveClassFilter', classFilter);
				console.debug('[arena-cards] updated arenaActiveClassFilter from URL', classFilter);
			}

			// Handle arenaActiveCardClassFilter parameter
			if (params['arenaActiveCardClassFilter']) {
				const cardClassFilter = params['arenaActiveCardClassFilter'] as ArenaCardClassFilterType;
				const validCardClassFilters: ArenaCardClassFilterType[] = ['all', 'neutral', 'no-neutral'];
				if (validCardClassFilters.includes(cardClassFilter)) {
					await this.prefs.updatePrefs('arenaActiveCardClassFilter', cardClassFilter);
					console.debug('[arena-cards] updated arenaActiveCardClassFilter from URL', cardClassFilter);
				}
			}

			// Handle arenaActiveCardTypeFilter parameter
			if (params['arenaActiveCardTypeFilter']) {
				const cardTypeFilter = params['arenaActiveCardTypeFilter'] as ArenaCardTypeFilterType;
				const validCardTypeFilters: ArenaCardTypeFilterType[] = ['all', 'legendary', 'treasure', 'other'];
				if (validCardTypeFilters.includes(cardTypeFilter)) {
					await this.prefs.updatePrefs('arenaActiveCardTypeFilter', cardTypeFilter);
					console.debug('[arena-cards] updated arenaActiveCardTypeFilter from URL', cardTypeFilter);
				}
			}
		});
	}

	private setupUrlParamSync(): void {
		// Watch for preference changes and update URL
		this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => ({
					arenaActiveMode: prefs.arenaActiveMode,
					arenaActiveTimeFilter: prefs.arenaActiveTimeFilter,
					arenaActiveClassFilter: prefs.arenaActiveClassFilter,
					arenaActiveCardClassFilter: prefs.arenaActiveCardClassFilter,
					arenaActiveCardTypeFilter: prefs.arenaActiveCardTypeFilter,
				})),
			)
			.subscribe((filters) => {
				this.updateUrlParams(filters);
			});
	}

	private updateUrlParams(filters: {
		arenaActiveMode: ArenaModeFilterType;
		arenaActiveTimeFilter: ArenaTimeFilterType;
		arenaActiveClassFilter: ArenaClassFilterType;
		arenaActiveCardClassFilter: ArenaCardClassFilterType;
		arenaActiveCardTypeFilter: ArenaCardTypeFilterType;
	}): void {
		const queryParams: any = {};

		const defaultValues = new Preferences();

		// Add parameters that are not default values, or explicitly set to null to remove them
		if (filters.arenaActiveMode && filters.arenaActiveMode !== defaultValues.arenaActiveMode) {
			queryParams.arenaActiveMode = filters.arenaActiveMode;
		} else {
			queryParams.arenaActiveMode = null;
		}

		if (filters.arenaActiveTimeFilter && filters.arenaActiveTimeFilter !== defaultValues.arenaActiveTimeFilter) {
			queryParams.arenaActiveTimeFilter = filters.arenaActiveTimeFilter;
		} else {
			queryParams.arenaActiveTimeFilter = null;
		}

		if (filters.arenaActiveClassFilter && filters.arenaActiveClassFilter !== defaultValues.arenaActiveClassFilter) {
			queryParams.arenaActiveClassFilter = filters.arenaActiveClassFilter;
		} else {
			queryParams.arenaActiveClassFilter = null;
		}

		if (
			filters.arenaActiveCardClassFilter &&
			filters.arenaActiveCardClassFilter !== defaultValues.arenaActiveCardClassFilter
		) {
			queryParams.arenaActiveCardClassFilter = filters.arenaActiveCardClassFilter;
		} else {
			queryParams.arenaActiveCardClassFilter = null;
		}

		if (
			filters.arenaActiveCardTypeFilter &&
			filters.arenaActiveCardTypeFilter !== defaultValues.arenaActiveCardTypeFilter
		) {
			queryParams.arenaActiveCardTypeFilter = filters.arenaActiveCardTypeFilter;
		} else {
			queryParams.arenaActiveCardTypeFilter = null;
		}

		// Update URL without triggering navigation
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams,
			queryParamsHandling: 'merge',
			replaceUrl: true,
		});

		console.debug('[arena-cards] updated URL params', queryParams);
	}
}
