import { Injectable } from '@angular/core';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { sleep } from '@legacy-import/src/lib/js/services/utils';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';

@Injectable()
export class ModsBootstrapService {
	private inGame$$ = new BehaviorSubject<boolean>(false);

	private ws: WebSocket;

	constructor(private readonly store: AppUiStoreFacadeService, private readonly gameStatus: GameStatusService) {}

	public async init() {
		console.log('[mods-boostrap] Initializing mods services');
		await this.store.initComplete();

		this.gameStatus.onGameExit(() => this.inGame$$.next(false));
		this.gameStatus.onGameStart(() => this.inGame$$.next(true));
		this.inGame$$.pipe(distinctUntilChanged()).subscribe((inGame) => {
			if (inGame) {
				this.connectWebSocket();
			} else {
				this.disconnectWebSocket();
			}
		});

		this.store
			.listenDeckState$((state) => state)
			.pipe(
				filter(() => this.ws?.readyState === this.ws?.OPEN),
				// tap((state) => console.debug('[mods-boostrap] received new state', state)),
				debounceTime(1000),
				distinctUntilChanged(),
				// tap((state) => console.debug('[mods-boostrap] updated state in mods service', state)),
				map(([state]) => JSON.stringify(state)),
				distinctUntilChanged(),
				// tap((state) => console.debug('[mods-boostrap] will send stringified state')),
			)
			.subscribe((state) => {
				this.ws?.send(state);
				// console.debug('[mods-boostrap] sent state to websocket');
			});
	}

	private async connectWebSocket() {
		if (!!this.ws && this.ws.readyState === this.ws?.OPEN) {
			// console.debug('[mods-boostrap] websocket already open');
			return;
		}
		let retriesLeft = 30;
		while (retriesLeft >= 0) {
			try {
				this.ws = new WebSocket('ws://127.0.0.1:9977/firestone-mods');
				console.log('[mods-boostrap] WS client created');
				return;
			} catch (e) {
				// console.debug('[mods-boostrap] could not connect to websocket, retrying', e);
				retriesLeft--;
			}
			await sleep(2000);
		}
	}

	private async disconnectWebSocket() {
		this.ws?.close();
		this.ws = null;
	}
}
