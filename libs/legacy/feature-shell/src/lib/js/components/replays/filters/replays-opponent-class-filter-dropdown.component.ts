import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { classes, formatClass } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

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
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOption[];
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
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

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.replaysActiveOpponentClassFilter)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.replaysActiveGameModeFilter)),
		]).pipe(
			this.mapData(([filter, gameModeFilter]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: ['ranked', 'ranked-standard', 'ranked-wild'].includes(gameModeFilter),
			})),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onSelected(option: IOption) {
		this.prefs.updatePrefs('replaysActiveOpponentClassFilter', option.value as string);
	}
}
