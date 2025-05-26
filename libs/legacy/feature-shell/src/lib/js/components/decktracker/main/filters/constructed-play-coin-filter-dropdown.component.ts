import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

@Component({
	selector: 'constructed-play-coin-filter-dropdown',
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
export class ConstructedPlayCoinFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: ConstructedNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.options = [
			{
				label: this.i18n.translateString('app.decktracker.meta.details.cards.play-coin-filter.all'),
				value: null,
			},
			{
				label: this.i18n.translateString('app.decktracker.meta.details.cards.play-coin-filter.play'),
				value: 'play',
			},
			{
				label: this.i18n.translateString('app.decktracker.meta.details.cards.play-coin-filter.coin'),
				value: 'coin',
			},
		];
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDeckPlayCoinFilter)),
			this.nav.currentView$$,
		]).pipe(
			this.mapData(([filter, currentView]) => {
				console.debug('play/coin filter', filter, this.options);
				return {
					filter: '' + filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['constructed-meta-deck-details'].includes(currentView),
				};
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		await this.prefs.updatePrefs('constructedMetaDeckPlayCoinFilter', option.value as 'play' | 'coin' | null);
	}
}
