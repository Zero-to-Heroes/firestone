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
	selector: 'settings-decktracker-opponent-deck',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-opponent-deck.component.scss`,
	],
	template: `
		<div class="decktracker-appearance">
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
						[ngClass]="{ 'disabled': !opponentTracker || opponentOverlayGroupByZone }"
						class="indented"
						field="opponentOverlayDarkenUsedCards"
						label="Darken used cards"
						tooltip="When active, the cards that have been used are darkened, to add focus to the cards still in the deck. It can only be activated if the Group cards by zone option is disabled"
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
export class SettingsDecktrackerOpponentDeckComponent implements AfterViewInit, OnDestroy {
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
			if (!(this.cdr as ViewRef)?.destroyed) {
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
			if (!(this.cdr as ViewRef)?.destroyed) {
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
