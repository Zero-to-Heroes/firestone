import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { GameEvent } from '../../models/game-event';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../models/preferences';
import { CardsFacadeService } from '../cards-facade.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { MercenariesOpponentBattleTeamOverlayHandler } from './overlay-handler/mercenaries-opponent-battle-team-overlay-handler';
import { MercenariesPlayerBattleTeamOverlayHandler } from './overlay-handler/mercenaries-player-battle-team-overlay-handler';
import { MercenariesOverlayHandler } from './overlay-handler/_mercenaries-overlay-handler';
import { MercenariesAbilityActivatedParser } from './parser/mercenaries-ability-activated-parser';
import { MercenariesAbilityRevealedParser } from './parser/mercenaries-ability-revealed-parser';
import { MercenariesAbilityUpdatedParser } from './parser/mercenaries-ability-updated-parser';
import { MercenariesCooldownUpdatedParser } from './parser/mercenaries-cooldown-updated-parser';
import { MercenariesEquipmentRevealedParser } from './parser/mercenaries-equipment-revealed-parser';
import { MercenariesEquipmentUpdatedParser } from './parser/mercenaries-equipment-updated-parser';
import { MercenariesGameEndParser } from './parser/mercenaries-game-end-parser';
import { MercenariesHeroDiedParser } from './parser/mercenaries-hero-died-parser';
import { MercenariesHeroRevealedParser } from './parser/mercenaries-hero-revealed-parser';
import { MercenariesHeroUpdatedParser } from './parser/mercenaries-hero-updated-parser';
import { MercenariesMatchMetadataParser } from './parser/mercenaries-match-metadata-parser';
import { MercenariesTeamOpponentManualCloseParser } from './parser/mercenaries-team-opponent-manual-close-parser';
import { MercenariesTeamPlayerManualCloseParser } from './parser/mercenaries-team-player-manual-close-parser';
import { MercenariesZoneChangedParser } from './parser/mercenaries-zone-changed-parser';
import { MercenariesZonePositionChangedParser } from './parser/mercenaries-zone-position-changed-parser';
import { MercenariesParser } from './parser/_mercenaries-parser';

@Injectable()
export class MercenariesStoreService {
	public store$ = new BehaviorSubject<MercenariesBattleState>(null);

	private internalStore$ = new BehaviorSubject<MercenariesBattleState>(null);
	private internalEventSubject$ = new BehaviorSubject<GameEvent>(null);

	private preferences$: Observable<Preferences>;
	private mainWindowState$: Observable<MainWindowState>;

	private parsers: { [eventType: string]: readonly MercenariesParser[] };
	private eventEmitters: ((state: MercenariesBattleState) => void)[] = [];
	private overlayHandlers: MercenariesOverlayHandler[];

	constructor(
		private readonly events: GameEventsEmitterService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly memoryService: MemoryInspectionService,
	) {
		this.init();

		// So that we're sure that all services have been initialized
		setTimeout(() => {
			this.preferences$ = (this.ow.getMainWindow().preferencesEventBus as BehaviorSubject<any>)
				.asObservable()
				.pipe(map((theEvent) => theEvent.preferences as Preferences));
			this.mainWindowState$ = (this.ow.getMainWindow()
				.mainWindowStore as BehaviorSubject<MainWindowState>).asObservable();

			combineLatest(this.internalEventSubject$.asObservable(), this.mainWindowState$)
				.pipe(
					distinctUntilChanged(),
					filter(([event, mainWindowState]) => !!event),
					concatMap(async ([event, mainWindowState]) => await this.processEvent(event, mainWindowState)),
				)
				.subscribe();
			combineLatest(this.preferences$, this.internalStore$.asObservable())
				.pipe(
					distinctUntilChanged(),
					concatMap(async ([prefs, newState]) => await this.emitState(newState, prefs)),
				)
				.subscribe();

			window['battleStateUpdater'] = this.internalEventSubject$;
			window['mercenariesStore'] = this.store$;
		});
	}

	// Maybe find a way to only emit the state each N milliseconds at the most to limit the
	// redraws in the UI
	private async processEvent(event: GameEvent, mainWindowState: MainWindowState): Promise<void> {
		try {
			const battleState = this.internalStore$.value;

			// TODO: have a way to delay some parsers, without causing the whole parser chain to get
			// stuck; Hve getParserFor return two lists, one for immediate processing and the other
			// for delay, and reenqueue the delayed one after a setTimeout
			const parsers = this.getParsersFor(event.type, battleState);
			if (!parsers?.length) {
				return;
			}

			let state = battleState;
			for (const parser of parsers) {
				state = await parser.parse(state, event, mainWindowState);
				// console.debug('[merc-store] updated state', event.type, event, state);
			}
			this.internalStore$.next(state);
		} catch (e) {
			console.error('[mercenaries-store] could not process event', event.type, event, e);
		}
	}

	private async emitState(newState: MercenariesBattleState, preferences: Preferences): Promise<void> {
		this.eventEmitters.forEach((emitter) => emitter(newState));
		await Promise.all(this.overlayHandlers.map((handler) => handler.updateOverlay(newState, preferences)));
	}

	private init() {
		this.events.allEvents.subscribe((event) => this.internalEventSubject$.next(event));
		this.registerParser();
		this.buildEventEmitters();
		this.buildOverlayHandlers();
	}

	private getParsersFor(type: string, battleState: MercenariesBattleState): readonly MercenariesParser[] {
		const candidates = this.parsers[type];
		return candidates?.filter((parser) => parser.applies(battleState));
	}

	private buildEventEmitters() {
		const result = [(state) => this.store$.next(state)];
		this.eventEmitters = result;
	}

	private buildOverlayHandlers() {
		this.overlayHandlers = [
			new MercenariesPlayerBattleTeamOverlayHandler(this.prefs, this.ow),
			new MercenariesOpponentBattleTeamOverlayHandler(this.prefs, this.ow),
		];
	}

	private registerParser() {
		const parsers: readonly MercenariesParser[] = [
			new MercenariesMatchMetadataParser(this.memoryService),
			new MercenariesGameEndParser(),

			new MercenariesHeroRevealedParser(this.allCards),
			new MercenariesHeroUpdatedParser(this.allCards),
			new MercenariesHeroDiedParser(this.allCards),
			new MercenariesAbilityRevealedParser(this.allCards),
			new MercenariesAbilityUpdatedParser(this.allCards),
			new MercenariesAbilityActivatedParser(this.allCards),
			new MercenariesEquipmentRevealedParser(this.allCards),
			new MercenariesEquipmentUpdatedParser(this.allCards),
			new MercenariesCooldownUpdatedParser(this.allCards),
			new MercenariesZoneChangedParser(),
			new MercenariesZonePositionChangedParser(),

			new MercenariesTeamPlayerManualCloseParser(),
			new MercenariesTeamOpponentManualCloseParser(),
		];
		this.parsers = {};
		for (const parser of parsers) {
			if (!this.parsers[parser.eventType()]) {
				this.parsers[parser.eventType()] = [];
			}
			this.parsers[parser.eventType()] = [...this.parsers[parser.eventType()], parser];
		}
	}
}
