import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'replays-game-mode-filter-dropdown',
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
export class ReplaysGameModeFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options: IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		this.options = [
			'all',
			'battlegrounds',
			'battlegrounds-friendly',
			'battlegrounds-duo',
			'mercenaries-all',
			'mercenaries-pve',
			'mercenaries-pvp',
			'ranked',
			'ranked-standard',
			'ranked-wild',
			'ranked-classic',
			'ranked-twist',
			'arena-all',
			'arena',
			'arena-underground',
			'casual',
			'friendly',
			'tavern-brawl',
			'practice',
		].map(
			(value) =>
				({
					value: value === 'all' ? null : value,
					label: this.i18n.translateString(`app.replays.filters.game-mode.${value}`),
				}) as IOption,
		);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady()]);

		this.filter$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.replaysActiveGameModeFilter),
			this.mapData((filter) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: true,
			})),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			replaysActiveGameModeFilter: option.value,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
