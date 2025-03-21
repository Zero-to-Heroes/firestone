import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GameConnectionService extends AbstractFacadeService<GameConnectionService> {
	public currentGameServerInfo$$: BehaviorSubject<GameServerInfo | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'GameConnectionService', () => !!this.currentGameServerInfo$$);
	}

	protected override assignSubjects() {
		this.currentGameServerInfo$$ = this.mainInstance.currentGameServerInfo$$;
	}

	protected async init() {
		this.currentGameServerInfo$$ = new BehaviorSubject<GameServerInfo | null>(null);
	}

	public updateGameServerInfo(address: string, port: number) {
		this.mainInstance.updateGameServerInfoInternal(address, port);
	}
	private updateGameServerInfoInternal(address: string, port: number) {
		const info: GameServerInfo = { address, port };
		console.debug('[game-connection] updating game server info', info);
		this.currentGameServerInfo$$.next(info);
	}
}

export interface GameServerInfo {
	readonly address: string;
	readonly port: number;
}
