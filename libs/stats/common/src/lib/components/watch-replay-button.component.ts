/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InGameReplayService } from '@firestone/mods/common';
import { ENABLE_IN_GAME_REPLAY } from '@firestone/shared/common/service';
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
		<div class="replay in-game" *ngIf="powerLogKey && enableInGameReplay" (click)="showInGame()">
			<div class="watch" *ngIf="showInGameLabel">{{ showInGameLabel }}</div>
			<div
				class="watch-icon"
				[helpTooltip]="
					!showInGameLabel
						? ('app.replays.replay-info.watch-replay-in-game-button-tooltip' | fsTranslate)
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
	@Input() showInGameLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-in-game-button');

	@Input() reviewId: string;
	@Input() powerLogKey: string;
	@Input() showReplayEvent: (reviewId: string) => void;
	@Input() showInGameEvent: (powerLogKey: string) => void;

	readonly enableInGameReplay = ENABLE_IN_GAME_REPLAY;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly ow: OverwolfService,
		private readonly inGameReplayService: InGameReplayService,
	) {}

	showReplay() {
		this.showReplayEvent?.(this.reviewId);
	}

	showOnline() {
		this.ow.openUrlInDefaultBrowser(
			`https://replays.firestoneapp.com/?reviewId=${this.reviewId}&source=replays-list`,
		);
	}

	async showInGame() {
		const result = await this.inGameReplayService.showReplay(this.powerLogKey);
		console.log('[watch-replay-button] showInGame result', result);
	}
}
