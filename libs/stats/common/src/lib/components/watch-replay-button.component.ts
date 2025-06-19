/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'watch-replay-button',
	styleUrls: [`./watch-replay-button.component.scss`],
	template: `
		<div class="replay" *ngIf="reviewId" (click)="showReplay()">
			<div class="watch" *ngIf="showReplayLabel">{{ showReplayLabel }}</div>
			<div
				class="watch-icon"
				[helpTooltip]="
					!showReplayLabel ? ('app.replays.replay-info.watch-replay-button-tooltip' | fsTranslate) : null
				"
			>
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
				</svg>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchReplayButtonComponent {
	@Input() showReplayLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-button');

	@Input() reviewId: string;
	@Input() showReplayEvent: (reviewId: string) => void;

	constructor(private readonly i18n: ILocalizationService) {}

	showReplay() {
		this.showReplayEvent?.(this.reviewId);
	}
}
