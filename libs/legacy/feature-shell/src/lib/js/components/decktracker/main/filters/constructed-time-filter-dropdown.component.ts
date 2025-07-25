import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { TimePeriod } from '@firestone-hs/constructed-deck-stats';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { formatPatch } from '@legacy-import/src/lib/js/services/utils';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../../services/mainwindow/store/events/generic-preferences-update-event';

@Component({
	standalone: false,
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly nav: ConstructedNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.nav, this.prefs);

		this.filter$ = combineLatest([
			this.patchesConfig.currentConstructedMetaPatch$$,
			this.patchesConfig.currentTwistMetaPatch$$,
			this.nav.currentView$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					formatFilter: prefs.constructedMetaDecksFormatFilter,
					timeFilter: prefs.constructedMetaDecksTimeFilter,
				})),
				distinctUntilChanged((a, b) => a.formatFilter === b.formatFilter && a.timeFilter === b.timeFilter),
			),
		]).pipe(
			filter(([constructedPatch, twistPatch, currentView, { formatFilter, timeFilter }]) => !!currentView),
			map(([constructedPatch, twistPatch, currentView, { formatFilter, timeFilter }]) => ({
				patch: formatFilter === 'twist' ? twistPatch : constructedPatch,
				currentView: currentView,
				filter: timeFilter,
			})),
			this.mapData(({ patch, currentView, filter }) => {
				const options: FilterOption[] = ['current-season', 'past-20', 'past-7', 'past-3', 'last-patch'].map(
					(option) =>
						({
							value: option,
							label:
								option === 'last-patch'
									? this.i18n.translateString('app.global.filters.time-patch', {
											value: patch.version,
										})
									: this.i18n.translateString(`app.decktracker.filters.time-filter.${option}`),
							tooltip: option === 'last-patch' ? formatPatch(patch, this.i18n) : undefined,
							// label: this.i18n.translateString(`app.decktracker.filters.time-filter.${option}`),
							// tooltip: option === 'last-patch' ? formatPatch(patch, this.i18n) : undefined,
						}) as FilterOption,
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
