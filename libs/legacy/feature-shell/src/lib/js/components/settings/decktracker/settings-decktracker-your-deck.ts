import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { sortByProperties } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { Knob } from '../preference-slider.component';
import { CounterSetting } from './model';

@Component({
	selector: 'settings-decktracker-your-deck',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-your-deck.component.scss`,
	],
	template: `
		<div
			class="decktracker-appearance"
			*ngIf="{ overlayGroupByZone: overlayGroupByZone$ | async } as value"
			scrollable
		>
			<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.tracker-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="overlayGroupByZone"
					[label]="'settings.decktracker.opponent-deck.group-cards-by-zone-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.group-cards-by-zone-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: value.overlayGroupByZone }"
					class="indented"
					field="overlayCardsGoToBottom"
					[label]="'settings.decktracker.opponent-deck.used-cards-go-to-bottom-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.used-cards-go-to-bottom-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.overlayGroupByZone }"
					class="indented"
					field="overlayDarkenUsedCards"
					[label]="'settings.decktracker.opponent-deck.darken-used-cards-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.darken-used-cards-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.overlayGroupByZone }"
					class="indented"
					field="overlayShowGlobalEffects"
					[label]="'settings.decktracker.opponent-deck.global-effects-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.global-effects-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.overlayGroupByZone }"
					class="indented"
					field="overlaySortByManaInOtherZone"
					[label]="'settings.decktracker.opponent-deck.sort-by-mana-cost-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.sort-by-mana-cost-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					class="indented"
					field="overlayShowTopCardsSeparately"
					[label]="'settings.decktracker.opponent-deck.show-top-cards-separately-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.show-top-cards-separately-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					class="indented"
					field="overlayShowBottomCardsSeparately"
					[label]="'settings.decktracker.opponent-deck.show-bottom-cards-separately-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.show-bottom-cards-separately-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="overlayShowDkRunes"
					[label]="'settings.decktracker.opponent-deck.show-dk-runes-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.show-dk-runes-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					class="indented"
					field="overlayHideGeneratedCardsInOtherZone"
					[label]="'settings.decktracker.opponent-deck.hide-generated-cards-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.hide-generated-cards-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="decktrackerNoDeckMode"
					[label]="'settings.decktracker.your-deck.ignore-decklist-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.ignore-decklist-tooltip' | owTranslate"
					advancedSetting
					[messageWhenToggleValue]="
						'settings.decktracker.your-deck.ignore-decklist-confirmation' | owTranslate
					"
					[valueToDisplayMessageOn]="true"
				></preference-toggle>
			</div>

			<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.counters.title'"></div>
			<div class="settings-group">
				<ng-container *ngFor="let counter of counters">
					<preference-toggle
						*ngIf="!counter.showLimitedOption"
						class="toggle"
						[field]="counter.field"
						[label]="counter.label"
						[tooltip]="counter.tooltip"
					></preference-toggle>
					<preference-ynlimited
						*ngIf="counter.showLimitedOption"
						class="toggle"
						[field]="counter.field"
						[label]="counter.label"
						[tooltip]="counter.tooltip"
					></preference-ynlimited>
				</ng-container>
			</div>

			<div class="title" [owTranslate]="'settings.decktracker.opponent-deck.size-title'"></div>
			<div class="settings-group">
				<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.tracker-title'"></div>
				<preference-slider
					class="first-slider"
					[field]="'decktrackerScale'"
					[enabled]="true"
					[min]="50"
					[max]="125"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
				<div class="text" [owTranslate]="'settings.decktracker.opponent-deck.opacity-title'"></div>
				<preference-slider
					[field]="'overlayOpacityInPercent'"
					[enabled]="true"
					[min]="40"
					[max]="100"
					[showCurrentValue]="true"
				>
				</preference-slider>
			</div>

			<div class="title" [owTranslate]="'settings.decktracker.global.counters-size'"></div>
			<div class="settings-group">
				<preference-slider
					class="first-slider"
					[field]="'countersScale'"
					[enabled]="true"
					[min]="60"
					[max]="140"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerYourDeckComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	overlayGroupByZone$: Observable<boolean>;
	sizeKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			percentageValue: 50,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			percentageValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];

	counters: readonly CounterSetting[] = [
		{
			id: 'galakrond',
			field: 'playerGalakrondCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.galakrond-tooltip'),
		},
		{
			id: 'pogo',
			field: 'playerPogoCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.pogo-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.pogo-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'astralAutomaton',
			field: 'playerAstralAutomatonCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.astral-automaton-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.astral-automaton-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'chainedGuardian',
			field: 'playerChainedGuardianCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.chained-guardian-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.chained-guardian-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'earthenGolem',
			field: 'playerEarthenGolemCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.earthen-golem-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.earthen-golem-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'treant',
			field: 'playerTreantCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.treant-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.treant-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'jade',
			field: 'playerJadeGolemCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.jade-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.jade-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'cthun',
			field: 'playerCthunCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.cthun-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'fatigue',
			field: 'playerFatigueCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.fatigue-tooltip'),
		},
		{
			id: 'abyssal-curse',
			field: 'playerAbyssalCurseCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.abyssal-curse-tooltip'),
		},
		{
			id: 'attack-on-board',
			field: 'playerAttackCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.attack-on-board-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.attack-on-board-tooltip'),
		},
		{
			id: 'number-of-spells',
			field: 'playerSpellCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.number-of-spells-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.number-of-spells-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'elementals',
			field: 'playerElementalCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.elementals-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.elementals-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'watch-post',
			field: 'playerWatchpostCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.watch-post-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.watch-post-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'libram',
			field: 'playerLibramCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.libram-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.libram-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'elwynn-boar',
			field: 'playerElwynnBoarCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.elwynn-boar-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.elwynn-boar-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'volatile-skeleton',
			field: 'playerVolatileSkeletonCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.volatile-skeleton-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.volatile-skeleton-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'relic',
			field: 'playerRelicCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.relic-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.relic-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'hero-power-damage',
			field: 'playerHeroPowerDamageCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-damage-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.hero-power-damage-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'bolner',
			field: 'playerBolnerCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.bolner-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.bolner-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'brilliant-macaw',
			field: 'playerBrilliantMacawCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.brilliant-macaw-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.brilliant-macaw-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'monstrous-parrot',
			field: 'playerMonstrousParrotCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.monstrous-parrot-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.monstrous-parrot-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'vanessa',
			field: 'playerVanessaVanCleefCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.vanessa-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.vanessa-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'excavate',
			field: 'playerExcavateCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.excavate-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.excavate-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'chaoticTendril',
			field: 'playerChaoticTendrilCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.chaotic-tendril-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.chaotic-tendril-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'secretsPlayed',
			field: 'playerSecretsPlayedCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.secrets-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.secrets-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'lightray',
			field: 'playerLightrayCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.lightray-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.lightray-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'menagerie',
			field: 'playerMenagerieCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.menagerie-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.menagerie-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'corpse-spent',
			field: 'playerCorpseSpentCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.corpse-spent-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.corpse-spent-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'overdraft',
			field: 'playerOverdraftCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.overdraft-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.overdraft-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'asvedon',
			field: 'playerAsvedonCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.asvedon-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.asvedon-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'murozond',
			field: 'playerMurozondTheInfiniteCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.murozond-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.murozond-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'nagaGiant',
			field: 'playerNagaGiantCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.naga-giant-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.naga-giant-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'anachronos',
			field: 'playerAnachronosCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.anachronos-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.anachronos-tooltip'),
		},
		{
			id: 'shockspitter',
			field: 'playerShockspitterCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.shockspitter-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.shockspitter-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'parrotMascot',
			field: 'playerParrotMascotCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.parrot-mascot-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.parrot-mascot-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'queensguard',
			field: 'playerQueensguardCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.queensguard-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.queensguard-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'spectral-pillager',
			field: 'playerSpectralPillagerCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.spectral-pillager-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.spectral-pillager-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'lady-darkvein',
			field: 'playerLadyDarkveinCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.lady-darkvein-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.lady-darkvein-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'grey-sage-parrot',
			field: 'playerGreySageParrotCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.grey-sage-parrot-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.grey-sage-parrot-tooltip', {
				cost: 6,
			}),
			showLimitedOption: true,
		},
		{
			id: 'multicaster',
			field: 'playerMulticasterCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.multicaster-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.multicaster-tooltip'),
			showLimitedOption: true,
		},
		{
			id: 'bonelord-frostwhisper',
			field: 'playerBonelordFrostwhisperCounter',
			label: this.i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-label'),
			tooltip: this.i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-tooltip'),
		},
	].sort(sortByProperties((t) => [t.label]));

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.overlayGroupByZone$ = this.listenForBasicPref$((prefs) => prefs.overlayGroupByZone);
	}
}
