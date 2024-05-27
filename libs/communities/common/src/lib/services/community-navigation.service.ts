import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class CommunityNavigationService extends AbstractFacadeService<CommunityNavigationService> {
	public category$$: BehaviorSubject<string | null>;
	public selectedCommunity$$: BehaviorSubject<string | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CommunityNavigationService', () => !!this.category$$);
	}

	protected override assignSubjects() {
		this.category$$ = this.mainInstance.category$$;
		this.selectedCommunity$$ = this.mainInstance.selectedCommunity$$;
	}

	protected async init() {
		this.category$$ = new BehaviorSubject<string | null>('manage');
		this.selectedCommunity$$ = new BehaviorSubject<string | null>(null);
	}
}
