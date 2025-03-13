import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { getTribeIcon, Race } from '@firestone-hs/reference-data';

@Component({
	selector: 'bgs-banned-tribe',
	styleUrls: [
		`../../../css/global/cdk-overlay.scss`,
		// `../../../css/themes/battlegrounds-theme.scss`,
		'../../../css/component/battlegrounds/bgs-banned-tribe.component.scss',
	],
	template: `
		<div class="bgs-banned-tribe" *ngIf="image">
			<div class="background"></div>
			<img class="icon" [src]="image" />
			<div class="center-wrapper" *ngIf="!available">
				<div class="cross-container-outer">
					<div class="cross-container-inner">
						<img
							class="crossed"
							src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/mulligan_discard.png"
						/>
					</div>
				</div>
			</div>
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

	@Input() available: boolean;
}
