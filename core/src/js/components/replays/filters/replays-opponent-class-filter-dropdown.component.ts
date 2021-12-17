import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { classes, formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'replays-opponent-class-filter-dropdown',
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
export class ReplaysOpponentClassFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	options: readonly IOption[];
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		const collator = new Intl.Collator('en-US');
		this.options = [
			{
				value: null,
				label: 'All classes (opponent)',
			} as IOption,
			...classes
				.map(
					(playerClass) =>
						({
							label: formatClass(playerClass, this.i18n),
							value: playerClass,
						} as IOption),
				)
				.sort((a, b) => collator.compare(a.label, b.label)),
		] as readonly IOption[];
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.replaysActiveOpponentClassFilter,
				([main, nav, prefs]) => prefs.replaysActiveGameModeFilter,
			)
			.pipe(
				this.mapData(([filter, gameModeFilter]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						[
							null,
							undefined,
							'battlegrounds',
							'practice',
							'mercenaries-all',
							'mercenaries-pve',
							'mercenaries-pvp',
						].includes(gameModeFilter) || gameModeFilter?.startsWith('mercenaries'),
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				replaysActiveOpponentClassFilter: option.value,
			})),
		);
	}
}
