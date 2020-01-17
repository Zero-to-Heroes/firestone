import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

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
			<div class="settings-group">
				<div class="title">Common display options</div>
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
			</div>
			<div class="settings-group">
				<div class="title">Player tracker settings</div>
				<preference-toggle
					field="overlayGroupByZone"
					label="Group cards by zone"
					tooltip="When active, the tracker will split the cards into collapsable sections. The sections active today are Deck, Hand and Other"
				></preference-toggle>
				<preference-toggle
					*ngIf="!overlayGroupByZone"
					class="indented"
					field="overlayCardsGoToBottom"
					label="Cards in deck at the top"
					tooltip="When active, the cards still in the deck are shown at the top of the list. It can only be activated if the Group cards by zone option is disabled"
				></preference-toggle>
				<preference-slider
					class="first-slider"
					[field]="'overlayWidthInPx'"
					[label]="'Overlay width'"
					[enabled]="sliderEnabled"
					[tooltip]="'Change the tracker width.'"
					[tooltipDisabled]="
						'Change the tracker width. This feature is only available when the tracker is displayed. Please launch a game, or activate the tracker for your curent mode.'
					"
					[min]="215"
					[max]="300"
				>
				</preference-slider>
				<preference-slider
					[field]="'decktrackerScale'"
					[label]="'Overlay size'"
					[enabled]="sliderEnabled"
					[tooltip]="'Change the tracker scale.'"
					[tooltipDisabled]="
						'Change the tracker scale. This feature is only available when the tracker is displayed. Please launch a game, or activate the tracker for your curent mode.'
					"
					[min]="75"
					[max]="200"
				>
				</preference-slider>
				<preference-slider
					[field]="'overlayOpacityInPercent'"
					[label]="'Overlay opacity'"
					[enabled]="sliderEnabled"
					[tooltip]="'Change the tracker opacity.'"
					[tooltipDisabled]="
						'Change the tracker opacity. This feature is only available when the tracker is displayed. Please launch a game, or activate the tracker for your curent mode.'
					"
					[min]="40"
					[max]="100"
				>
				</preference-slider>
			</div>
			<div class="settings-group">
				<div class="title">Opponent tracker settings</div>
				<preference-toggle
					field="opponentTracker"
					label="Show opponent tracker"
					tooltip="When active, a tracker will show for your opponent's cards"
				></preference-toggle>
				<preference-toggle
					*ngIf="opponentTracker"
					field="opponentLoadAiDecklist"
					label="Load AI decklists"
					tooltip="When active, the tracker will try to load the decklist of the current AI opponent. Will take effect at the start of the next match"
				></preference-toggle>
				<preference-toggle
					*ngIf="opponentTracker"
					field="opponentOverlayGroupByZone"
					label="Group cards by zone"
					tooltip="When active, the tracker will split the cards into collapsable sections. The sections active today are Deck, Hand and Other"
				></preference-toggle>
				<preference-toggle
					*ngIf="!opponentOverlayGroupByZone && opponentTracker"
					class="indented"
					field="opponentOverlayCardsGoToBottom"
					label="Cards in deck at the top"
					tooltip="When active, the cards still in the deck are shown at the top of the list. It can only be activated if the Group cards by zone option is disabled"
				></preference-toggle>
				<preference-slider
					*ngIf="opponentTracker"
					class="first-slider"
					field="opponentOverlayWidthInPx"
					label="Overlay width"
					[enabled]="sliderEnabled"
					tooltip="Change the opponent's tracker width."
					tooltipDisabled="
						Change the opponent's tracker width. This feature is only available when the tracker is displayed. Please launch a game, or activate the tracker for your curent mode.
					"
					[min]="215"
					[max]="300"
				>
				</preference-slider>
				<preference-slider
					*ngIf="opponentTracker"
					field="opponentOverlayScale"
					label="Overlay size"
					[enabled]="sliderEnabled"
					tooltip="Change the opponent's tracker scale."
					tooltipDisabled="
						Change the opponent's tracker scale. This feature is only available when the tracker is displayed. Please launch a game, or activate the tracker for your curent mode.
					"
					[min]="75"
					[max]="200"
				>
				</preference-slider>
				<preference-slider
					*ngIf="opponentTracker"
					field="opponentOverlayOpacityInPercent"
					label="Overlay opacity"
					[enabled]="sliderEnabled"
					tooltip="Change the opponent's tracker opacity."
					tooltipDisabled="
						Change the opponent's tracker opacity. This feature is only available when the tracker is displayed. Please launch a game, or activate the tracker for your curent mode.
					"
					[min]="40"
					[max]="100"
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

	private displaySubscription: Subscription;
	private preferencesSubscription: Subscription;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private ow: OverwolfService) {}

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
			this.overlayGroupByZone = event.preferences.overlayGroupByZone;
			this.opponentTracker = event.preferences.opponentTracker;
			this.opponentOverlayGroupByZone = event.preferences.opponentOverlayGroupByZone;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	ngOnDestroy() {
		this.displaySubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.overlayGroupByZone = prefs.overlayGroupByZone;
		this.opponentOverlayGroupByZone = prefs.opponentOverlayGroupByZone;
		this.opponentTracker = prefs.opponentTracker;
		this.showTitleBar = prefs.overlayShowTitleBar;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
