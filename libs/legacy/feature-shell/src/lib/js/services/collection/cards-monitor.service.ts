import { EventEmitter, Injectable } from '@angular/core';
import { BoosterType, boosterIdToSetId } from '@firestone-hs/reference-data';
import { CATCH_UP_PACK_IDS } from '@firestone/collection/view';
import { CardPackInfo, MemoryInspectionService, MemoryUpdate, MemoryUpdatesService, PackInfo } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, filter, tap } from 'rxjs/operators';
import { CollectionCardType } from '../../models/collection/collection-card-type.type';
import { InternalCardInfo } from '../../models/collection/internal-card-info';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { Events } from '../events.service';
import { NewPackEvent } from '../mainwindow/store/events/collection/new-pack-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import {
	MercenariesReferenceData,
	MercenariesReferenceDataService,
} from '../mercenaries/mercenaries-reference-data.service';
import { groupByFunction } from '../utils';
import { CardNotificationsService } from './card-notifications.service';
import { CollectionManager } from './collection-manager.service';
import { dustFor } from './collection-utils';

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
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
		private readonly memoryUpdates: MemoryUpdatesService,
	) {
		this.init();
	}

	private async init() {
		await sleep(1);
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.mainWindowStore = this.ow.getMainWindow().mainWindowStoreMerged;
		this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
			if (changes.IsOpeningPack) {
				this.packNotificationQueue.next(true);
			}
		});
		this.packNotificationQueue
			.pipe(
				filter((info) => info),
				debounceTime(500),
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
		const changes: MemoryUpdate = await this.memoryService.getMemoryChanges();
		console.debug('[cards-monitor] memoryChanges detection', changes);
		if (!process || !changes) {
			return;
		}

		// When opening multiple catch-up packs, we don't go through the mass open packs flow
		if (!!changes.MassOpenedPacks?.length || changes.OpenedPacks?.length > 1) {
			const packs = changes.MassOpenedPacks?.length > 0 ? changes.MassOpenedPacks : changes.OpenedPacks;
			const allCards = (
				await Promise.all(packs.flatMap((pack) => this.handleNewPack(pack, { skipPlayerInput: true })))
			).flat();
			console.debug('[cards-monitor] handling mass pack opening', allCards);
			// Only show info for total dust, and new epic / legs
			const totalDustValues = allCards
				.filter((card) => !card.isNew && !card.isSecondCopy)
				.map((card) => dustFor(this.cards.getCard(card.cardId)?.rarity, card.cardType));
			const totalDust = totalDustValues.reduce((a, b) => a + b, 0);
			const newCards = allCards
				.filter((card) => card.isNew || card.isSecondCopy)
				.filter(
					(card) =>
						['legendary', 'epic'].includes(this.cards.getCard(card.cardId)?.rarity?.toLowerCase()) ||
						card.cardType !== 'NORMAL',
				);
			console.debug('[cards-monitor] sending notifs for new cards', newCards);
			this.notifications.createDustToast(totalDust, totalDustValues.length);
			for (const card of newCards) {
				this.notifications.createNewCardToast(card.cardId, card.isSecondCopy, card.cardType);
			}
		} else if (changes.OpenedPacks?.length === 1) {
			for (const pack of changes.OpenedPacks) {
				await this.handleNewPack(pack, {
					skipPlayerInput: isCatchupPack(pack.BoosterId),
					showNotifs: isCatchupPack(pack.BoosterId),
				});
			}
		}
		// Cards received outside of packs
		else if (changes?.NewCards) {
			this.handleNewCards(changes.NewCards, !changes.OpenedPacks?.length);
		}
		this.packNotificationQueue.next(false);
	}

	private async handleNewPack(pack: PackInfo, options: { skipPlayerInput?: boolean; showNotifs?: boolean } = {}) {
		console.debug('[cards-monitor] handling new pack', pack);
		const boosterId = pack.BoosterId;
		// Get the collection as it was before opening cards
		const collection = await this.collectionManager.collection$$.getValueWithInit();
		const mercRefData =
			boosterId === BoosterType.MERCENARIES
				? await this.mercenariesReferenceData.referenceData$$.getValueWithInit()
				: null;
		const packCards: readonly InternalCardInfo[] = pack.Cards.map((card) => {
			if (boosterId === BoosterType.MERCENARIES) {
				return {
					cardId: this.getLettuceCardId(card, mercRefData),
					// No diamond card in pack, so we can leave it like this for now
					// TODO: proper support for diamond / signature cards
					cardType: cardPremiumToCardType(card.Premium),
					currencyAmount: card.CurrencyAmount,
					mercenaryCardId: this.getMercenaryCardId(card.MercenaryId, mercRefData),
				} as InternalCardInfo;
			} else {
				const cardInCollection = collection.find((c) => c.id === card.CardId);
				return {
					cardId: card.CardId,
					// No diamond card in pack, so we can leave it like this for now
					cardType: cardPremiumToCardType(card.Premium),
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

		const setId = boosterIdToSetId(boosterId) || this.cards.getCard(packCards[0]?.cardId)?.set?.toLowerCase();
		console.debug('[cards-monitor] notifying new pack opening', setId, boosterId, packCards);

		this.events.broadcast(Events.NEW_PACK, setId, packCards, boosterId, options.skipPlayerInput);
		this.stateUpdater.next(new NewPackEvent(setId, boosterId, packCards));

		// Don't show notifs for Merc packs, at least for now.
		// Would showing the total number of coins be interesting? It would feel very
		// spammy I think
		if (boosterId !== BoosterType.MERCENARIES && options?.showNotifs) {
			// Only show info for total dust, and new epic / legs
			const totalDustValues = packCards
				.filter((card) => !card.isNew && !card.isSecondCopy)
				.map((card) => dustFor(this.cards.getCard(card.cardId)?.rarity, card.cardType));
			const totalDust = totalDustValues.reduce((a, b) => a + b, 0);
			const newCards = packCards
				.filter((card) => card.isNew || card.isSecondCopy)
				.filter(
					(card) =>
						['legendary', 'epic'].includes(this.cards.getCard(card.cardId)?.rarity?.toLowerCase()) ||
						card.cardType !== 'NORMAL',
				);
			console.debug('[cards-monitor] sending notifs for new cards and dust', totalDust, newCards);
			this.notifications.createDustToast(totalDust, totalDustValues.length);
			for (const card of newCards) {
				this.notifications.createNewCardToast(card.cardId, card.isSecondCopy, card.cardType);
			}

			// const groupedBy: { [key: string]: readonly InternalCardInfo[] } = groupByFunction(
			// 	(card: InternalCardInfo) => card.cardId + card.cardType,
			// )(packCards);
			// for (const data of Object.values(groupedBy)) {
			// 	const cardId = data[0].cardId;
			// 	const type = data[0].cardType;
			// 	const cardInCollection = collection.find((c) => c.id === cardId);
			// 	const existingCount = !cardInCollection
			// 		? 0
			// 		: data[0].cardType === 'NORMAL'
			// 		? cardInCollection.count
			// 		: data[0].cardType === 'GOLDEN'
			// 		? cardInCollection.premiumCount
			// 		: data[0].cardType === 'DIAMOND'
			// 		? cardInCollection.diamondCount
			// 		: data[0].cardType === 'SIGNATURE'
			// 		? cardInCollection.signatureCount
			// 		: 0;

			// 	for (let i = existingCount; i < existingCount + data.length; i++) {
			// 		this.handleNotification(cardId, type, i + 1, showNotifs);
			// 	}
			// }
		}

		return packCards;
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
		// With catch-up packs, this is in fact not working now
		// if (newCards?.length && newCards.length > 30) {
		// 	console.warn('[card-parser] not processing cards, too many', newCards.length);
		// 	return;
		// }

		const groupedBy: { [key: string]: readonly CardPackInfo[] } = groupByFunction(
			(card: CardPackInfo) => card.CardId + card.Premium,
		)(newCards);
		const collection = await this.collectionManager.collection$$.getValueWithInit();
		for (const data of Object.values(groupedBy)) {
			const cardId = data[0].CardId;
			const type = cardPremiumToCardType(data[0].Premium);
			const cardInCollection = collection.find((c) => c.id === cardId);
			const existingCount = (data[0].Premium ? cardInCollection?.premiumCount : cardInCollection?.count) ?? 0;

			for (let i = existingCount; i < existingCount + data.length; i++) {
				this.handleNotification(cardId, type, i + 1, showNotifs);
			}
		}
	}

	private async handleNotification(
		cardId: string,
		type: CollectionCardType,
		newCount: number,
		showNotifs = true,
		isMassPackOpening = false,
	) {
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
				const dust = dustFor(dbCard?.rarity, type);
				this.notifications.createDustToast(dust, 1);
			}
		}
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

export const cardPremiumToCardType = (premium: number): CollectionCardType => {
	switch (premium) {
		case 0:
			return 'NORMAL';
		case 1:
			return 'GOLDEN';
		case 2:
			return 'DIAMOND';
		case 3:
			return 'SIGNATURE';
		default:
			console.warn('unknown premium', premium);
			return 'NORMAL';
	}
};

export const cardTypeToPremium = (cardType: CollectionCardType, info?: any): number => {
	switch (cardType) {
		case 'NORMAL':
			return 0;
		case 'GOLDEN':
			return 1;
		case 'DIAMOND':
			return 2;
		case 'SIGNATURE':
			return 3;
		default:
			console.warn('unknown card type', cardType, info);
			return 0;
	}
};

export const isCatchupPack = (boosterId: BoosterType): boolean => {
	return CATCH_UP_PACK_IDS.includes(boosterId);
};
