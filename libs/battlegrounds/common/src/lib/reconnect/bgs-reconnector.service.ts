import { Injectable } from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { GameConnectionService, GameEventsFacadeService, GameStateFacadeService } from '@firestone/game-state';
import { AccountService } from '@firestone/profile/common';
import { OwNotificationsService, PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, tap } from 'rxjs';
import { BgsStateFacadeService } from '../services/bgs-state-facade.service';
import { BgsReconnectorPluginService } from './bgs-reconnector-plugin.service';

@Injectable({ providedIn: 'root' })
export class BgsReconnectorService extends AbstractFacadeService<BgsReconnectorService> {
	public status$$: BehaviorSubject<Status>;

	private plugin: BgsReconnectorPluginService;
	private gameConnection: GameConnectionService;
	private prefs: PreferencesService;
	private account: AccountService;
	private bgState: BgsStateFacadeService;
	private gameState: GameStateFacadeService;
	private gameEvents: GameEventsFacadeService;
	private notifs: OwNotificationsService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsReconnectorService', () => !!this.status$$);
	}

	protected override assignSubjects() {
		this.status$$ = this.mainInstance.status$$;
	}

	protected async init() {
		this.status$$ = new BehaviorSubject<Status>('CONNECTED');
		this.plugin = AppInjector.get(BgsReconnectorPluginService);
		this.gameConnection = AppInjector.get(GameConnectionService);
		this.prefs = AppInjector.get(PreferencesService);
		this.account = AppInjector.get(AccountService);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.bgState = AppInjector.get(BgsStateFacadeService);
		this.gameEvents = AppInjector.get(GameEventsFacadeService);
		this.notifs = AppInjector.get(OwNotificationsService);

		await waitForReady(this.prefs, this.account, this.bgState, this.gameState);

		const phase$ = this.bgState.gameState$$.pipe(
			filter((state) => !!state?.inGame && !!state.currentGame),
			map((state) => state?.currentGame.phase),
			tap((phase) => console.debug('[bgs-reconnector] phase', phase)),
			distinctUntilChanged(),
		);
		phase$.subscribe(async (phase) => {
			const inCombat = phase === 'combat';
			console.debug('[bgs-reconnector] considering reconnect', inCombat);
			if (!inCombat) {
				return;
			}

			const isGameInReconnect = this.gameState.gameState$$.value?.reconnectOngoing;
			if (isGameInReconnect) {
				return;
			}

			const prefs = await this.prefs.getPreferences();
			const region = this.account.region$$.value;
			const shouldReconnect =
				prefs.bgsReconnectorEnabled &&
				region === BnetRegion.REGION_CN &&
				prefs.bgsReconnectorAutoReconnect &&
				!prefs.bgsReconnectorAutoReconnectWaitAfterBoards;
			console.debug('[bgs-reconnector] should reconnect?', shouldReconnect, inCombat, prefs);
			if (shouldReconnect) {
				console.log('[bgs-reconnector] reconnecting');
				const result = await this.reconnect();
				if (result === 'Not elevated') {
					console.warn('[bgs-reconnector] not elevated, showing error message');
					this.notifs.notifyError(
						'Could not reconnect',
						'You need to run Overwolf as an administrator to enable the reconnect feature',
						'bgs-reconnector',
					);
				}
			}
		});

		const inCombatAfterBoards$ = this.gameEvents.allEvents.pipe(
			filter((event) => event.type === 'BATTLEGROUNDS_PLAYER_BOARD'),
		);
		inCombatAfterBoards$.subscribe(async (inCombat) => {
			const isGameInReconnect = this.gameState.gameState$$.value?.reconnectOngoing;
			if (isGameInReconnect) {
				return;
			}

			const prefs = await this.prefs.getPreferences();
			const region = this.account.region$$.value;
			const shouldReconnect =
				inCombat &&
				prefs.bgsReconnectorEnabled &&
				region === BnetRegion.REGION_CN &&
				prefs.bgsReconnectorAutoReconnect &&
				prefs.bgsReconnectorAutoReconnectWaitAfterBoards;
			console.debug('[bgs-reconnector] should reconnect after boards?', shouldReconnect, inCombat, prefs);
			if (shouldReconnect) {
				console.log('[bgs-reconnector] reconnecting after boards');
				const result = await this.reconnect();
				if (result === 'Not elevated') {
					console.warn('[bgs-reconnector] not elevated, showing error message');
					this.notifs.notifyError(
						'Could not reconnect',
						'You need to run Overwolf as an administrator to enable the reconnect feature',
						'bgs-reconnector',
					);
				}
			}
		});

		this.gameState.gameState$$.pipe(map((state) => state?.reconnectOngoing)).subscribe(async (reconnectOngoing) => {
			if (reconnectOngoing) {
				this.status$$.next('RECONNECTING');
			} else {
				this.status$$.next('CONNECTED');
			}
		});
	}

	public async reconnect() {
		return this.mainInstance.reconnectInternal();
	}
	private async reconnectInternal() {
		this.status$$.next('RECONNECTING');
		await waitForReady(this.gameConnection);

		const plugin = await this.plugin.getPlugin();
		const remoteInfo = this.gameConnection.currentGameServerInfo$$.value;
		console.debug('[bgs-reconnector] current remote info', remoteInfo);
		if (!remoteInfo) {
			console.warn('[bgs-reconnector] no remote info found, not reconnecting');
			return;
		}
		return new Promise<string>((resolve) => {
			plugin.triggerReconnect(remoteInfo.address, remoteInfo.port, (result: string) => {
				console.log('[bgs-reconnector] reconnection result', result);
				resolve(result);
			});
		});
	}
}

export type Status = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
