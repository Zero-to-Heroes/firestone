import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MultiselectOption } from '@firestone/shared/common/view';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { classes } from '@legacy-import/src/lib/js/services/hs-utils';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-player-class-filter-dropdown',
	styleUrls: [
		`../../../../../css/component/decktracker/main/filters/constructed-player-class-filter-dropdown.component.scss`,
	],
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
export class ConstructedPlayerClassFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	options: MultiselectOption[];
	filter$: Observable<{ selected: readonly string[]; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.options = classes
			.map((playerClass) => {
				return {
					value: playerClass,
					label: this.i18n.translateString(`global.class.${playerClass}`),
					image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass}.png`,
				};
			})
			.sort((a, b) => (a.label < b.label ? -1 : 1));
		this.filter$ = combineLatest([
			this.store.listenPrefs$((prefs) => prefs.constructedMetaDecksPlayerClassFilter),
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.currentView),
		]).pipe(
			this.mapData(([[filter], [currentView]]) => ({
				selected: filter ?? classes,
				placeholder: this.i18n.translateString(`global.class.all`),
				visible: ['constructed-meta-decks', 'constructed-meta-archetypes'].includes(currentView),
			})),
		) as any;
	}

	async onSelected(option: readonly string[]) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			constructedMetaDecksPlayerClassFilter: option,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
