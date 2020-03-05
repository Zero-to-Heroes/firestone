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
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerGlobalComponent implements AfterViewInit, OnDestroy {
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
