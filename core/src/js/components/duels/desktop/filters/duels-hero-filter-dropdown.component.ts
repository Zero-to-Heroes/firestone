import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { MultiselectOption } from '@components/filter-dropdown-multiselect.component';
import { allDuelsHeroes } from '@firestone-hs/reference-data';
import { DuelsHeroFilterType } from '@models/duels/duels-hero-filter.type';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
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
export class DuelsHeroFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
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
		console.log('oigrejogi');
		this.options = allDuelsHeroes.map((value) => {
			return {
				value: value,
				label: this.i18n.getCardName(value),
				image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg`,
			};
		});
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!selectedCategoryId),
				this.mapData(([filter, selectedCategoryId]) => ({
					selected: filter ?? allDuelsHeroes,
					placeholder: this.i18n.translateString('app.duels.filters.hero.all'),
					visible: [
						'duels-stats',
						'duels-runs',
						'duels-treasures',
						'duels-personal-decks',
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
		this.stateUpdater.next(new DuelsTopDecksHeroFilterSelectedEvent(option));
	}
}
