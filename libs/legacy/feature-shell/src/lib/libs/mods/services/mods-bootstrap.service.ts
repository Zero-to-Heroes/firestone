import { Injectable } from '@angular/core';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators';

@Injectable()
export class ModsBootstrapService {
	constructor(private readonly store: AppUiStoreFacadeService, private readonly gameStatus: GameStatusService) {}

	public async init() {
		console.log('[mods] Initializing mods services');
		// TODO: the server is only created when the game is running, so we need to handle this properly here

		await this.store.initComplete();

		const ws = new WebSocket('ws://127.0.0.1:9977/firestone-mods');
		console.log('[mods] WS client created');
		this.store
			.listenDeckState$((state) => state)
			.pipe(
				tap((state) => console.debug('[mods] received new state', state)),
				debounceTime(1000),
				distinctUntilChanged(),
				tap((state) => console.debug('[mods] updated state in mods service', state)),
				map(([state]) => JSON.stringify(state)),
				distinctUntilChanged(),
				tap((state) => console.debug('[mods] will send stringified state')),
			)
			.subscribe((state) => {
				ws.send(state);
				console.debug('[mods] sent state to websocket');
			});
	}
}
