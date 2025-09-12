import { Injectable } from '@angular/core';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { DeckInfo, DeckParserService } from './deck-parser.service';

const eventName = 'current-deck-facade';
@Injectable()
export class DeckParserFacadeService extends AbstractFacadeService<DeckParserFacadeService> {
	public currentDeck$$: BehaviorSubject<DeckInfo | null>;

	private deckParser: DeckParserService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'DeckParserFacadeService', () => !!this.currentDeck$$);
	}

	protected override assignSubjects() {
		this.currentDeck$$ = this.mainInstance.currentDeck$$;
	}

	protected async init() {
		this.currentDeck$$ = new BehaviorSubject<DeckInfo | null>(null);
		this.deckParser = AppInjector.get(DeckParserService);

		this.deckParser.currentDeck$$.subscribe(this.currentDeck$$);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.currentDeck$$, eventName);
	}

	// In renderer process
	protected override async createElectronProxy(ipcRenderer: any) {
		// In renderer process, create proxy subjects that communicate with main process via IPC
		this.currentDeck$$ = new BehaviorSubject<DeckInfo | null>(null);
	}
}
