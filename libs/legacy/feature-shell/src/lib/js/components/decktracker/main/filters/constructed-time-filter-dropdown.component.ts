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
import { PatchesConfigService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
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
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly nav: ConstructedNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.nav);

		this.filter$ = combineLatest([
			this.patchesConfig.currentConstructedMetaPatch$$,
			this.nav.currentView$$,
			this.store.listenPrefs$((prefs) => prefs.constructedMetaDecksTimeFilter),
		]).pipe(
			filter(([patch, currentView, [filter]]) => !!currentView),
			this.mapData(([patch, currentView, [filter]]) => {
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
