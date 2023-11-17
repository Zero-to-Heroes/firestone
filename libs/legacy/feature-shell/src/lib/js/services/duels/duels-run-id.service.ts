import { Injectable } from '@angular/core';
import { isSignatureTreasure } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { isDuels } from '../duels/duels-utils';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

@Injectable()
export class DuelsRunIdService {
	public lastDuelsGame$ = new BehaviorSubject<GameStat>(null);

	constructor(private readonly store: AppUiStoreFacadeService) {
		this.initDuelsRunIdObservable();
	}

	private async initDuelsRunIdObservable() {
		await this.store.initComplete();

		this.store
			.gameStats$()
			.pipe(
				filter((stats) => !!stats?.length),
				map((stats) => stats?.filter((s) => isDuels(s.gameMode)) ?? []),
				map((stats) => stats[0]),
				filter((latestDuelsMatch) => !!latestDuelsMatch),
				distinctUntilChanged(),
				startWith(null),
			)
			.subscribe(this.lastDuelsGame$);
	}
}

export const findSignatureTreasure = (deckList: readonly (string | number)[], allCards: CardsFacadeService): string => {
	return deckList?.map((cardId) => allCards.getCard(cardId)).find((card) => isSignatureTreasure(card?.id))?.id;
};
