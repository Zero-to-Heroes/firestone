import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { BgsSimulatorMinionTribeFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-simulator-minion-tribe-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { capitalizeFirstLetter } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'bgs-sim-minion-tribe-filter',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="bgs-sim-minion-tribe-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorMinionTribeFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit {
	options: readonly IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private collator = new Intl.Collator('en-US');

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreFacadeService,
	) {
		super();
		const battlegroundsCards = this.allCards.getCards().filter((card) => !!card.techLevel);
		const uniqueTribes = [...new Set(battlegroundsCards.map((card) => card.race?.toLowerCase()))].filter(
			(race) => !!race && race !== 'all',
		);
		this.options = [
			{
				value: 'all',
				label: 'All tribes',
			} as IOption,
			...uniqueTribes
				.map(
					(tribe) =>
						({
							label: capitalizeFirstLetter(tribe),
							value: tribe,
						} as IOption),
				)
				.sort((a, b) => this.collator.compare(a.label, b.label)),
			{
				value: 'blank',
				label: 'No tribe',
			} as IOption,
		] as readonly IOption[];
		this.filter$ = this.store
			.listen$(([main, nav, prefs]) => prefs.bgsActiveSimulatorMinionTribeFilter)
			.pipe(
				filter(([filter]) => !!filter),
				map(([filter]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: true,
				})),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new BgsSimulatorMinionTribeFilterSelectedEvent(option.value));
	}
}
