import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { BgsSimulatorMinionTierFilterSelectedEvent } from '../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-simulator-minion-tier-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'bgs-sim-minion-tier-filter',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="bgs-sim-minion-tier-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorMinionTierFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit {
	options: readonly IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private collator = new Intl.Collator('en-US');

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		super();
		const tiers = [1, 2, 3, 4, 5, 6];
		this.options = [
			{
				value: 'all',
				label: 'All tiers',
			} as IOption,
			...tiers.map((tier) => ({
				value: `${tier}`,
				label: `Tier ${tier}`,
			})),
		] as readonly IOption[];
		this.filter$ = this.store
			.listen$(([main, nav, prefs]) => prefs.bgsActiveSimulatorMinionTierFilter)
			.pipe(
				filter(([filter]) => !!filter),
				distinctUntilChanged(),
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
		this.stateUpdater.next(new BgsSimulatorMinionTierFilterSelectedEvent(option.value as any));
	}
}
