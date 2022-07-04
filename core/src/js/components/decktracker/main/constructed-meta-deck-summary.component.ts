import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeckStat } from '@firestone-hs/deck-stats';

@Component({
	selector: 'constructed-meta-deck-summary',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-deck-summary.component.scss`,
	],
	template: ` <div class="decktracker-meta-deck-summary" tabindex="0">Here be a meta deck</div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckSummaryComponent {
	@Input() set deck(value: DeckStat) {
		console.debug('setting deck stat', value);
	}
}
