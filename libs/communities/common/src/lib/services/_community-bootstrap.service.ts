import { Injectable } from '@angular/core';
import { CommunityJoinService } from './community-join.service';
import { CommunityNavigationService } from './community-navigation.service';

@Injectable()
export class CommunityBootstrapService {
	constructor(
		private readonly init_manage: CommunityJoinService,
		private readonly init_CommunityNavigationService: CommunityNavigationService,
	) {}
}
