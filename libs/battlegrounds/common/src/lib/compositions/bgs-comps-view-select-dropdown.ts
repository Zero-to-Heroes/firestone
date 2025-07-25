/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsCompositionsListMode, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { BattlegroundsNavigationService } from '../services/bgs-navigation.service';

@Component({
	standalone: false,
	selector: 'bgs-comps-view-select-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="bgs-comps-view-select-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCompositionsViewSelectDropdownComponent
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
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.options = [
			{
				value: 'exploring',
				label: this.i18n.translateString('battlegrounds.in-game.minions-list.compositions.filters.exploring'),
			},
			{
				value: 'browsing',
				label: this.i18n.translateString('battlegrounds.in-game.minions-list.compositions.filters.browsing'),
			},
		];
		this.filter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsCompositionsListMode)).pipe(
			filter((filter) => !!filter),
			distinctUntilChanged(),
			this.mapData((filter) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label ?? '',
				visible: true,
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsCompositionsListMode: option.value as BgsCompositionsListMode,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
