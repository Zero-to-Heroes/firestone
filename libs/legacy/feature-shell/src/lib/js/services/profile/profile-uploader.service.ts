import { Injectable } from '@angular/core';
import { InternalProfileAchievementsService } from './internal/internal-profile-achievements.service';
import { InternalProfileBattlegroundsService } from './internal/internal-profile-battlegrounds.service';
import { InternalProfileCollectionService } from './internal/internal-profile-collection.service';

export const PROFILE_UPDATE_URL = 'https://7n2xgqrutsr3by2n2wncsi25ou0mttjp.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ProfileUploaderService {
	constructor(
		private readonly init_InternalCollection: InternalProfileCollectionService,
		private readonly init_InternalAchievements: InternalProfileAchievementsService,
		private readonly init_InternalBattlegrounds: InternalProfileBattlegroundsService,
	) {}
}
