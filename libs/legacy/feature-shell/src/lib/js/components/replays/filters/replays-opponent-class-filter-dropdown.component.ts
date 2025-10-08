import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { classes, formatClass } from '@firestone/game-state';
import { IOption } from '@firestone/shared/common/view';
import { Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'replays-opponent-class-filter-dropdown',
	styleUrls: [],
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	options: IOption[];
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
		const collator = new Intl.Collator(this.i18n.formatCurrentLocale());
		this.options = [
			{
				value: null,
				label: this.i18n.translateString('app.replays.filters.opponent.all'),
			} as IOption,
			...classes
				.map(
					(playerClass) =>
						({
							label: formatClass(playerClass, this.i18n),
							value: playerClass,
						}) as IOption,
				)
				.sort((a, b) => collator.compare(a.label, b.label)),
		];
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
					visible: ['ranked', 'ranked-standard', 'ranked-wild'].includes(gameModeFilter),
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
