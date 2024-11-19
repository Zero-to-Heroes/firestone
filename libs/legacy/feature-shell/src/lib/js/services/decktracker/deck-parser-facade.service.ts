import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { DeckInfo, DeckParserService } from './deck-parser.service';

@Injectable()
export class DeckParserFacadeService extends AbstractFacadeService<DeckParserFacadeService> {
	public currentDeck$$: SubscriberAwareBehaviorSubject<DeckInfo | null>;

	private deckParser: DeckParserService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'DeckParserFacadeService', () => !!this.currentDeck$$);
	}

	protected override assignSubjects() {
		this.currentDeck$$ = this.mainInstance.currentDeck$$;
	}

	protected async init() {
		this.currentDeck$$ = new SubscriberAwareBehaviorSubject<DeckInfo | null>(null);
		this.deckParser = AppInjector.get(DeckParserService);

		this.currentDeck$$.onFirstSubscribe(async () => {
			this.deckParser.currentDeck$$.subscribe(this.currentDeck$$);
		});
	}
}
