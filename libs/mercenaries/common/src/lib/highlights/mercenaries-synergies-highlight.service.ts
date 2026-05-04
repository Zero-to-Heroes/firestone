import { Injectable } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, CardsFacadeService, WindowManagerService } from '@firestone/shared/framework/core';

// This doesn't work in electron, we would need to serialize primitives, not functions
@Injectable()
export class MercenariesSynergiesHighlightService extends AbstractFacadeService<MercenariesSynergiesHighlightService> {
	public highlightSubject$$: SubscriberAwareBehaviorSubject<HighlightSelector | null>;

	private readonly allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MercenariesSynergiesHighlightService', () => !!this.highlightSubject$$);
	}

	protected override assignSubjects() {
		this.highlightSubject$$ = this.mainInstance.highlightSubject$$;
	}

	protected override init() {
		this.highlightSubject$$ = new SubscriberAwareBehaviorSubject<HighlightSelector | null>(null);
	}

	protected override initElectronSubjects() {
		this.setupElectronSubject(this.highlightSubject$$, 'MercenariesSynergiesHighlightService-highlightSubject');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.highlightSubject$$ = new SubscriberAwareBehaviorSubject<HighlightSelector | null>(null);
	}

	protected override async initElectronMainProcess(): Promise<void> {
		// this.registerMainProcessMethod('selectCardIdInternal', (cardId: string) => this.selectCardIdInternal(cardId));
		// this.registerMainProcessMethod('unselectCardIdInternal', () => this.unselectCardIdInternal());
	}

	public selectCardId(cardId: string) {
		// 	if (!cardId) {
		// 		return;
		// 	}
		// 	this.callOnMainProcess('selectCardIdInternal', cardId);
		// }
		// private selectCardIdInternal(cardId: string) {
		// 	const selector: HighlightSelector = buildSelector(cardId, this.allCards);
		// 	this.highlightSubject$$.next(selector);
	}

	public unselectCardId() {
		// this.highlightSubject.next((card: ReferenceCard) => false);
	}
}

export type HighlightSelector = (card: ReferenceCard) => boolean;
