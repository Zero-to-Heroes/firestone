import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { classes, formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'replays-player-class-filter-dropdown',
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
export class ReplaysPlayerClassFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	options: readonly IOption[];
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
		const collator = new Intl.Collator('en-US');
		this.options = [
			{
				value: null,
				label: 'All classes (player)',
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
				([main, nav, prefs]) => prefs.replaysActivePlayerClassFilter,
				([main, nav, prefs]) => prefs.replaysActiveGameModeFilter,
			)
			.pipe(
				this.mapData(([filter, gameModeFilter]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['ranked', 'ranked-standard', 'ranked-wild'].includes(gameModeFilter),
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({ ...prefs, replaysActivePlayerClassFilter: option.value })),
		);
	}
}
