import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { allDuelsHeroes, CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsHeroFilterType } from '../../../../models/duels/duels-hero-filter.type';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsTopDecksHeroFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-top-decks-class-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-hero-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-hero-filter-dropdown"
			[options]="options$ | async"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	options$: Observable<readonly IOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.options$ = this.store
			.listenPrefs$(
				(prefs) => prefs.duelsActiveHeroPowerFilter,
				(prefs) => prefs.duelsActiveSignatureTreasureFilter,
			)
			.pipe(
				map(([heroPowerFilter, signatureFilter]) => {
					// Only show the hero powers that are relevant with the other filters
					const result = allDuelsHeroes
						.filter((hero) =>
							heroPowerFilter === 'all'
								? true
								: duelsHeroConfigs.find((conf) => conf.heroPowers?.includes(heroPowerFilter as CardIds))
										?.hero === (hero as CardIds),
						)
						.filter((hero) =>
							signatureFilter === 'all'
								? true
								: duelsHeroConfigs.find((conf) =>
										conf.signatureTreasures?.includes(signatureFilter as CardIds),
								  )?.hero === (hero as CardIds),
						);
					console.debug('filtering heroes', allDuelsHeroes, result);
					return result;
				}),
				map((heroes) =>
					['all', ...heroes].map(
						(option) =>
							({
								value: option,
								label:
									option === 'all'
										? this.i18n.translateString('app.duels.filters.hero.all')
										: this.i18n.getCardName(option),
							} as HeroFilterOption),
					),
				),
			);
		this.filter$ = combineLatest(
			this.options$,
			this.store.listen$(
				([main, nav, prefs]) => prefs.duelsActiveHeroFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			),
		).pipe(
			filter(([options, [filter, selectedCategoryId]]) => !!filter && !!selectedCategoryId),
			map(([options, [filter, selectedCategoryId]]) => ({
				filter: filter,
				placeholder: options.find((option) => option.value === filter)?.label,
				visible: [
					'duels-stats',
					'duels-runs',
					'duels-treasures',
					'duels-personal-decks',
					'duels-top-decks',
				].includes(selectedCategoryId),
			})),
			// Don't know why this is necessary, but without it, the filter doesn't update
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: HeroFilterOption) {
		this.stateUpdater.next(new DuelsTopDecksHeroFilterSelectedEvent(option.value));
	}
}

interface HeroFilterOption extends IOption {
	value: DuelsHeroFilterType;
}
