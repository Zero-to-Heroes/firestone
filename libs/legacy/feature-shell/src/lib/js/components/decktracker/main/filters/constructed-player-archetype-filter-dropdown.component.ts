import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MultiselectOption } from '@firestone/shared/common/view';
import { groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { Observable, combineLatest, filter, tap } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-player-archetype-filter-dropdown',
	styleUrls: [
		`../../../../../css/component/decktracker/main/filters/constructed-player-class-filter-dropdown.component.scss`,
	],
	template: `
		<ng-container *ngIf="visible$ | async">
			<filter-dropdown-multiselect
				*ngIf="filter$ | async as value"
				class="filter-dropdown"
				[options]="options$ | async"
				[selected]="value.selected"
				[placeholder]="value.placeholder"
				[visible]="true"
				[allowSearch]="true"
				(optionSelected)="onSelected($event)"
			></filter-dropdown-multiselect>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedPlayerArchetypeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	visible$: Observable<boolean>;
	options$: Observable<MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.visible$ = this.store
			.listen$(([main, nav]) => nav.navigationDecktracker.currentView)
			.pipe(
				this.mapData(([currentView]) =>
					['constructed-meta-decks', 'constructed-meta-archetypes'].includes(currentView),
				),
			);
		this.options$ = this.store.constructedMetaDecks$().pipe(
			filter((decks) => !!decks?.deckStats?.length),
			this.mapData((decks) => {
				const archetypes = decks.deckStats.flatMap((stat) => ({
					id: stat.archetypeId,
					name: stat.archetypeName,
					playerClass: stat.playerClass,
				}));
				console.debug('considering archetypes', archetypes);
				const archetypesById = groupByFunction((a: { id: number; name: string; playerClass: string }) => a.id)(
					archetypes,
				);
				const options: MultiselectOption[] = Object.keys(archetypesById)
					.map((archetypeId) => {
						const archetype = archetypesById[archetypeId][0];
						const result = {
							value: '' + archetypeId,
							label:
								this.i18n.translateString(`archetype.${archetype.name}`) ===
								`archetype.${archetype.name}`
									? archetype.name
									: this.i18n.translateString(`archetype.${archetype.name}`),
							image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${archetype.playerClass}.png`,
							playerClass: archetype.playerClass,
						};
						return result;
					})
					.sort(sortByProperties((a) => [a.playerClass, a.label]));
				return options;
			}),
		);
		this.filter$ = combineLatest([
			this.store.listenPrefs$((prefs) => prefs.constructedMetaDecksArchetypeFilter),
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.currentView),
		]).pipe(
			tap((filter) => console.debug('[archetype-filter] filter', filter)),
			this.mapData(([[filter], [currentView]]) => ({
				selected: filter.map((a) => '' + a),
				placeholder: this.i18n.translateString(`app.decktracker.filters.archetype-filter.all`),
			})),
		) as any;
	}

	async onSelected(option: readonly string[]) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			constructedMetaDecksArchetypeFilter: option.map((a) => +a),
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
