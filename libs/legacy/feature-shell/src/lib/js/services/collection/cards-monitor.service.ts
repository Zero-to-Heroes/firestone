import { EventEmitter, Injectable } from '@angular/core';
import { BoosterType, boosterIdToSetId } from '@firestone-hs/reference-data';
import { sleep } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, filter, tap } from 'rxjs/operators';
import { CollectionCardType } from '../../models/collection/collection-card-type.type';
import { InternalCardInfo } from '../../models/collection/internal-card-info';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { CardPackInfo, PackInfo } from '../../models/memory/pack-info';
import { Events } from '../events.service';
import { dustFor, dustForPremium } from '../hs-utils';
import { NewCardEvent } from '../mainwindow/store/events/collection/new-card-event';
import { NewPackEvent } from '../mainwindow/store/events/collection/new-pack-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import {
	MercenariesReferenceData,
	MercenariesStateBuilderService,
} from '../mercenaries/mercenaries-state-builder.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { groupByFunction } from '../utils';
import { CardNotificationsService } from './card-notifications.service';
import { CollectionManager } from './collection-manager.service';

// Only works when cards are logged in the Achievements.log
@Injectable()
export class CardsMonitorService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private mainWindowStore: BehaviorSubject<[MainWindowState, NavigationState]>;

	private packNotificationQueue = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly cards: CardsFacadeService,
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly collectionManager: CollectionManager,
		private readonly prefs: PreferencesService,
		private readonly notifications: CardNotificationsService,
		private readonly memoryService: MemoryInspectionService,
		private readonly allCards: CardsFacadeService,
		private readonly mercenariesStateBuilder: MercenariesStateBuilderService,
	) {
		this.init();
	}

	private async init() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		window['triggerMemoryUpdate'] = async (cardId: string) => {
			this.packNotificationQueue.next(true);
		};

		setTimeout(() => {
			this.mainWindowStore = this.ow.getMainWindow().mainWindowStoreMerged;
			this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
				const changes: MemoryUpdate = event.data[0];
				if (changes.IsOpeningPack) {
					this.packNotificationQueue.next(true);
				}
			});
		});

		this.packNotificationQueue
			.pipe(
				debounceTime(500),
				filter((info) => info),
				tap((info) => this.triggerMemoryDetection(true)),
			)
			.subscribe();
	}

	/**
	 * The game doesn't log cards received in the Achievements.log anymore.
	 * We might be able to use the Net.log, but it needs to be added to the OW 
	 * config first.
	 * A pack opening looks like this:
	 * D 09:24:45.5861915 Handling card collection modification (collection version 4643): {
		  AmountSeen: 0
		  AssetCardId: 61171
		  Premium: 0
		  Quantity: 1
		}
	 */
	public receiveLogLine(data: string) {
		if (!data?.length) {
			return;
		}

		if (!data.includes('Handling card collection modification')) {
			return;
		}

		this.packNotificationQueue.next(true);
	}

	private async triggerMemoryDetection(process = true) {
		console.log('[cards-monitor] triggerging memory detection');
		const changes: MemoryUpdate = await this.memoryService.getMemoryChanges();
		console.log('[cards-monitor] memoryChanges detection');
		if (!process || !changes) {
			return;
		}

		if (changes.OpenedPack) {
			this.handleNewPack(changes.OpenedPack);
		}
		// Cards received outside of packs
		else if (changes?.NewCards) {
			this.handleNewCards(changes.NewCards, !changes.OpenedPack);
		}
		this.packNotificationQueue.next(false);
	}

	private async handleNewPack(pack: PackInfo) {
		const boosterId = pack.BoosterId;
		if (boosterId === BoosterType.MERCENARIES) {
			// That's pretty ugly - probably should work with reative streams as well here
			await this.mercenariesStateBuilder.loadReferenceData();
			let retriesLeft = 5;
			while (!this.mainWindowStore.value[0]?.mercenaries?.referenceData && retriesLeft >= 0) {
				await sleep(100);
				retriesLeft--;
			}
		}
		// Get the collection as it was before opening cards
		const collection = this.collectionManager.collection$$.getValue();
		const packCards: readonly InternalCardInfo[] = pack.Cards.map((card) => {
			if (boosterId === BoosterType.MERCENARIES) {
				const referenceData = this.mainWindowStore.value[0]?.mercenaries?.referenceData;
				return {
					cardId: this.getLettuceCardId(card, referenceData),
					// No diamond card in pack, so we can leave it like this for now
					// TODO: proper support for diamond / signature cards
					cardType: card.Premium ? 'GOLDEN' : 'NORMAL',
					currencyAmount: card.CurrencyAmount,
					mercenaryCardId: this.getMercenaryCardId(card.MercenaryId, referenceData),
				} as InternalCardInfo;
			} else {
				const cardInCollection = collection.find((c) => c.id === card.CardId);
				return {
					cardId: card.CardId,
					// No diamond card in pack, so we can leave it like this for now
					cardType: card.Premium ? 'GOLDEN' : 'NORMAL',
					isNew:
						!cardInCollection ||
						(card.Premium ? cardInCollection.premiumCount === 0 : cardInCollection.count === 0),
					// TODO: handle the case where two copies of the same card are in the same pack
					isSecondCopy:
						cardInCollection &&
						(card.Premium ? cardInCollection.premiumCount === 1 : cardInCollection.count === 1),
				} as InternalCardInfo;
			}
		});

		const setId = this.cards.getCard(packCards[0].cardId)?.set?.toLowerCase() ?? boosterIdToSetId(boosterId);
		console.log('[cards-monitor] notifying new pack opening', setId, boosterId, packCards);

		this.events.broadcast(Events.NEW_PACK, setId, packCards, boosterId);
		this.stateUpdater.next(new NewPackEvent(setId, boosterId, packCards));

		// Don't show notifs for Merc packs, at least for now.
		// Would showing the total number of coins be interesting? It would feel very
		// spammy I think
		if (boosterId !== BoosterType.MERCENARIES) {
			const groupedBy: { [key: string]: readonly InternalCardInfo[] } = groupByFunction(
				(card: InternalCardInfo) => card.cardId + card.cardType,
			)(packCards);
			for (const data of Object.values(groupedBy)) {
				const cardId = data[0].cardId;
				const type = data[0].cardType;
				const cardInCollection = collection.find((c) => c.id === cardId);
				const existingCount = !cardInCollection
					? 0
					: data[0].cardType === 'GOLDEN'
					? cardInCollection.premiumCount
					: cardInCollection.count;

				for (let i = existingCount; i < existingCount + data.length; i++) {
					this.handleNotification(cardId, type, i + 1, false);
				}
			}
		}
	}

	private getMercenaryCardId(mercenaryId: number, referenceData: MercenariesReferenceData): string {
		if (!referenceData) {
			return null;
		}

		const cardDbfId = referenceData.mercenaries
			.find((merc) => merc.id === mercenaryId)
			?.skins?.find((skin) => skin.isDefaultVariation)?.cardId;
		return this.allCards.getCardFromDbfId(cardDbfId).id;
	}

	private getLettuceCardId(card: CardPackInfo, referenceData: MercenariesReferenceData): string {
		if (!referenceData) {
			return null;
		}
		const cardDbfId = referenceData.mercenaries
			.find((merc) => merc.id === card.MercenaryId)
			?.skins?.find((skin) => skin.artVariationId === card.MercenaryArtVariationId)?.cardId;
		return this.allCards.getCardFromDbfId(cardDbfId).id;
	}

	private async handleNewCards(newCards: readonly CardPackInfo[], showNotifs = true) {
		// Put in place a protection to avoid renotifying the whole initial collection
		if (newCards?.length && newCards.length > 30) {
			console.warn('[card-parser] not processing cards, too many', newCards.length);
			return;
		}

		const groupedBy: { [key: string]: readonly CardPackInfo[] } = groupByFunction(
			(card: CardPackInfo) => card.CardId + card.Premium,
		)(newCards);
		const collection = this.collectionManager.collection$$.getValue();
		for (const data of Object.values(groupedBy)) {
			const cardId = data[0].CardId;
			const type = data[0].Premium ? 'GOLDEN' : 'NORMAL';
			const cardInCollection = collection.find((c) => c.id === cardId);
			const existingCount = data[0].Premium ? cardInCollection.premiumCount : cardInCollection.count;

			for (let i = existingCount; i < existingCount + data.length; i++) {
				this.handleNotification(cardId, type, i + 1, showNotifs);
			}
		}
	}

	private async handleNotification(cardId: string, type: CollectionCardType, newCount: number, showNotifs = true) {
		const prefs = await this.prefs.getPreferences();
		const isDust = this.hasReachedMaxCollectibleOf(cardId, newCount);
		if (prefs.showCardsOutsideOfPacks && showNotifs) {
			if (!isDust) {
				this.notifications.createNewCardToast(cardId, newCount === 2, type);
			} else {
				const dbCard = this.cards.getCard(cardId);
				if (!dbCard) {
					return;
				}
				const dust = type === 'GOLDEN' ? dustForPremium(dbCard?.rarity) : dustFor(dbCard?.rarity);
				this.notifications.createDustToast(dust, 1);
			}
		}
		this.stateUpdater.next(new NewCardEvent(cardId, type, newCount, isDust));
	}

	private hasReachedMaxCollectibleOf(cardId: string, newCount: number): boolean {
		const dbCard = this.cards.getCard(cardId);
		if (!dbCard) {
			console.warn('unknown card', cardId, newCount);
			return false;
		}
		return dbCard.rarity === 'Legendary' ? newCount >= 2 : newCount >= 3;
	}
}
