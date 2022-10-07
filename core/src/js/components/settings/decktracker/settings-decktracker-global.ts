import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
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
			<div class="title" [owTranslate]="'settings.decktracker.global.title'"></div>
			<div class="settings-group">
				<div class="subgroup">
					<preference-toggle
						field="useStreamerMode"
						[label]="'settings.decktracker.global.streamer-mode' | owTranslate"
						[tooltip]="'settings.decktracker.global.streamer-mode-tooltip' | owTranslate"
					></preference-toggle>
				</div>
			</div>
			<div class="settings-group">
				<div class="subgroup">
					<preference-toggle
						field="overlayShowTitleBar"
						[label]="'settings.decktracker.global.show-title-bar' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-title-bar-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowControlBar"
						[label]="'settings.decktracker.global.show-control-bar' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-control-bar-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						[field]="'overlayShowTooltipsOnHover'"
						[label]="'settings.decktracker.global.show-tooltips-on-hover' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowRelatedCards"
						[label]="'settings.collection.general.show-related-cards-label' | owTranslate"
						[tooltip]="'settings.collection.general.show-related-cards-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowRarityColors"
						[label]="'settings.decktracker.global.show-rarity-color' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-rarity-color-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowDeckWinrate"
						[label]="'settings.decktracker.global.show-deck-winrate' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-deck-winrate-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowMatchupWinrate"
						[label]="'settings.decktracker.global.show-matchup-winrate' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-matchup-winrate-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowGiftedCardsInSeparateLine"
						[label]="'settings.decktracker.global.show-gifts-separately' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-gifts-separately-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayResetDeckPositionAfterTrade"
						[label]="'settings.decktracker.global.reset-deck-position-after-trade' | owTranslate"
						[tooltip]="'settings.decktracker.global.reset-deck-position-after-trade-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowStatsChange"
						[label]="'settings.decktracker.global.show-stats-change' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-stats-change-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowCostReduction"
						[label]="'settings.decktracker.global.show-cost-reduction' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-cost-reduction-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayShowUnknownCards"
						[label]="'settings.decktracker.global.show-unknown-cards' | owTranslate"
						[tooltip]="'settings.decktracker.global.show-unknown-cards-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayHighlightRelatedCards"
						[label]="'settings.decktracker.global.highlight-related-cards' | owTranslate"
						[tooltip]="'settings.decktracker.global.highlight-related-cards-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="overlayEnableDiscoverHelp"
						[label]="'settings.decktracker.global.discover-help' | owTranslate"
						[tooltip]="'settings.decktracker.global.discover-help-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="decktrackerCloseOnGameEnd"
						[label]="'settings.decktracker.global.close-tracker-on-end' | owTranslate"
						[tooltip]="'settings.decktracker.global.close-tracker-on-end-tooltip' | owTranslate"
						advancedSetting
						[messageWhenToggleValue]="
							'settings.decktracker.global.close-tracker-on-end-advanced' | owTranslate
						"
						[valueToDisplayMessageOn]="false"
					></preference-toggle>
					<preference-toggle
						field="decktrackerShowMinionPlayOrderOnBoard"
						[label]="'settings.decktracker.global.minions-play-order' | owTranslate"
						[tooltip]="'settings.decktracker.global.minions-play-order-tooltip' | owTranslate"
					></preference-toggle>
				</div>
			</div>
			<div class="reset-container">
				<button
					(mousedown)="reset()"
					[helpTooltip]="'settings.decktracker.global.reset-button-tooltip' | owTranslate"
				>
					<span>{{ resetText }}</span>
				</button>
				<div
					class="confirmation"
					*ngIf="showResetConfirmationText"
					[owTranslate]="'settings.decktracker.global.reset-button-confirmation'"
				></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerGlobalComponent {
	resetText = this.i18n.translateString('settings.decktracker.global.reset-button');
	confirmationShown = false;
	showResetConfirmationText = false;
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

	constructor(private readonly prefs: PreferencesService, private readonly i18n: LocalizationFacadeService) {}

	async reset() {
		if (!this.confirmationShown) {
			this.confirmationShown = true;
			this.resetText = this.i18n.translateString('settings.decktracker.global.reset-button-confirm');
			return;
		}

		this.resetText = this.i18n.translateString('settings.decktracker.global.reset-button');
		this.confirmationShown = false;
		this.showResetConfirmationText = true;
		await this.prefs.resetDecktrackerPositions();
	}
}
