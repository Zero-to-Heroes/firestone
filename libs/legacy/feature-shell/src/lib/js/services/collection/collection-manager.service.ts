import { Injectable } from '@angular/core';
import { PackResult } from '@firestone-hs/user-packs';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';

import { ICollectionManagerService } from '@firestone/collection/common';
import { PackInfo } from '@firestone/collection/view';
import { Card, CardBack, MemoryInspectionService, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { PackStatsService } from '../../../libs/packs/services/pack-stats.service';
import { Coin } from '../../models/coin';
import { Events } from '../events.service';
import { CollectionStorageService } from './collection-storage.service';
import { AllTimeBoostersInternalService } from './details/all-time-boosters';
import { BgHeroSkinsInternalService } from './details/bg-hero-skins';
import { CardBacksInternalService } from './details/card-backs';
import { CardsInternalService } from './details/cards';
import { CoinsInternalService } from './details/coins';

@Injectable()
export class CollectionManager extends AbstractFacadeService<CollectionManager> implements ICollectionManagerService {
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

	private events: Events;
	private api: ApiRunner;
	private allCards: CardsFacadeService;
	private memoryReading: MemoryInspectionService;
	private db: CollectionStorageService;
	private scene: SceneService;
	private memoryUpdates: MemoryUpdatesService;
	private packStatsService: PackStatsService;
	private gameStatus: GameStatusService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CollectionManager', () => !!this.collection$$);
	}

	protected override assignSubjects() {
		this.collection$$ = this.mainInstance.collection$$;
		this.cardBacks$$ = this.mainInstance.cardBacks$$;
		this.bgHeroSkins$$ = this.mainInstance.bgHeroSkins$$;
		this.allTimeBoosters$$ = this.mainInstance.allTimeBoosters$$;
		this.coins$$ = this.mainInstance.coins$$;
	}

	protected async init() {
		this.events = AppInjector.get(Events);
		this.api = AppInjector.get(ApiRunner);
		this.allCards = AppInjector.get(CardsFacadeService);
		this.memoryReading = AppInjector.get(MemoryInspectionService);
		this.db = AppInjector.get(CollectionStorageService);
		this.scene = AppInjector.get(SceneService);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);
		this.packStatsService = AppInjector.get(PackStatsService);
		this.gameStatus = AppInjector.get(GameStatusService);

		this.cardsIS = new CardsInternalService(
			this.events,
			this.scene,
			this.memoryUpdates,
			this.gameStatus,
			this.memoryReading,
			this.db,
		);
		this.cardBacksIS = new CardBacksInternalService(
			this.events,
			this.scene,
			this.memoryUpdates,
			this.gameStatus,
			this.memoryReading,
			this.db,
			this.api,
		);
		this.bgHeroSkinsIS = new BgHeroSkinsInternalService(
			this.events,
			this.scene,
			this.memoryUpdates,
			this.gameStatus,
			this.memoryReading,
			this.db,
		);
		this.allTimeBoostersIS = new AllTimeBoostersInternalService(
			this.events,
			this.scene,
			this.memoryUpdates,
			this.gameStatus,
			this.memoryReading,
			this.db,
		);
		this.coinsIS = new CoinsInternalService(
			this.events,
			this.scene,
			this.memoryUpdates,
			this.gameStatus,
			this.memoryReading,
			this.db,
			this.allCards,
		);

		this.collection$$ = this.cardsIS.collection$$;
		this.cardBacks$$ = this.cardBacksIS.collection$$;
		this.bgHeroSkins$$ = this.bgHeroSkinsIS.collection$$;
		this.allTimeBoosters$$ = this.allTimeBoostersIS.collection$$;
		this.coins$$ = this.coinsIS.collection$$;
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
