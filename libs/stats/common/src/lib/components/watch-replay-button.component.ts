/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
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
		<div class="replay online" *ngIf="reviewId" (click)="showOnline()">
			<div class="watch" *ngIf="showReplayOnlineLabel">{{ showReplayOnlineLabel }}</div>
			<div
				class="watch-icon"
				[helpTooltip]="
					!showReplayOnlineLabel
						? ('app.replays.replay-info.watch-replay-online-button-tooltip' | fsTranslate)
						: null
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
	@Input() showReplayOnlineLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-online-button');

	@Input() reviewId: string;
	@Input() showReplayEvent: (reviewId: string) => void;

	constructor(private readonly i18n: ILocalizationService, private readonly ow: OverwolfService) {}

	showReplay() {
		this.showReplayEvent?.(this.reviewId);
	}

	showOnline() {
		this.ow.openUrlInDefaultBrowser(
			`https://replays.firestoneapp.com/?reviewId=${this.reviewId}&source=replays-list`,
		);
	}
}
