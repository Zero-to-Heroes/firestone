import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption, SharedCommonViewModule } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { distinctUntilChanged, Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-mode-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-mode-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	imports: [CommonModule, BattlegroundsViewModule, SharedCommonViewModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBattlegroundsModeFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOption[];
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.options = [
			{
				value: 'battlegrounds',
				label: this.i18n.translateString('global.game-mode.battlegrounds'),
			},
			{
				value: 'battlegrounds-duo',
				label: this.i18n.translateString('global.game-mode.battlegrounds-duo'),
			},
		];
		this.filter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveGameMode)).pipe(
			distinctUntilChanged(),
			this.mapData((filter) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: true,
			})),
		);

		this.cdr.detectChanges();
	}

	async onSelected(option: IOption) {
		this.prefs.updatePrefs('bgsActiveGameMode', option.value as 'battlegrounds' | 'battlegrounds-duo');
	}
}
