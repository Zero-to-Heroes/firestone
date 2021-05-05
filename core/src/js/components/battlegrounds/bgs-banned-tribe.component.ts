import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { getTribeIcon } from '../../services/battlegrounds/bgs-utils';

@Component({
	selector: 'bgs-banned-tribe',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/bgs-banned-tribe.component.scss',
		`../../../css/themes/battlegrounds-theme.scss`,
	],
	template: `
		<div class="bgs-banned-tribe" *ngIf="image">
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

	@Input() set tribe(value: Race) {
		if (!value) {
			this.image = undefined;
			return;
		}
		this.image = getTribeIcon(value);
	}
}
