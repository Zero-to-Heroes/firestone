import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ConstructedNavigationService extends AbstractFacadeService<ConstructedNavigationService> {
	public currentView$$: BehaviorSubject<DecktrackerViewType | null>;
	public selectedConstructedMetaDeck$$: BehaviorSubject<string | null>;
	public selectedConstructedMetaArchetype$$: BehaviorSubject<number | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedNavigationService', () => !!this.selectedConstructedMetaDeck$$);
	}

	protected override assignSubjects() {
		this.currentView$$ = this.mainInstance.currentView$$;
		this.selectedConstructedMetaDeck$$ = this.mainInstance.selectedConstructedMetaDeck$$;
		this.selectedConstructedMetaArchetype$$ = this.mainInstance.selectedConstructedMetaArchetype$$;
	}

	protected async init() {
		this.currentView$$ = new BehaviorSubject<DecktrackerViewType | null>(null);
		this.selectedConstructedMetaDeck$$ = new BehaviorSubject<string | null>(null);
		this.selectedConstructedMetaArchetype$$ = new BehaviorSubject<number | null>(null);
	}
}

export type DecktrackerViewType =
	| 'decks'
	| 'ladder-stats'
	| 'ladder-ranking'
	| 'replays'
	| 'deck-details'
	| 'constructed-meta-decks'
	| 'constructed-meta-deck-details'
	| 'constructed-meta-archetypes'
	| 'constructed-meta-archetype-details'
	| 'constructed-deckbuilder';
