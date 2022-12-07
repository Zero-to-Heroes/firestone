import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { sortByProperties } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { Knob } from '../preference-slider.component';
import { CounterSetting } from './model';

@Component({
	selector: 'settings-decktracker-opponent-deck',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-opponent-deck.component.scss`,
	],
	template: `
		<div
			class="decktracker-appearance"
			*ngIf="{
				opponentTracker: opponentTracker$ | async,
				opponentOverlayGroupByZone: opponentOverlayGroupByZone$ | async,
				secretsHelper: secretsHelper$ | async,
				dectrackerShowOpponentTurnDraw: dectrackerShowOpponentTurnDraw$ | async,
				dectrackerShowOpponentGuess: dectrackerShowOpponentGuess$ | async,
				dectrackerShowOpponentBuffInHand: dectrackerShowOpponentBuffInHand$ | async
			} as value"
			scrollable
		>
			<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.tracker-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="opponentTracker"
					[label]="'settings.decktracker.opponent-deck.show-tracker-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.show-tracker-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker }"
					field="opponentLoadAiDecklist"
					[label]="'settings.decktracker.opponent-deck.ai-decklist-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.ai-decklist-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker }"
					field="opponentOverlayGroupByZone"
					[label]="'settings.decktracker.opponent-deck.group-cards-by-zone-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.group-cards-by-zone-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker || value.opponentOverlayGroupByZone }"
					class="indented"
					field="opponentOverlayCardsGoToBottom"
					[label]="'settings.decktracker.opponent-deck.used-cards-go-to-bottom-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.used-cards-go-to-bottom-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker || !value.opponentOverlayGroupByZone }"
					class="indented"
					field="opponentOverlayDarkenUsedCards"
					[label]="'settings.decktracker.opponent-deck.darken-used-cards-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.darken-used-cards-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker || !value.opponentOverlayGroupByZone }"
					class="indented"
					field="overlayShowGlobalEffects"
					[label]="'settings.decktracker.opponent-deck.global-effects-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.global-effects-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker || !value.opponentOverlayGroupByZone }"
					class="indented"
					field="opponentOverlaySortByManaInOtherZone"
					[label]="'settings.decktracker.opponent-deck.sort-by-mana-cost-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.sort-by-mana-cost-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker || !value.opponentOverlayGroupByZone }"
					class="indented"
					field="opponentOverlayShowTopCardsSeparately"
					[label]="'settings.decktracker.opponent-deck.show-top-cards-separately-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.show-top-cards-separately-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker || !value.opponentOverlayGroupByZone }"
					class="indented"
					field="opponentOverlayShowBottomCardsSeparately"
					[label]="'settings.decktracker.opponent-deck.show-bottom-cards-separately-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.show-bottom-cards-separately-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker }"
					field="opponentOverlayShowDkRunes"
					[label]="'settings.decktracker.opponent-deck.show-dk-runes-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.show-dk-runes-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker }"
					class="indented"
					field="opponentOverlayHideGeneratedCardsInOtherZone"
					[label]="'settings.decktracker.opponent-deck.hide-generated-cards-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.hide-generated-cards-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[ngClass]="{ disabled: !value.opponentTracker }"
					class="indented"
					field="hideOpponentDecktrackerWhenFriendsListIsOpen"
					[label]="'settings.battlegrounds.session-widget.hide-when-friends-list-open' | owTranslate"
					[tooltip]="
						'settings.battlegrounds.session-widget.hide-when-friends-list-open-tooltip' | owTranslate
					"
				></preference-toggle>
			</div>

			<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.opponent-hand-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="dectrackerShowOpponentTurnDraw"
					[label]="'settings.decktracker.opponent-deck.card-turn-draw-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.card-turn-draw-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="dectrackerShowOpponentGuess"
					[label]="'settings.decktracker.opponent-deck.guessed-cards-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.guessed-cards-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="dectrackerShowOpponentBuffInHand"
					[label]="'settings.decktracker.opponent-deck.buff-in-hand-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.buff-in-hand-tooltip' | owTranslate"
				></preference-toggle>
			</div>

			<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.secrets-helper-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="secretsHelper"
					[label]="'settings.decktracker.opponent-deck.enable-secret-helper-label' | owTranslate"
					[tooltip]="'settings.decktracker.opponent-deck.enable-secret-helper-tooltip' | owTranslate"
				></preference-toggle>
			</div>

			<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.counters.title'"></div>
			<div class="settings-group">
				<preference-toggle
					*ngFor="let counter of counters"
					[field]="counter.field"
					[label]="counter.label"
					[tooltip]="counter.tooltip"
				></preference-toggle>
			</div>

			<div class="title" [owTranslate]="'settings.decktracker.opponent-deck.size-title'"></div>
			<div class="settings-group">
				<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.tracker-title'"></div>
				<preference-slider
					class="first-slider deck-slider"
					field="opponentOverlayScale"
					[enabled]="value.opponentTracker"
					[min]="50"
					[max]="125"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
				<div
					class="text"
					[ngClass]="{ disabled: !value.opponentTracker }"
					[owTranslate]="'settings.decktracker.opponent-deck.opacity-title'"
				></div>
				<preference-slider
					field="opponentOverlayOpacityInPercent"
					[enabled]="value.opponentTracker"
					[min]="40"
					[max]="100"
					[showCurrentValue]="true"
				>
				</preference-slider>
				<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.secrets-helper-title'"></div>
				<preference-slider
					class="first-slider secrets-slider"
					field="secretsHelperScale"
					[enabled]="value.secretsHelper"
					[min]="60"
					[max]="100"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
				<div class="subtitle" [owTranslate]="'settings.decktracker.opponent-deck.hand-markers-title'"></div>
				<preference-slider
					class="first-slider hand-slider"
					field="decktrackerOpponentHandScale"
					[enabled]="
						value.dectrackerShowOpponentTurnDraw ||
						value.dectrackerShowOpponentGuess ||
						value.dectrackerShowOpponentBuffInHand
					"
					[min]="80"
					[max]="200"
					[snapSensitivity]="5"
					[knobs]="handSizeKnobs"
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
	// dectrackerShowOpponentTurnDraw || dectrackerShowOpponentGuess || dectrackerShowOpponentBuffInHand
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerOpponentDeckComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	opponentOverlayGroupByZone$: Observable<boolean>;
	opponentTracker$: Observable<boolean>;
	dectrackerShowOpponentTurnDraw$: Observable<boolean>;
	dectrackerShowOpponentGuess$: Observable<boolean>;
	dectrackerShowOpponentBuffInHand$: Observable<boolean>;
	secretsHelper$: Observable<boolean>;

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
	handSizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.default'),
		},
	];

	counters: readonly CounterSetting[] = [
		{
			id: 'galakrond',
			field: 'opponentGalakrondCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-tooltip'),
		},
		{
			id: 'pogo',
			field: 'opponentPogoCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.pogo-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.pogo-tooltip'),
		},
		{
			id: 'jade',
			field: 'opponentJadeGolemCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.jade-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.jade-tooltip'),
		},
		{
			id: 'cthun',
			field: 'opponentCthunCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-tooltip'),
		},
		{
			id: 'fatigue',
			field: 'opponentFatigueCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-tooltip'),
		},
		{
			id: 'abyssal-curse',
			field: 'opponentAbyssalCurseCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-tooltip'),
		},
		{
			id: 'attack-on-board',
			field: 'opponentAttackCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.attack-on-board-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.attack-on-board-tooltip'),
		},
		{
			id: 'watch-post',
			field: 'opponentWatchpostCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.watch-post-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.watch-post-tooltip'),
		},
		{
			id: 'libram',
			field: 'opponentLibramCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.libram-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.libram-tooltip'),
		},
		{
			id: 'elwynn-boar',
			field: 'opponentElwynnBoarCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.elwynn-boar-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.elwynn-boar-tooltip'),
		},
		{
			id: 'volatile-skeleton',
			field: 'opponentVolatileSkeletonCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.volatile-skeleton-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.volatile-skeleton-tooltip'),
		},
		{
			id: 'relic',
			field: 'opponentRelicCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.relic-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.relic-tooltip'),
		},
		{
			id: 'hero-power-damage',
			field: 'opponentHeroPowerDamageCounter',
			label: this.i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-damage-label'),
			tooltip: this.i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-damage-tooltip'),
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
		this.opponentTracker$ = this.listenForBasicPref$((prefs) => prefs.opponentTracker);
		this.secretsHelper$ = this.listenForBasicPref$((prefs) => prefs.secretsHelper);
		this.opponentOverlayGroupByZone$ = this.listenForBasicPref$((prefs) => prefs.opponentOverlayGroupByZone);
		this.dectrackerShowOpponentTurnDraw$ = this.listenForBasicPref$(
			(prefs) => prefs.dectrackerShowOpponentTurnDraw,
		);
		this.dectrackerShowOpponentGuess$ = this.listenForBasicPref$((prefs) => prefs.dectrackerShowOpponentGuess);
		this.dectrackerShowOpponentBuffInHand$ = this.listenForBasicPref$(
			(prefs) => prefs.dectrackerShowOpponentBuffInHand,
		);
	}
}
