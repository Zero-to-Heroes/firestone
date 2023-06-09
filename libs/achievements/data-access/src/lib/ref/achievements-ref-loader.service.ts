import { Injectable } from "@angular/core";
import { ApiRunner } from '@firestone/shared/framework/core';
import { HsRefAchiementsData } from "./hs-ref-achievement";

const REF_HS_ACHIEVEMENTS_RETRIEVE_URL = 'https://static.zerotoheroes.com/hearthstone/jsoncards/hs-achievements.json';

@Injectable()
export class AchievementsRefLoaderService {
	constructor(private readonly api: ApiRunner) {}
	
	public async loadRefData(): Promise<HsRefAchiementsData | null> {
		return await this.api.callGetApi<HsRefAchiementsData>(REF_HS_ACHIEVEMENTS_RETRIEVE_URL);
	}
}