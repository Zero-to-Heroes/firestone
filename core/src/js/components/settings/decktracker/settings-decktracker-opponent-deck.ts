import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-decktracker-opponent-deck',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
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
			<div class="title">Activate / Deactivate features</div>
			<div class="settings-group">
				<div class="subtitle">Opponent's deck</div>
				<div class="subgroup">
					<preference-toggle
						field="opponentTracker"
						label="Show opponent's tracker"
						tooltip="When active, a tracker will show for your opponent's cards"
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !value.opponentTracker }"
						field="opponentLoadAiDecklist"
						label="Load AI decklists"
						tooltip="When active, the tracker will try to load the decklist of the current AI opponent. Be aware that some decks are pseudo random, so the decklist will often be only indicative."
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !value.opponentTracker }"
						field="opponentOverlayGroupByZone"
						label="Group cards by zone"
						tooltip="When active, the tracker will split the cards into collapsable sections. The sections active today are Deck, Hand and Other"
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !value.opponentTracker || value.opponentOverlayGroupByZone }"
						class="indented"
						field="opponentOverlayCardsGoToBottom"
						label="Used cards go to bottom"
						tooltip="When active, the cards that have been used are shown at the bottom of the list. It can only be activated if the Group cards by zone option is disabled"
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !value.opponentTracker }"
						class="indented"
						field="opponentOverlayDarkenUsedCards"
						label="Darken used cards"
						tooltip="When active, the cards that have been used are darkened."
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !value.opponentTracker || !value.opponentOverlayGroupByZone }"
						class="indented"
						field="overlayShowGlobalEffects"
						label="Show global effects"
						tooltip="When active, a new section appears at the top of the tracker that shows global effects on the opponent's deck (for now, only Dungeon Run passives)"
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !value.opponentTracker || !value.opponentOverlayGroupByZone }"
						class="indented"
						field="opponentOverlaySortByManaInOtherZone"
						label="Sort cards by mana cost"
						tooltip="When active, the cards will be sorted by mana cost in the Other zone. Otherwise, the zone will first show the cards on the board, then the graveyard, then the others."
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !value.opponentTracker || !value.opponentOverlayGroupByZone }"
						class="indented"
						field="opponentOverlayHideGeneratedCardsInOtherZone"
						label="Hide generated cards in Other zone"
						tooltip="When active, the cards that didn't start in your opponent's deck won't appear in the Other zone"
					></preference-toggle>
					<preference-toggle
						field="dectrackerShowOpponentTurnDraw"
						label="Card turn draw"
						tooltip="Show the turn at which a card in the opponent's hand was drawn"
					></preference-toggle>
					<preference-toggle
						field="dectrackerShowOpponentGuess"
						label="Guessed cards"
						tooltip="Show what card is in the opponent's hand when we know it (after it has been sent back to their hand with a Sap for instance)"
					></preference-toggle>
					<preference-toggle
						field="dectrackerShowOpponentBuffInHand"
						label="Show buff in hand"
						tooltip="Show buffs affecting cards in the opponent's hand"
					></preference-toggle>
				</div>
				<div class="subtitle">Secrets Helper</div>
				<div class="subgroup">
					<preference-toggle
						field="secretsHelper"
						label="Enable Secrets Helper"
						tooltip="When active, a popup with all possible secrets will appear whenever the opponent plays a secret."
					></preference-toggle>
				</div>
				<!-- <div class="subtitle">Archetype guessing</div>
				<div class="subgroup">
					<preference-toggle
						field="guessOpponentArchetype"
						label="Enable archetype guess"
						tooltip="When active, a new window will appear at the beginning of each match, and will try to guess your opponent's archetype based on the cards they play."
					></preference-toggle>
				</div> -->
				<div class="subtitle">Counters</div>
				<div class="subgroup">
					<preference-toggle
						field="opponentGalakrondCounter"
						label="Galakrond Invoke"
						tooltip="Show the number of times your opponent has invoked Galakrond (appears only when the opponent plays Galakrond or a card that Invokes Galakrond)"
					></preference-toggle>
					<preference-toggle
						field="opponentPogoCounter"
						label="Pogo-Hopper"
						tooltip="Show the number of times your opponent played a Pogo-Hopper"
					></preference-toggle>
					<preference-toggle
						field="opponentJadeGolemCounter"
						label="Jade Golem"
						tooltip="Show the current size of your opponent's Jade Golems"
					></preference-toggle>
					<preference-toggle
						field="opponentCthunCounter"
						label="C'Thun"
						tooltip="Show the current size of your opponent's C'Thun"
					></preference-toggle>
					<preference-toggle
						field="opponentFatigueCounter"
						label="Fatigue"
						tooltip="Show your opponent's current fatigue damage"
					></preference-toggle>
					<preference-toggle
						field="opponentAttackCounter"
						label="Attack on board"
						tooltip="Show the total attack of minions on their board + their hero"
					></preference-toggle>
					<preference-toggle
						field="opponentWatchpostCounter"
						label="Watch Posts"
						tooltip="Show the total number of watch posts they played this match. Shows up only if relevant cards are found in the deck or hand"
					></preference-toggle>
					<preference-toggle
						field="opponentLibramCounter"
						label="Librams"
						tooltip="Show the total number of librams they played this match. Shows up only if relevant cards are found in the deck or hand"
					></preference-toggle>
					<preference-toggle
						field="opponentElwynnBoarCounter"
						label="Elwynn Boar deaths"
						tooltip="Show the number of times an Elwynn Boar died for your opponent"
					></preference-toggle>
					<preference-toggle
						field="opponentHeroPowerDamageCounter"
						label="Hero Power damage"
						tooltip="Show the total damage done by your opponent's hero power this match. It shows up only if the opponent's class is Mage and they have dealt at least one damage."
					></preference-toggle>
				</div>
			</div>
			<div class="title">Tracker's size & opacity</div>
			<div class="settings-group">
				<div class="subtitle">Opponent's deck</div>
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
				<div class="text" [ngClass]="{ 'disabled': !value.opponentTracker }">Opacity</div>
				<preference-slider
					field="opponentOverlayOpacityInPercent"
					[enabled]="value.opponentTracker"
					[min]="40"
					[max]="100"
					[showCurrentValue]="true"
				>
				</preference-slider>
				<div class="subtitle">Secrets Helper</div>
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
				<div class="subtitle">Hand markers</div>
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
	implements AfterContentInit {
	opponentOverlayGroupByZone$: Observable<boolean>;
	opponentTracker$: Observable<boolean>;
	dectrackerShowOpponentTurnDraw$: Observable<boolean>;
	dectrackerShowOpponentGuess$: Observable<boolean>;
	dectrackerShowOpponentBuffInHand$: Observable<boolean>;
	secretsHelper$: Observable<boolean>;

	sizeKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: 'Small',
		},
		{
			percentageValue: 50,
			label: 'Medium',
		},
		{
			percentageValue: 100,
			label: 'Large',
		},
	];
	handSizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 100,
			label: 'Default',
		},
	];

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
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
