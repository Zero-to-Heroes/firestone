import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ConstructedNavigationService extends AbstractFacadeService<ConstructedNavigationService> {
	public selectedConstructedMetaDeck$$: BehaviorSubject<string | null>;
	public selectedConstructedMetaArchetype$$: BehaviorSubject<number | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedNavigationService', () => !!this.selectedConstructedMetaDeck$$);
	}

	protected override assignSubjects() {
		this.selectedConstructedMetaDeck$$ = this.mainInstance.selectedConstructedMetaDeck$$;
		this.selectedConstructedMetaArchetype$$ = this.mainInstance.selectedConstructedMetaArchetype$$;
	}

	protected async init() {
		this.selectedConstructedMetaDeck$$ = new BehaviorSubject<string | null>(null);
		this.selectedConstructedMetaArchetype$$ = new BehaviorSubject<number | null>(null);
	}
}
