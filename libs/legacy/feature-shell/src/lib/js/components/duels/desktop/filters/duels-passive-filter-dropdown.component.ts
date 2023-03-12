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
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsPassivesFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-passives-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-passive-filter-dropdown',
	styleUrls: [`../../../../../css/component/duels/desktop/filters/duels-hero-filter-dropdown.component.scss`],
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	options: MultiselectOption[];
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

	onSelected(option: readonly string[]) {
		this.stateUpdater.next(new DuelsPassivesFilterSelectedEvent(option.filter((o) => !!o)));
	}
}
