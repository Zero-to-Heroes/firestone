import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-decktracker-your-deck',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
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
					[ngClass]="{ 'disabled': value.overlayGroupByZone }"
					class="indented"
					field="overlayCardsGoToBottom"
					[label]="'settings.decktracker.opponent-deck.used-cards-go-to-bottom-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.used-cards-go-to-bottom-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					class="indented"
					field="overlayOverlayDarkenUsedCards"
					[label]="'settings.decktracker.opponent-deck.darken-used-cards-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.darken-used-cards-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ 'disabled': !value.overlayGroupByZone }"
					class="indented"
					field="overlayShowGlobalEffects"
					[label]="'settings.decktracker.opponent-deck.global-effects-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.global-effects-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ 'disabled': !value.overlayGroupByZone }"
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
					[ngClass]="{ 'disabled': !value.overlayGroupByZone }"
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
				<preference-toggle
					field="playerGalakrondCounter"
					[label]="'settings.decktracker.opponent-deck.counters.galakrond-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.galakrond-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerPogoCounter"
					[label]="'settings.decktracker.opponent-deck.counters.pogo-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.pogo-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerJadeGolemCounter"
					[label]="'settings.decktracker.opponent-deck.counters.jade-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.jade-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerCthunCounter"
					[label]="'settings.decktracker.opponent-deck.counters.cthun-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.cthun-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerFatigueCounter"
					[label]="'settings.decktracker.opponent-deck.counters.fatigue-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.fatigue-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerAttackCounter"
					[label]="'settings.decktracker.opponent-deck.counters.attack-on-board-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.attack-on-board-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerSpellCounter"
					[label]="'settings.decktracker.your-deck.counters.number-of-spells-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.number-of-spells-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerElementalCounter"
					[label]="'settings.decktracker.your-deck.counters.elementals-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.elementals-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerWatchpostCounter"
					[label]="'settings.decktracker.opponent-deck.counters.watch-post-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.watch-post-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerLibramCounter"
					[label]="'settings.decktracker.opponent-deck.counters.libram-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.libram-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerElwynnBoarCounter"
					[label]="'settings.decktracker.opponent-deck.counters.elwynn-boar-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.elwynn-boar-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerHeroPowerDamageCounter"
					[label]="'settings.decktracker.opponent-deck.counters.hero-power-damage-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.hero-power-damage-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBolnerCounter"
					[label]="'settings.decktracker.your-deck.counters.bolner-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.bolner-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBrilliantMacawCounter"
					[label]="'settings.decktracker.your-deck.counters.brilliant-macaw-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.brilliant-macaw-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerMulticasterCounter"
					[label]="'settings.decktracker.your-deck.counters.multicaster-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.multicaster-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerCoralKeeperCounter"
					[label]="'settings.decktracker.your-deck.counters.coral-keeper-label' | owTranslate"
					[tooltip]="'settings.decktracker.your-deck.counters.coral-keeper-tooltip' | owTranslate"
				></preference-toggle>
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
export class SettingsDecktrackerYourDeckComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
