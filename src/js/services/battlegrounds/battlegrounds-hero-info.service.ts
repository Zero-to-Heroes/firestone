import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BattlegroundsHero } from '../../models/battlegrounds/battlegrounds-hero';

const BGS_HEROES_INFO_URL = 'https://static.zerotoheroes.com/hearthstone/data/bgs_heroes_info.json';

@Injectable()
export class BattlegroundsHeroInfoService {
	constructor(private readonly http: HttpClient, private readonly logger: NGXLogger) {}

	public async retrieveHeroInfo(cardIds: readonly string[]): Promise<readonly BattlegroundsHero[]> {
		return new Promise<readonly BattlegroundsHero[]>(async resolve => {
			this.http.get(BGS_HEROES_INFO_URL).subscribe(
				(result: any[]) => {
					this.logger.debug('[bgs-info] retrieved bgs info from CDN', result);
					resolve(result);
				},
				error => {
					this.logger.debug('bgs-info] could not retrieve bgs info from CDN', error);
					resolve(null);
				},
			);
		});
	}
}
