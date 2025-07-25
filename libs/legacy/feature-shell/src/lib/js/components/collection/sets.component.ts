import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { StatGameFormatType } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Set } from '../../models/set';
import { SetsManagerService } from '../../services/collection/sets-manager.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../services/mainwindow/store/events/generic-preferences-update-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';

@Component({
	standalone: false,
	selector: 'sets',
	styleUrls: [`../../../css/component/collection/sets.component.scss`],
	template: `
		<div class="sets">
			<div class="filters">
				<filter
					[filterOptions]="filterOptions"
					[activeFilter]="activeFilter$ | async"
					[filterChangeFunction]="filterChangeFunction"
				></filter>
				<card-search></card-search>
			</div>
			<sets-container [sets]="sets$ | async"></sets-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	activeFilter$: Observable<string>;
	sets$: Observable<readonly Set[]>;

	filterOptions: IOption[] = [
		{
			value: 'standard',
			label: this.i18n.translateString('app.collection.filters.format.standard'),
		} as IOption,
		{
			value: 'twist',
			label: this.i18n.translateString('app.collection.filters.format.twist'),
		} as IOption,
		{
			value: 'wild',
			label: this.i18n.translateString('app.collection.filters.format.wild'),
		} as IOption,
		{
			value: 'all',
			label: this.i18n.translateString('app.collection.filters.format.all'),
		} as IOption,
	];
	filterChangeFunction: (option: IOption) => MainWindowStoreEvent = (option: IOption) =>
		new GenericPreferencesUpdateEvent((prefs: Preferences) => ({
			...prefs,
			collectionSelectedFormat: option.value as StatGameFormatType,
		}));

	private allSets$: Observable<readonly Set[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly setsManager: SetsManagerService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.setsManager.isReady(), this.prefs.isReady()]);

		this.activeFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionSelectedFormat));
		this.allSets$ = this.setsManager.sets$$.pipe(
			debounceTime(1000),
			this.mapData((sets) => sets),
		);
		this.sets$ = combineLatest([this.activeFilter$, this.allSets$]).pipe(
			this.mapData(([activeFilter, allSets]) => {
				const sets =
					activeFilter === 'all'
						? allSets
						: activeFilter === 'standard'
							? allSets.filter((set) => set.standard)
							: activeFilter === 'twist'
								? allSets.filter((set) => set.twist)
								: allSets.filter((set) => !set.standard);
				return [...sets].sort(this.sortSets());
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
