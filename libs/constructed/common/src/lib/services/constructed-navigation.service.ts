import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ConstructedNavigationService extends AbstractFacadeService<ConstructedNavigationService> {
	public currentView$$: BehaviorSubject<DecktrackerViewType | null>;
	public selectedDeckstring$$: BehaviorSubject<string | null>;
	public selectedConstructedMetaDeck$$: BehaviorSubject<string | null>;
	public selectedConstructedMetaArchetype$$: BehaviorSubject<number | null>;
	public myDecksTodaySelected$$: BehaviorSubject<boolean>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(
			windowManager,
			'ConstructedNavigationService',
			() => !!this.selectedConstructedMetaDeck$$ && !!this.myDecksTodaySelected$$,
		);
	}

	protected override assignSubjects() {
		this.currentView$$ = this.mainInstance.currentView$$;
		this.selectedConstructedMetaDeck$$ = this.mainInstance.selectedConstructedMetaDeck$$;
		this.selectedConstructedMetaArchetype$$ = this.mainInstance.selectedConstructedMetaArchetype$$;
		this.selectedDeckstring$$ = this.mainInstance.selectedDeckstring$$;
		this.myDecksTodaySelected$$ = this.mainInstance.myDecksTodaySelected$$;
	}

	protected async init() {
		this.currentView$$ = new BehaviorSubject<DecktrackerViewType | null>('decks');
		this.selectedDeckstring$$ = new BehaviorSubject<string | null>(null);
		this.selectedConstructedMetaDeck$$ = new BehaviorSubject<string | null>(null);
		this.selectedConstructedMetaArchetype$$ = new BehaviorSubject<number | null>(null);
		this.myDecksTodaySelected$$ = new BehaviorSubject<boolean>(false);
	}

	override async initElectronSubjects() {
		this.setupElectronSubject(this.currentView$$, 'constructed-navigation-current-view');
		this.setupElectronSubject(this.selectedDeckstring$$, 'constructed-navigation-selected-deckstring');
		this.setupElectronSubject(
			this.selectedConstructedMetaDeck$$,
			'constructed-navigation-selected-constructed-meta-deck',
		);
		this.setupElectronSubject(
			this.selectedConstructedMetaArchetype$$,
			'constructed-navigation-selected-constructed-meta-archetype',
		);
	}

	override async createElectronProxy(ipcRenderer: any) {
		this.currentView$$ = new BehaviorSubject<DecktrackerViewType | null>('decks');
		this.selectedDeckstring$$ = new BehaviorSubject<string | null>(null);
		this.selectedConstructedMetaDeck$$ = new BehaviorSubject<string | null>(null);
		this.selectedConstructedMetaArchetype$$ = new BehaviorSubject<number | null>(null);
		this.myDecksTodaySelected$$ = new BehaviorSubject<boolean>(false);
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
