/* eslint-disable no-mixed-spaces-and-tabs */
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Inject,
	Input,
	Optional,
} from '@angular/core';
import { InGameReplayService, IN_GAME_REPLAY_ERROR_MESSAGES } from '@firestone/mods/common';
import { ENABLE_IN_GAME_REPLAY } from '@firestone/shared/common/service';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	IAdsService,
	ILocalizationService,
	OverwolfService,
} from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';

const IN_GAME_REPLAY_URL_PREFIX = 'firestoneapp://replay/in-game?reviewId=';
const WEB_REPLAY_URL_PREFIX = 'https://replays.firestoneapp.com/?reviewId=';

@Component({
	standalone: false,
	selector: 'watch-replay-button',
	styleUrls: [`./watch-replay-button.component.scss`],
	template: `
		<div class="watch-dropdown-container" *ngIf="reviewId" (click)="toggleWatchMenu($event)">
			<div class="text" *ngIf="showReplayLabel">{{ showReplayLabel }}</div>
			<div
				class="watch-icon"
				[helpTooltip]="
					!showWatchMenu ? ('app.replays.replay-info.watch-replay-button-tooltip' | fsTranslate) : null
				"
			>
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
				</svg>
			</div>
			<div class="watch-dropdown" *ngIf="showWatchMenu" (click)="$event.stopPropagation()">
				<div class="watch-option" (click)="showReplay($event)">
					{{ 'app.replays.replay-info.watch-replay-in-app-button' | fsTranslate }}
				</div>
				<div class="watch-option" (click)="showOnline($event)">
					{{ 'app.replays.replay-info.watch-replay-online-button' | fsTranslate }}
				</div>
				<div
					class="watch-option"
					*ngIf="powerLogKey && enableInGameReplay && isPowerLogAvailable"
					(click)="showInGame($event)"
					[class.disabled]="inGameLoading"
				>
					<span *ngIf="!inGameLoading">{{
						'app.replays.replay-info.watch-replay-in-game-button' | fsTranslate
					}}</span>
					<span class="loading-spinner" *ngIf="inGameLoading"></span>
				</div>
			</div>
			<div class="in-game-error" *ngIf="inGameError" (click)="dismissError()">
				<span class="error-text">{{ inGameError }}</span>
				<span class="close-icon">&#x2715;</span>
			</div>
		</div>
		<div class="copy-link-container" *ngIf="reviewId && isPremium" (click)="toggleCopyMenu($event)">
			<div class="text">{{ copyLinkText }}</div>
			<div class="copy-icon" [helpTooltip]="'app.replays.replay-info.copy-link-tooltip' | fsTranslate">
				<div class="icon" inlineSVG="assets/svg/copy.svg"></div>
			</div>
			<div class="copy-dropdown" *ngIf="showCopyMenu" (click)="$event.stopPropagation()">
				<div class="copy-option" (click)="copyLink($event, 'web')">
					{{ 'app.replays.replay-info.copy-web-link' | fsTranslate }}
				</div>
				<div class="copy-option" *ngIf="canCopyInGameLink" (click)="copyLink($event, 'in-game')">
					{{ 'app.replays.replay-info.copy-in-game-link' | fsTranslate }}
				</div>
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
	@Input() powerLogAccessed: boolean;
	@Input() creationTimestamp: number;
	@Input() showReplayEvent: (reviewId: string) => void;
	@Input() showInGameEvent: (powerLogKey: string) => void;

	copyLinkText = this.i18n.translateString('app.replays.replay-info.copy-link');
	inGameError: string | null;
	inGameLoading = false;
	showWatchMenu = false;
	showCopyMenu = false;

	readonly enableInGameReplay = ENABLE_IN_GAME_REPLAY;

	get isPowerLogAvailable(): boolean {
		if (this.powerLogAccessed) {
			return true;
		}
		const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
		return !!this.creationTimestamp && Date.now() - this.creationTimestamp < thirtyDaysMs;
	}

	get isPremium(): boolean {
		return this.ads?.hasPremiumSub$$?.getValue() ?? false;
	}

	get canCopyInGameLink(): boolean {
		return !!(this.powerLogKey && this.enableInGameReplay && this.isPowerLogAvailable);
	}

	private errorTimeout: ReturnType<typeof setTimeout> | null;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly ow: OverwolfService,
		private readonly inGameReplayService: InGameReplayService,
		private readonly cdr: ChangeDetectorRef,
		private readonly analytics: AnalyticsService,
		private readonly gameStatsLoader: GameStatsLoaderService,
		@Optional() @Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {}

	@HostListener('document:click')
	onDocumentClick() {
		if (this.showCopyMenu || this.showWatchMenu) {
			this.showCopyMenu = false;
			this.showWatchMenu = false;
			this.cdr.detectChanges();
		}
	}

	toggleWatchMenu(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.showWatchMenu = !this.showWatchMenu;
		this.cdr.detectChanges();
	}

	showReplay(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.showWatchMenu = false;
		this.showReplayEvent?.(this.reviewId);
		this.cdr.detectChanges();
	}

	showOnline(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.showWatchMenu = false;
		this.cdr.detectChanges();
		this.ow.openUrlInDefaultBrowser(
			`https://replays.firestoneapp.com/?reviewId=${this.reviewId}&source=replays-list`,
		);
	}

	async showInGame(event: MouseEvent) {
		if (this.inGameLoading) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		this.dismissError();
		this.showWatchMenu = false;
		this.inGameLoading = true;
		this.cdr.detectChanges();
		//this.powerLogKey = 'premium/cdf90f15-138d-4901-badf-9257cd678880.power.zip';
		console.log('[watch-replay-button] loading powerLogKey', this.powerLogKey, this.reviewId);
		try {
			const result = await this.inGameReplayService.showReplay(this.powerLogKey, this.reviewId);
			console.log('[watch-replay-button] showInGame result', result);
			if (result !== 'started') {
				const translationKey = `app.replays.in-game.error.${result}`;
				const translated = this.i18n.translateString(translationKey);
				this.inGameError = translated !== translationKey
					? translated
					: (IN_GAME_REPLAY_ERROR_MESSAGES[result] ?? translated);
				this.errorTimeout = setTimeout(() => this.dismissError(), 5000);
				this.analytics.trackEvent('replay-in-game-error', { error: result as string });
			} else {
				this.analytics.trackEvent('replay-in-game-started');
				this.powerLogAccessed = true;
				this.gameStatsLoader.updatePowerLogAccessed(this.reviewId);
			}
		} finally {
			this.inGameLoading = false;
			this.cdr.detectChanges();
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

	toggleCopyMenu(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.showCopyMenu = !this.showCopyMenu;
		this.cdr.detectChanges();
	}

	async copyLink(event: MouseEvent, type: 'web' | 'in-game') {
		if (!this.reviewId) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		const url =
			type === 'web'
				? `${WEB_REPLAY_URL_PREFIX}${this.reviewId}&source=replays-list`
				: `${IN_GAME_REPLAY_URL_PREFIX}${this.reviewId}`;
		if (this.ow?.isOwEnabled?.()) {
			this.ow.placeOnClipboard(url);
		} else if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(url);
		}
		this.showCopyMenu = false;
		this.copyLinkText = this.i18n.translateString('decktracker.deck-name.copy-deckstring-confirmation');
		setTimeout(() => {
			this.copyLinkText = this.i18n.translateString('app.replays.replay-info.copy-link');
			this.cdr.detectChanges();
		}, 2000);
		this.analytics.trackEvent('replay-link-copied', { type });
		this.cdr.detectChanges();
	}
}
