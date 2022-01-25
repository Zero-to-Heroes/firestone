import { ChangeDetectionStrategy, Component } from '@angular/core';
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
		<div class="decktracker-appearance" scrollable>
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
						field="overlayShowStatsChange"
						label="Show stats change"
						tooltip="When active, some cards in the decklist will show when their stats have changed (for now only supported for Ignite)"
					></preference-toggle>
					<preference-toggle
						field="overlayShowCostReduction"
						label="Update cost in deck"
						tooltip="When active, the mana cost of cards in the deck whose cost has been modified reflects the new cost value."
					></preference-toggle>
					<preference-toggle
						field="overlayHighlightRelatedCards"
						label="Highlight related cards"
						tooltip="When active, related cards will be highlighted on your decklist when mousing over specific cards (for instance, mousing over Double Jump in your decklist will highlight all Outcast cards in your deck)"
					></preference-toggle>
					<preference-toggle
						field="decktrackerCloseOnGameEnd"
						label="Close tracker on game end"
						tooltip="Automatically close the tracker when the game ends. If disabled, the tracker needs to be closed manually"
						advancedSetting
						messageWhenToggleValue="Got it, Firestone won't close the tracker when the match ends"
						[valueToDisplayMessageOn]="false"
					></preference-toggle>
					<preference-toggle
						field="decktrackerShowMinionPlayOrderOnBoard"
						[label]="'settings.decktracker.overlay.minions-play-order' | owTranslate"
						[tooltip]="'settings.decktracker.overlay.minions-play-order-tooltip' | owTranslate"
					></preference-toggle>
				</div>
			</div>

			<div class="reset-container">
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
export class SettingsDecktrackerGlobalComponent {
	resetText = 'Reset positions';
	confirmationShown = false;
	showResetConfirmationText = false;

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

	constructor(private readonly prefs: PreferencesService) {}

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
}
