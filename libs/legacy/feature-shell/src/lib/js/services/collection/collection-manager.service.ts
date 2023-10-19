import { Injectable } from '@angular/core';
import { PackResult } from '@firestone-hs/user-packs';
import { ApiRunner, CardsFacadeService } from '@firestone/shared/framework/core';

import { PackInfo } from '@firestone/collection/view';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { PackStatsService } from '../../../libs/packs/services/pack-stats.service';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { Coin } from '../../models/coin';
import { Events } from '../events.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { CollectionStorageService } from './collection-storage.service';
import { AllTimeBoostersInternalService } from './details/all-time-boosters';
import { BgHeroSkinsInternalService } from './details/bg-hero-skins';
import { CardBacksInternalService } from './details/card-backs';
import { CardsInternalService } from './details/cards';
import { CoinsInternalService } from './details/coins';

@Injectable()
export class CollectionManager {
	public static EPIC_PITY_TIMER = 10;
	public static LEGENDARY_PITY_TIMER = 40;

	public collection$$: SubscriberAwareBehaviorSubject<readonly Card[]>;
	public cardBacks$$: SubscriberAwareBehaviorSubject<readonly CardBack[]>;
	public bgHeroSkins$$: SubscriberAwareBehaviorSubject<readonly number[]>;
	public allTimeBoosters$$: SubscriberAwareBehaviorSubject<readonly PackInfo[]>;
	public coins$$: SubscriberAwareBehaviorSubject<readonly Coin[]>;

	private cardsIS: CardsInternalService;
	private cardBacksIS: CardBacksInternalService;
	private bgHeroSkinsIS: BgHeroSkinsInternalService;
	private allTimeBoostersIS: AllTimeBoostersInternalService;
	private coinsIS: CoinsInternalService;

	constructor(
		readonly events: Events,
		readonly api: ApiRunner,
		readonly allCards: CardsFacadeService,
		readonly memoryReading: MemoryInspectionService,
		readonly db: CollectionStorageService,
		// private readonly setsService: SetsService,
		private readonly packStatsService: PackStatsService,
	) {
		this.cardsIS = new CardsInternalService(events, memoryReading, db);
		this.cardBacksIS = new CardBacksInternalService(events, memoryReading, db, api);
		this.bgHeroSkinsIS = new BgHeroSkinsInternalService(events, memoryReading, db);
		this.allTimeBoostersIS = new AllTimeBoostersInternalService(events, memoryReading, db);
		this.coinsIS = new CoinsInternalService(events, memoryReading, db, this.allCards);

		this.collection$$ = this.cardsIS.collection$$;
		this.cardBacks$$ = this.cardBacksIS.collection$$;
		this.bgHeroSkins$$ = this.bgHeroSkinsIS.collection$$;
		this.allTimeBoosters$$ = this.allTimeBoostersIS.collection$$;
		this.coins$$ = this.coinsIS.collection$$;
		window['collectionManager'] = this;
	}

	public async getPackStats(): Promise<readonly PackResult[]> {
		return this.packStatsService.getPackStats();
	}

	// type is NORMAL or GOLDEN
	public inCollection(collection: Card[], cardId: string): Card {
		for (const card of collection) {
			if (card.id === cardId) {
				return card;
			}
		}
		return null;
	}
}
