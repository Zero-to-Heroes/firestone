import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'bgs-sim-minion-tier-filter',
	styleUrls: [],
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
	implements AfterContentInit
{
	options: IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		const tiers = [1, 2, 3, 4, 5, 6, 7];
		this.options = [
			{
				value: 'all',
				label: this.i18n.translateString('app.battlegrounds.filters.tier.all-tiers'),
			} as IOption,
			...tiers.map((tier) => ({
				value: `${tier}`,
				label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: tier }),
			})),
		];
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.filter$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.bgsActiveSimulatorMinionTierFilter),
			this.mapData((filter) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label ?? '',
				visible: true,
			})),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsActiveSimulatorMinionTierFilter: option.value as any };
		await this.prefs.savePreferences(newPrefs);
	}
}
