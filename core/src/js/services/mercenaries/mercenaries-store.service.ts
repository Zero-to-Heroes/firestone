import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { GameEvent } from '../../models/game-event';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../cards-facade.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { MercenariesHeroRevealedParser } from './parser/mercenaries-hero-revealed-parser';
import { MercenariesHeroUpdatedParser } from './parser/mercenaries-hero-updated-parser';
import { MercenariesMatchMetadataParser } from './parser/mercenaries-match-metadata-parser';
import { MercenariesParser } from './parser/_mercenaries-parser';

@Injectable()
export class MercenariesStoreService {
	private store = new BehaviorSubject<MercenariesBattleState>(null);
	private internalEventSubject = new BehaviorSubject<GameEvent>(null);

	private mainWindowState: MainWindowState;
	private battleState: MercenariesBattleState = new MercenariesBattleState();
	private parsers: { [eventType: string]: readonly MercenariesParser[] };

	constructor(private readonly events: GameEventsEmitterService, private readonly allCards: CardsFacadeService) {
		this.init();
		this.internalEventSubject
			.asObservable()
			.pipe(
				distinctUntilChanged(),
				filter((event) => !!event),
				map(async (event) => await this.processEvent(event, this.battleState)),
			)
			.subscribe(async (battleStatePromise: Promise<MercenariesBattleState>) => {
				this.store.next(await battleStatePromise);
			});

		const mainWindowStoreEmitter: BehaviorSubject<MainWindowState> = window['mainWindowStore'];
		mainWindowStoreEmitter.subscribe((newState) => {
			this.mainWindowState = newState;
		});
	}

	// Maybe find a way to only emit the state each N milliseconds at the most to limit the
	// redraws in the UI
	private async processEvent(event: GameEvent, battleState: MercenariesBattleState): Promise<MercenariesBattleState> {
		const parsers = this.getParsersFor(event.type, battleState);
		if (!parsers?.length) {
			return battleState;
		}

		let state = battleState;
		for (const parser of parsers) {
			state = await parser.parse(battleState, event, this.mainWindowState);
		}
		return state;
	}

	private init() {
		this.events.allEvents.subscribe((event) => this.internalEventSubject.next(event));
		this.registerParser();
	}

	private getParsersFor(type: string, battleState: MercenariesBattleState): readonly MercenariesParser[] {
		const candidates = this.parsers[type];
		return candidates.filter((parser) => parser.applies(battleState));
	}

	private registerParser() {
		const parsers: readonly MercenariesParser[] = [
			new MercenariesMatchMetadataParser(),
			new MercenariesHeroRevealedParser(this.allCards),
			new MercenariesHeroUpdatedParser(this.allCards),
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

// let i = 0;

// const test = async () => {
// 	const internalEventSubject = new BehaviorSubject<string>(null);
// 	internalEventSubject
// 		.asObservable()
// 		.pipe(
// 			distinctUntilChanged(),
// 			filter((event) => !!event),
// 			map(async (event) => await doSomething()),
// 		)
// 		.subscribe(async (info) => console.log(await info));
// 	for (let j = 0; j < 50; j++) {
// 		internalEventSubject.next('glut' + j);
// 	}
// };

// const doSomething = async () => {
// 	await sleep(500 * Math.random());
// 	return 'hop' + i++;
// };
// test();
