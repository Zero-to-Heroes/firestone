import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ShopMinion } from '@firestone/battlegrounds/common';

@Component({
	standalone: false,
	selector: 'bgs-tavern-minion',
	styleUrls: [
		// '../../../../css/themes/battlegrounds-theme.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-tavern-minion.component.scss',
	],
	template: `
		<div class="battlegrounds-theme card">
			<div
				class="highlight highlight-minion"
				*ngIf="highlighted"
				inlineSVG="assets/svg/pinned.svg"
				[style.top.%]="minionTop"
				[style.right.%]="minionRight"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTavernMinionComponent {
	@Input() set minion(value: ShopMinion) {
		this.highlighted = value.highlighted;
	}

	highlighted: boolean;

	minionTop = 10;
	minionRight = 14;
}
