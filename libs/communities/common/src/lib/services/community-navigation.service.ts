import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { ComunitiesCategory } from '../models/navigation';
import { CommunityJoinService } from './community-join.service';

@Injectable()
export class CommunityNavigationService extends AbstractFacadeService<CommunityNavigationService> {
	public category$$: BehaviorSubject<ComunitiesCategory | null>;
	public selectedCommunity$$: BehaviorSubject<string | null>;

	private joinService: CommunityJoinService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CommunityNavigationService', () => !!this.category$$);
	}

	protected override assignSubjects() {
		this.category$$ = this.mainInstance.category$$;
		this.selectedCommunity$$ = this.mainInstance.selectedCommunity$$;
	}

	protected async init() {
		this.joinService = AppInjector.get(CommunityJoinService);
		this.category$$ = new BehaviorSubject<ComunitiesCategory | null>('my-communities');
		this.selectedCommunity$$ = new BehaviorSubject<string | null>(null);

		await waitForReady(this.joinService);
	}

	public changeCategory(category: ComunitiesCategory) {
		this.changeCategoryInternal(category);
	}

	private changeCategoryInternal(category: ComunitiesCategory) {
		this.category$$.next(category);
		this.joinService.joinStatus$$.next(null);
	}
}
