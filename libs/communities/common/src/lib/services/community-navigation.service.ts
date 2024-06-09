import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { ComunitiesCategory } from '../models/navigation';

@Injectable()
export class CommunityNavigationService extends AbstractFacadeService<CommunityNavigationService> {
	public category$$: BehaviorSubject<ComunitiesCategory | null>;
	public selectedCommunity$$: BehaviorSubject<string | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CommunityNavigationService', () => !!this.category$$);
	}

	protected override assignSubjects() {
		this.category$$ = this.mainInstance.category$$;
		this.selectedCommunity$$ = this.mainInstance.selectedCommunity$$;
	}

	protected async init() {
		this.category$$ = new BehaviorSubject<ComunitiesCategory | null>('manage');
		this.selectedCommunity$$ = new BehaviorSubject<string | null>(null);
	}
}
