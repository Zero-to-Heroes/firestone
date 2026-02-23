/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { InGameReplayService } from '@firestone/mods/common';
import { ENABLE_IN_GAME_REPLAY } from '@firestone/shared/common/service';
import { AnalyticsService, ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';

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
		<div class="in-game-container" *ngIf="powerLogKey && enableInGameReplay">
			<div class="replay in-game" (click)="showInGame()">
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
			<div class="in-game-error" *ngIf="inGameError" (click)="dismissError()">
				<span class="error-text">{{ inGameError }}</span>
				<span class="close-icon">&#x2715;</span>
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

	inGameError: string | null;

	readonly enableInGameReplay = ENABLE_IN_GAME_REPLAY;

	private errorTimeout: ReturnType<typeof setTimeout> | null;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly ow: OverwolfService,
		private readonly inGameReplayService: InGameReplayService,
		private readonly cdr: ChangeDetectorRef,
		private readonly analytics: AnalyticsService,
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
		this.dismissError();
		const result = await this.inGameReplayService.showReplay(this.powerLogKey);
		console.log('[watch-replay-button] showInGame result', result);
		if (result !== 'started') {
			this.inGameError = this.i18n.translateString(`app.replays.in-game.error.${result}`);
			this.errorTimeout = setTimeout(() => this.dismissError(), 5000);
			this.analytics.trackEvent('replay-in-game-error', { error: result as string });
			this.cdr.detectChanges();
		} else {
			this.analytics.trackEvent('replay-in-game-started');
		}
	}

	dismissError() {
		if (this.errorTimeout) {
			clearTimeout(this.errorTimeout);
			this.errorTimeout = null;
		}
		this.inGameError = null;
		this.cdr.detectChanges();
	}
}
