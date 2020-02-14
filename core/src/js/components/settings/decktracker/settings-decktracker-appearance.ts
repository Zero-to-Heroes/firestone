import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-decktracker-appearance',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-appearance.component.scss`,
	],
	template: `
		<div class="decktracker-appearance">
			<div class="title">Activate / Deactivate features</div>
			<div class="settings-group">
				<div class="subtitle">Global</div>
				<div class="subgroup">
					<preference-toggle
						field="overlayShowTitleBar"
						label="Show title bar"
						tooltip="Show/hide the deck name and cards left in hand and deck"
					></preference-toggle>
					<preference-toggle
						[field]="'overlayShowTooltipsOnHover'"
						[label]="'Show card tooltips'"
					></preference-toggle>
					<preference-toggle
						field="overlayShowRarityColors"
						label="Show rarity colors"
						tooltip="When active, the mana cost of cards in the tracker will be colored based on the card's rarity"
					></preference-toggle>
					<preference-toggle
						field="overlayShowGiftedCardsInSeparateLine"
						label="Show gifts separately"
						tooltip="When active, cards that have been created are displayed in their own lines (one line for each different creator)"
					></preference-toggle>
					<preference-toggle
						field="decktrackerCloseOnGameEnd"
						label="Close tracker on game end"
						tooltip="Automatically close the tracker when the game ends. If disabled, the tracker needs to be closed manually"
					></preference-toggle>
				</div>
				<div class="subtitle">Your deck</div>
				<div class="subgroup">
					<preference-toggle
						field="overlayGroupByZone"
						label="Group cards by zone"
						tooltip="When active, the tracker will split the cards into collapsable sections. The sections active today are Deck, Hand and Other"
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': overlayGroupByZone }"
						class="indented"
						field="overlayCardsGoToBottom"
						label="Used cards go to bottom"
						tooltip="When active, the cards that have been used are shown at the bottom of the list. It can only be activated if the Group cards by zone option is disabled"
					></preference-toggle>
					<preference-toggle
						field="decktrackerNoDeckMode"
						label="Ignore decklist"
						tooltip="Don't load the initial decklist and only track played and drawn cards. Changes will be applied for the next game"
					></preference-toggle>
				</div>
				<div class="subtitle">Opponent's deck</div>
				<div class="subgroup">
					<preference-toggle
						field="opponentTracker"
						label="Show opponent's tracker"
						tooltip="When active, a tracker will show for your opponent's cards"
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !opponentTracker }"
						field="opponentLoadAiDecklist"
						label="Load AI decklists"
						tooltip="When active, the tracker will try to load the decklist of the current AI opponent. Be aware that some decks are pseudo random, so the decklist will often be only indicative."
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !opponentTracker }"
						field="opponentOverlayGroupByZone"
						label="Group cards by zone"
						tooltip="When active, the tracker will split the cards into collapsable sections. The sections active today are Deck, Hand and Other"
					></preference-toggle>
					<preference-toggle
						[ngClass]="{ 'disabled': !opponentTracker || opponentOverlayGroupByZone }"
						class="indented"
						field="opponentOverlayCardsGoToBottom"
						label="Used cards go to bottom"
						tooltip="When active, the cards that have been used are shown at the bottom of the list. It can only be activated if the Group cards by zone option is disabled"
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
				</div>
				<div class="subtitle">Secrets Helper</div>
				<div class="subgroup">
					<preference-toggle
						field="secretsHelper"
						label="Enable Secrets Helper"
						tooltip="When active, a popup with all possible secrets will appear whenever the opponent plays a secret."
					></preference-toggle>
				</div>
			</div>
			<div class="title">Tracker's size & opacity</div>
			<div class="settings-group">
				<div class="subtitle">Your deck</div>
				<preference-slider
					class="first-slider"
					[field]="'decktrackerScale'"
					[enabled]="true"
					[min]="75"
					[max]="125"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
				<div class="text">Opacity</div>
				<preference-slider
					[field]="'overlayOpacityInPercent'"
					[enabled]="true"
					[min]="40"
					[max]="100"
					[showCurrentValue]="true"
				>
				</preference-slider>
				<div class="subtitle">Opponent's deck</div>
				<preference-slider
					class="first-slider"
					field="opponentOverlayScale"
					[enabled]="opponentTracker"
					[min]="75"
					[max]="125"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
				<div class="text" [ngClass]="{ 'disabled': !opponentTracker }">Opacity</div>
				<preference-slider
					field="opponentOverlayOpacityInPercent"
					[enabled]="opponentTracker"
					[min]="40"
					[max]="100"
					[showCurrentValue]="true"
				>
				</preference-slider>
				<div class="subtitle">Secrets Helper</div>
				<preference-slider
					class="first-slider"
					field="secretsHelperScale"
					[enabled]="secretsHelper"
					[min]="60"
					[max]="100"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerAppearanceComponent implements AfterViewInit, OnDestroy {
	sliderEnabled = false;
	showTitleBar: boolean;
	overlayGroupByZone: boolean;
	opponentOverlayGroupByZone: boolean;
	opponentTracker: boolean;
	secretsHelper: boolean;
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

	private displaySubscription: Subscription;
	private preferencesSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private el: ElementRef,
		private ow: OverwolfService,
	) {}

	ngAfterViewInit() {
		this.loadDefaultValues();
		const displayEventBus: BehaviorSubject<any> = this.ow.getMainWindow().decktrackerDisplayEventBus;
		this.displaySubscription = displayEventBus.asObservable().subscribe(shouldDisplay => {
			// console.log('should display', shouldDisplay);
			this.sliderEnabled = shouldDisplay;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});

		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.asObservable().subscribe(event => {
			const preferences: Preferences = event.preferences;
			this.overlayGroupByZone = preferences.overlayGroupByZone;
			this.opponentTracker = preferences.opponentTracker;
			this.secretsHelper = preferences.secretsHelper;
			this.opponentOverlayGroupByZone = preferences.opponentOverlayGroupByZone;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	ngOnDestroy() {
		this.displaySubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		const rect = this.el.nativeElement.querySelector('.decktracker-appearance').getBoundingClientRect();
		// console.log('element rect', rect);
		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.overlayGroupByZone = prefs.overlayGroupByZone;
		this.opponentOverlayGroupByZone = prefs.opponentOverlayGroupByZone;
		this.opponentTracker = prefs.opponentTracker;
		this.secretsHelper = prefs.secretsHelper;
		this.showTitleBar = prefs.overlayShowTitleBar;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
