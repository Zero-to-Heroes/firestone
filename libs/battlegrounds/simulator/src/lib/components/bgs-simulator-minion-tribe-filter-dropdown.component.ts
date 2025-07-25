import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'bgs-sim-minion-tribe-filter',
	styleUrls: [],
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
	implements AfterContentInit
{
	options: IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private collator = new Intl.Collator('en-US');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		const battlegroundsCards = this.allCards.getCards().filter((card) => card.isBaconPool);
		const uniqueTribes = [
			...new Set(battlegroundsCards.flatMap((card) => card.races ?? []).map((race) => race?.toLowerCase())),
		].filter((race) => !!race && race !== 'all');
		this.options = [
			{
				value: 'all',
				label: this.i18n.translateString('app.battlegrounds.filters.tribe.all-tribes'),
			} as IOption,
			...uniqueTribes
				.map(
					(tribe) =>
						({
							label: this.i18n.translateString(`global.tribe.${tribe.toLowerCase()}`),
							value: tribe,
						}) as IOption,
				)
				.sort((a, b) => this.collator.compare(a.label, b.label)),
			{
				value: 'blank',
				label: this.i18n.translateString('app.battlegrounds.filters.tribe.no-tribe'),
			} as IOption,
		];
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.filter$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.bgsActiveSimulatorMinionTribeFilter),
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
		const newPrefs: Preferences = { ...prefs, bgsActiveSimulatorMinionTribeFilter: option.value as any };
		await this.prefs.savePreferences(newPrefs);
	}
}
