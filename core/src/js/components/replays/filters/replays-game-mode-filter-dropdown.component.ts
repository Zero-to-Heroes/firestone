import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'replays-game-mode-filter-dropdown',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysGameModeFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options: readonly IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
		this.options = [
			{
				value: null,
				label: 'All game modes',
			} as IOption,
			{
				value: 'battlegrounds',
				label: 'Battlegrounds',
			} as IOption,
			{
				value: 'mercenaries-all',
				label: 'Mercenaries (All)',
			} as IOption,
			{
				value: 'mercenaries-pve',
				label: 'Mercenaries PvE',
			} as IOption,
			{
				value: 'mercenaries-pvp',
				label: 'Mercenaries PvP',
			} as IOption,
			{
				value: 'ranked',
				label: 'Ranked (All)',
			} as IOption,
			{
				value: 'ranked-standard',
				label: 'Ranked Standard',
			} as IOption,
			{
				value: 'ranked-wild',
				label: 'Ranked Wild',
			} as IOption,
			{
				value: 'ranked-classic',
				label: 'Ranked Classic',
			} as IOption,
			{
				value: 'both-duels',
				label: 'Duels (All)',
			} as IOption,
			{
				value: 'duels',
				label: 'Duels Casual',
			} as IOption,
			{
				value: 'paid-duels',
				label: 'Duels Heroic',
			} as IOption,
			{
				value: 'arena',
				label: 'Arena',
			} as IOption,
			{
				value: 'casual',
				label: 'Casual (All)',
			} as IOption,
			{
				value: 'friendly',
				label: 'Friendly (All)',
			} as IOption,
			{
				value: 'tavern-brawl',
				label: 'Tavern Brawl',
			} as IOption,
			{
				value: 'practice',
				label: 'Vs AI',
			} as IOption,
		] as readonly IOption[];
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(([main, nav, prefs]) => prefs.replaysActiveGameModeFilter)
			.pipe(
				this.mapData(([filter]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: true,
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({ ...prefs, replaysActiveGameModeFilter: option.value })),
		);
	}
}
