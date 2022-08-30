import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { MultiselectOption } from '@components/filter-dropdown-multiselect.component';
import { allDuelsPassiveTreasures } from '@firestone-hs/reference-data';
import { DuelsHeroFilterType } from '@models/duels/duels-hero-filter.type';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsPassivesFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-passives-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-passive-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
		`../../../../../css/component/duels/desktop/filters/duels-hero-filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="duels-hero-filter-dropdown"
			[options]="options"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPassiveFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	options: readonly MultiselectOption[];
	filter$: Observable<{ selected: readonly string[]; placeholder: string; visible: boolean }>;

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
		this.options = allDuelsPassiveTreasures
			.map((value) => {
				return {
					value: value,
					label: this.i18n.getCardName(value),
					image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg`,
				};
			})
			.sort((a, b) => (a.label < b.label ? -1 : 1));
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsActivePassiveTreasuresFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!selectedCategoryId),
				this.mapData(([filter, selectedCategoryId]) => ({
					selected: filter ?? allDuelsPassiveTreasures,
					placeholder: this.i18n.translateString('app.duels.filters.passive-treasures.all'),
					visible: [
						// 'duels-stats',
						// 'duels-runs',
						// 'duels-treasures',
						// 'duels-personal-decks',
						'duels-top-decks',
					].includes(selectedCategoryId),
				})),
			) as any;
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: DuelsHeroFilterType) {
		console.debug('selecting', option);
		this.stateUpdater.next(new DuelsPassivesFilterSelectedEvent(option.filter((o) => !!o)));
	}
}
