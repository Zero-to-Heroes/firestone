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
import { FeatureFlags } from '../../../services/feature-flags';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-decktracker-global',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-global.component.scss`,
	],
	template: `
		<div class="decktracker-appearance">
			<div class="title">Activate / Deactivate features</div>
			<div class="settings-group">
				<div class="subgroup">
					<preference-toggle
						field="overlayShowTitleBar"
						label="Show title bar"
						tooltip="Show/hide the deck name and cards left in hand and deck"
					></preference-toggle>
					<preference-toggle
						field="overlayShowControlBar"
						label="Show control bar"
						tooltip="Show/hide the bar with the logo and the control buttons"
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
						field="overlayShowDeckWinrate"
						label="Show deck winrate"
						tooltip="When active, it shows the deck overall Ranked winrate above the tracker if we have data (in either Standard or Wild, based on the current game mode)"
					></preference-toggle>
					<preference-toggle
						field="overlayShowMatchupWinrate"
						label="Show matchup winrate"
						tooltip="When active, it shows the deck overall Ranked winrate against the opponent's class above the tracker if we have data (in either Standard or Wild, based on the current game mode)"
					></preference-toggle>
					<preference-toggle
						field="overlayShowGiftedCardsInSeparateLine"
						label="Show gifts separately"
						tooltip="When active, cards that have been created are displayed in their own lines (one line for each different creator)"
					></preference-toggle>
					<preference-toggle
						field="overlayShowCostReduction"
						label="Update cost in deck"
						tooltip="When active, the mana cost of cards in the deck whose cost has been modified reflects the new cost value."
					></preference-toggle>
					<preference-toggle
						field="decktrackerCloseOnGameEnd"
						label="Close tracker on game end"
						tooltip="Automatically close the tracker when the game ends. If disabled, the tracker needs to be closed manually"
						advancedSetting
						messageWhenToggleValue="Got it, Firestone won't close the tracker when the match ends"
						[valueToDisplayMessageOn]="false"
					></preference-toggle>
				</div>
			</div>

			<div class="reset-container" *ngIf="showDecktrackerResetPositions">
				<button
					(mousedown)="reset()"
					helpTooltip="Reset the decktracker positions. This can solve an issue where your tracker doesn't show up anymore on screen."
				>
					<span>{{ resetText }}</span>
				</button>
				<div class="confirmation" *ngIf="showResetConfirmationText">
					Decktracker positions have been reset, and will be applied in your next match.
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerGlobalComponent implements AfterViewInit, OnDestroy {
	showDecktrackerResetPositions = FeatureFlags.ENABLE_DECKTRACKER_RESET_POSITIONS;
	resetText = 'Reset positions';
	confirmationShown = false;
	showResetConfirmationText = false;

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
		this.displaySubscription = displayEventBus.asObservable().subscribe((shouldDisplay) => {
			// console.log('should display', shouldDisplay);
			this.sliderEnabled = shouldDisplay;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.asObservable().subscribe((event) => {
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

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.displaySubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
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

	async reset() {
		if (!this.confirmationShown) {
			this.confirmationShown = true;
			this.resetText = 'Are you sure?';
			return;
		}

		this.resetText = 'Reset positions';
		this.confirmationShown = false;
		this.showResetConfirmationText = true;
		await this.prefs.resetDecktrackerPositions();
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.overlayGroupByZone = prefs.overlayGroupByZone;
		this.opponentOverlayGroupByZone = prefs.opponentOverlayGroupByZone;
		this.opponentTracker = prefs.opponentTracker;
		this.secretsHelper = prefs.secretsHelper;
		this.showTitleBar = prefs.overlayShowTitleBar;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
