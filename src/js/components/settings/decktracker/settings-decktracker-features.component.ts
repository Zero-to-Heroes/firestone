import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-decktracker-features',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-features.component.scss`,
	],
	template: `
		<div class="decktracker-features">
			<h2 class="modes">The following features are active</h2>
			<section class="toggle-label">
				<preference-toggle
					field="dectrackerShowOpponentTurnDraw"
					label="Opponent's card turn draw"
					tooltip="Show the turn at which a card in the opponent's hand was drawn"
				></preference-toggle>
				<preference-toggle
					field="dectrackerShowOpponentGuess"
					label="Opponent guessed cards"
					tooltip="Show what card is in the opponent's hand when we know it (after it has been sent back to their hand with a Sap for instance)"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerFeaturesComponent {}
