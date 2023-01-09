import { Injectable } from '@angular/core';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { sleep } from '@legacy-import/src/lib/js/services/utils';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';

@Injectable()
export class ModsBootstrapService {
	private inGame$$ = new BehaviorSubject<boolean>(false);

	private ws: WebSocket;

	constructor(private readonly store: AppUiStoreFacadeService, private readonly gameStatus: GameStatusService) {}

	public async init() {
		console.log('[mods] Initializing mods services');
		await this.store.initComplete();

		this.gameStatus.onGameExit(() => this.inGame$$.next(false));
		this.gameStatus.onGameStart(() => this.inGame$$.next(true));
		this.inGame$$.pipe(distinctUntilChanged()).subscribe((inGame) => {
			if (inGame) {
				this.connectModWebSocket();
			} else {
				this.disconnectModWebSocket();
			}
		});

		this.store
			.listenDeckState$((state) => state)
			.pipe(
				filter(() => this.ws?.readyState === this.ws?.OPEN),
				tap((state) => console.debug('[mods] received new state', state)),
				debounceTime(1000),
				distinctUntilChanged(),
				tap((state) => console.debug('[mods] updated state in mods service', state)),
				map(([state]) => JSON.stringify(state)),
				distinctUntilChanged(),
				tap((state) => console.debug('[mods] will send stringified state')),
			)
			.subscribe((state) => {
				this.ws?.send(state);
				console.debug('[mods] sent state to websocket');
			});
	}

	private async connectModWebSocket() {
		if (!!this.ws && this.ws.readyState === this.ws?.OPEN) {
			console.debug('[mods] websocket already open');
			return;
		}
		let retriesLeft = 30;
		while (retriesLeft >= 0) {
			try {
				this.ws = new WebSocket('ws://127.0.0.1:9977/firestone-mods');
				console.log('[mods] WS client created');
				return;
			} catch (e) {
				console.debug('[mods] could not connect to websocket, retrying', e);
				retriesLeft--;
			}
			await sleep(2000);
		}
	}

	private async disconnectModWebSocket() {
		this.ws?.close();
		this.ws = null;
	}
}
