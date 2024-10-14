import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ALL_CLASSES } from '@firestone-hs/reference-data';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

@Component({
	selector: 'decktracker-player-class-filter-dropdown',
	styleUrls: [`./decktracker-player-class-filter-dropdown.component.scss`],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="filter-dropdown"
			[options]="options"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerPlayerClassFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: MultiselectOption[];
	filter$: Observable<{ selected: readonly string[]; placeholder: string; visible: boolean }>;

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

		this.options = ALL_CLASSES.map((playerClass) => {
			return {
				value: playerClass,
				label: this.i18n.translateString(`global.class.${playerClass}`),
				image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass}.png`,
			};
		}).sort((a, b) => (a.label < b.label ? -1 : 1));
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.desktopPlayerClassFilter)),
			this.nav.currentView$$,
		]).pipe(
			this.mapData(([filter, currentView]) => ({
				selected: filter ?? ALL_CLASSES,
				placeholder: this.i18n.translateString(`global.class.all`),
				visible: ['decks'].includes(currentView),
			})),
		) as any;

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: readonly string[]) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			desktopPlayerClassFilter: option,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
