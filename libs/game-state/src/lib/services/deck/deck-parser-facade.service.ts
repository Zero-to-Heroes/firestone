import { Injectable } from '@angular/core';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject, tap } from 'rxjs';
import { DeckInfo, DeckParserService } from './deck-parser.service';

const eventName = 'current-deck-facade';

@Injectable()
export class DeckParserFacadeService extends AbstractFacadeService<DeckParserFacadeService> {
	public currentDeck$$: BehaviorSubject<DeckInfo | null>;

	private deckParser: DeckParserService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		console.debug('[deck-parser-facade] init constructor');
		super(windowManager, 'DeckParserFacadeService', () => !!this.currentDeck$$);
	}

	protected override assignSubjects() {
		this.currentDeck$$ = this.mainInstance.currentDeck$$;
	}

	protected async init() {
		console.debug('[deck-parser-facade] init 0');
		this.currentDeck$$ = new BehaviorSubject<DeckInfo | null>(null);
		console.debug('[deck-parser-facade] init');
		this.deckParser = AppInjector.get(DeckParserService);

		this.deckParser.currentDeck$$
			.pipe(tap((info) => console.debug('[deck-parser-facade] currentDeck$$', info)))
			.subscribe(this.currentDeck$$);
	}

	protected override async initElectronSubjects() {
		console.debug('[deck-parser-facade] initElectronSubjects');
		this.setupElectronSubject(this.currentDeck$$, eventName);
	}

	// In renderer process
	protected override async createElectronProxy(ipcRenderer: any) {
		console.debug('[deck-parser-facade] createElectronProxy');
		// In renderer process, create proxy subjects that communicate with main process via IPC
		this.currentDeck$$ = new BehaviorSubject<DeckInfo | null>(null);
	}
}
