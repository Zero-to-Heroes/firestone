import { Injectable } from '@angular/core';
import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { BehaviorSubject, combineLatest, map, of, switchMap, tap } from 'rxjs';

@Injectable()
export class PresenceManagerService {
	public presence$$ = new BehaviorSubject<Presence | null>(null);

	constructor(private readonly prefs: PreferencesService, private readonly gameStatus: GameStatusService) {
		this.init();
	}

	private async init() {
		await this.prefs.isReady();
		await this.gameStatus.isReady();

		this.prefs
			.preferences$((prefs) => prefs.discordRichPresence)
			.pipe(
				switchMap(([useRichPresence]) => {
					console.debug('[presence] new useRichPresence', useRichPresence);
					return !useRichPresence ? of({ enabled: false }) : this.buildPresence();
				}),
				tap((update) => console.debug('[presence] new update', update)),
			)
			.subscribe(async (newPresence) => {
				console.debug('[presence] new presence', newPresence);
				this.presence$$.next(newPresence);
			});
	}

	private buildPresence() {
		return combineLatest([this.gameStatus.inGame$$]).pipe(
			map(([inGame]) => ({
				enabled: true,
				inGame: inGame ?? false,
			})),
		);
	}
}

export interface Presence {
	readonly enabled: boolean;
	readonly inGame?: boolean;
}
