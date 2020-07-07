import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { getTribeIcon } from '../../services/battlegrounds/bgs-utils';
import { capitalizeFirstLetter } from '../../services/utils';

declare let amplitude;

@Component({
	selector: 'bgs-banned-tribe',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/bgs-banned-tribe.component.scss',
		`../../../css/themes/battlegrounds-theme.scss`,
	],
	template: `
		<div class="bgs-banned-tribe" [helpTooltip]="tooltip">
			<div class="background"></div>
			<img class="icon" [src]="image" />
			<img
				class="crossed"
				src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/mulligan_discard.png"
			/>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribeComponent {
	image: string;
	tooltip: string;

	@Input() set tribe(value: Race) {
		this.image = getTribeIcon(value);
		this.tooltip = `${this.getTribeName(value)}s won't appear in this run`;
	}

	private getTribeName(value: Race): string {
		return capitalizeFirstLetter(Race[value].toLowerCase());
	}
}
