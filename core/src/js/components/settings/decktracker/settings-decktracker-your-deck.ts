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
	selector: 'settings-decktracker-your-deck',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-your-deck.component.scss`,
	],
	template: `
		<div class="decktracker-appearance">
			<div class="title">Activate / Deactivate features</div>
			<div class="settings-group">
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
						advancedSetting
						messageWhenToggleValue="Got it, the tracker will ignore your decklist"
						[valueToDisplayMessageOn]="true"
					></preference-toggle>
				</div>
				<div class="subtitle">Counters</div>
				<div class="subgroup">
					<preference-toggle
						field="playerGalakrondCounter"
						label="Galakrond Invoke"
						tooltip="Show the number of times you have invoked Galakrond (appears only if the deck contains Galakrond or cards that Invoke Galakrond)"
					></preference-toggle>
					<preference-toggle
						field="playerPogoCounter"
						label="Pogo-Hopper"
						tooltip="Show the number of times you played a Pogo-Hopper (includes Battlegrounds)"
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
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerYourDeckComponent implements AfterViewInit, OnDestroy {
	overlayGroupByZone: boolean;
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

	private preferencesSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private el: ElementRef,
		private ow: OverwolfService,
	) {}

	ngAfterViewInit() {
		this.loadDefaultValues();
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.asObservable().subscribe(event => {
			const preferences: Preferences = event.preferences;
			this.overlayGroupByZone = preferences.overlayGroupByZone;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	ngOnDestroy() {
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
