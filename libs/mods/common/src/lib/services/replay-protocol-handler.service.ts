import { Injectable, Optional } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { SceneService } from '@firestone/memory';
import { GameStatusService, NotificationsService } from '@firestone/shared/common/service';
import {
	ApiRunner,
	ILocalizationService,
	OverwolfService,
	OwUtilsService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { InGameReplayService } from './in-game-replay.service';
import { ModsManagerService } from './mods-manager.service';

const REPLAY_IN_GAME_PREFIX = 'firestoneapp://replay/in-game';
const RETRIEVE_REVIEW_URL = 'https://itkmxena7k2kkmkgpevc6skcie0tlwmk.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ReplayProtocolHandlerService {
	constructor(
		private readonly ow: OverwolfService,
		private readonly inGameReplayService: InGameReplayService,
		private readonly gameStatus: GameStatusService,
		private readonly modsManager: ModsManagerService,
		private readonly notifs: NotificationsService,
		private readonly api: ApiRunner,
		private readonly sceneService: SceneService,
		private readonly owUtils: OwUtilsService,
		@Optional() private readonly i18n: ILocalizationService,
	) {
		this.init();
	}

	private init() {
		// Handle when app is already running and receives the link
		const href = decodeURIComponent(window.location.href);
		if (href.includes('source=relaunch')) {
			console.debug('[replay-protocol] relaunch source detected, skipping');
			return;
		}
		if (href.includes(REPLAY_IN_GAME_PREFIX)) {
			const reviewId = this.extractReviewId(href);
			if (reviewId) {
				this.handleReplayLink(reviewId);
			}
		}

		// Handle when app is launched via the link
		this.ow.addAppLaunchTriggeredListener(async (info) => {
			if (info?.origin !== 'urlscheme') {
				return;
			}
			const param = decodeURIComponent(info.parameter);
			console.debug('[replay-protocol] app launch triggered', param);
			if (!param.startsWith(REPLAY_IN_GAME_PREFIX)) {
				return;
			}
			const reviewId = this.extractReviewId(param);
			console.debug('[replay-protocol] reviewId', reviewId);
			if (reviewId) {
				await this.handleReplayLink(reviewId);
			}
		});
	}

	private extractReviewId(urlOrParam: string): string | null {
		try {
			const match = urlOrParam.match(/reviewId=([^&]+)/);
			console.debug('[replay-protocol] extractReviewId', urlOrParam, match);
			return match ? match[1] : null;
		} catch {
			return null;
		}
	}

	private async handleReplayLink(reviewId: string) {
		console.debug('[replay-protocol] handling replay link', reviewId);

		// Fetch powerLogKey from API
		let powerLogKey: string | null = null;
		try {
			const review: any = await this.api.callGetApi<any>(`${RETRIEVE_REVIEW_URL}/${reviewId}`);
			console.debug('[replay-protocol] review', review);
			powerLogKey = review?.powerLogKey ?? null;
			console.debug('[replay-protocol] powerLogKey', powerLogKey);
		} catch (e) {
			console.error('[replay-protocol] failed to fetch review', reviewId, e);
			this.showFirestoneNotification(
				'app.replays.in-game-protocol.error.fetch-failed-title',
				'app.replays.in-game-protocol.error.fetch-failed',
			);
			return;
		}

		if (!powerLogKey) {
			console.debug('[replay-protocol] no powerLogKey', reviewId);
			this.showFirestoneNotification(
				'app.replays.in-game-protocol.error.no-power-log-title',
				'app.replays.in-game-protocol.error.no-power-log',
			);
			return;
		}

		const inGame = await this.gameStatus.inGame();
		console.debug('[replay-protocol] inGame', inGame);
		// Check if user is in an active game (Scene = GAMEPLAY) - only when game is running
		if (inGame) {
			console.debug('[replay-protocol] inGame');
			if (this.sceneService?.currentScene$$?.getValue() === SceneMode.GAMEPLAY) {
				console.debug('[replay-protocol] inGame and scene is GAMEPLAY');
				this.showFirestoneNotification(
					'app.replays.in-game-protocol.error.in-game-title',
					'app.replays.in-game-protocol.error.in-game',
				);
				return;
			}
		}

		// Firestone launched, game not launched -> use OS notification
		if (!inGame) {
			console.debug('[replay-protocol] no inGame');
			const modInstalled = this.checkModInstalled();
			const title = 'Firestone';
			const bodyKey = modInstalled
				? 'app.replays.in-game-protocol.os-notification.launch-hearthstone'
				: 'app.replays.in-game-protocol.os-notification.install-mod-then-launch';
			const body = this.i18n?.translateString?.(bodyKey) ?? bodyKey;
			console.debug('[replay-protocol] showOsNotification', title, body);
			this.showOsNotification(title, body);
			return;
		}

		// Game is launched - try to show replay
		const result = await this.inGameReplayService.showReplay(powerLogKey, reviewId);

		if (result === 'started') {
			return;
		}

		// Show appropriate Firestone notification for errors
		this.showFirestoneNotification(
			`app.replays.in-game.error.${result}`,
			`app.replays.in-game.error.${result}`,
			true,
		);
	}

	private checkModInstalled(): boolean {
		const mods = this.modsManager.modsData$$?.value;
		const replayMod = mods?.find((m: any) => m.AssemblyName === 'com.firestoneapp.mods.bepinex.ReplayViewer');
		return !!(replayMod?.Registered && replayMod?.alreadyInstalled);
	}

	private showFirestoneNotification(titleKey: string, textKey: string, useErrorKeys = false) {
		waitForReady(this.notifs).then(() => {
			const title = this.i18n?.translateString?.(titleKey) ?? titleKey;
			const text = this.i18n?.translateString?.(textKey) ?? textKey;
			if (useErrorKeys && title === titleKey) {
				this.notifs.notifyError('Replay error', text || title, 'replay-protocol-error');
			} else {
				this.notifs.notifyError(title, text, 'replay-protocol-error');
			}
		});
	}

	private showOsNotification(title: string, body: string) {
		this.owUtils.showWindowsNotification(title, body);
	}
}
