import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { StatGameFormatType } from '../../models/mainwindow/stats/stat-game-format.type';
import { Preferences } from '../../models/preferences';
import { Set } from '../../models/set';
import { GenericPreferencesUpdateEvent } from '../../services/mainwindow/store/events/generic-preferences-update-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'sets',
	styleUrls: [`../../../css/component/collection/sets.component.scss`],
	template: `
		<div class="sets">
			<filter
				[filterOptions]="filterOptions"
				[activeFilter]="activeFilter$ | async"
				[filterChangeFunction]="filterChangeFunction"
			></filter>
			<sets-container [sets]="sets$ | async"></sets-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetsComponent extends AbstractSubscriptionComponent {
	activeFilter$: Observable<string>;
	sets$: Observable<readonly Set[]>;

	filterOptions: readonly IOption[] = [
		{
			label: 'Standard',
			value: 'standard',
		} as IOption,
		{
			label: 'Wild',
			value: 'wild',
		} as IOption,
		{
			label: 'All',
			value: 'all',
		} as IOption,
	];
	filterChangeFunction: (option: IOption) => MainWindowStoreEvent = (option: IOption) =>
		new GenericPreferencesUpdateEvent((prefs: Preferences) => ({
			...prefs,
			collectionSelectedFormat: option.value as StatGameFormatType,
		}));

	private allSets$: Observable<readonly Set[]>;

	constructor(private readonly store: AppUiStoreFacadeService, private readonly cdr: ChangeDetectorRef) {
		super();
		this.activeFilter$ = this.store
			.listen$(([main, nav, prefs]) => prefs.collectionSelectedFormat)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting activeFilter in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.allSets$ = this.store
			// TOOD: the allSets are fully recomputed whenever a new card is received, so this might cause a bit too many refreshes
			.listen$(([main, nav, prefs]) => main.binder.allSets)
			.pipe(
				debounceTime(1000),
				map(([pref]) => pref),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting allSets in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.sets$ = combineLatest(this.activeFilter$, this.allSets$).pipe(
			map(([activeFilter, allSets]) => {
				const sets =
					activeFilter === 'all'
						? allSets
						: activeFilter === 'standard'
						? allSets.filter((set) => set.standard)
						: allSets.filter((set) => !set.standard);
				return [...sets].sort(this.sortSets());
			}),
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			tap((info) => cdLog('emitting sets in ', this.constructor.name, info)),
			takeUntil(this.destroyed$),
		);
	}

	private sortSets(): (a: Set, b: Set) => number {
		return (a: Set, b: Set) => {
			if (a.id === 'core' || a.id === 'legacy') {
				return 1;
			}
			if (b.id === 'core' || a.id === 'legacy') {
				return -1;
			}
			if (!a.launchDate) {
				return -1;
			}
			if (!b.launchDate) {
				return 1;
			}
			return b.launchDate.getTime() - a.launchDate.getTime();
		};
	}
}
