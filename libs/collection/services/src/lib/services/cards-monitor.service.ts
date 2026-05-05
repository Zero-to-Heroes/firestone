import { Inject, Injectable, Optional } from '@angular/core';
import { BoosterType, boosterIdToSetId } from '@firestone-hs/reference-data';
import { CollectionCardType } from '@firestone-hs/user-packs';
import { InternalCardInfo } from '@firestone/collection/data-access';
import { CATCH_UP_PACK_IDS } from '@firestone/collection/view';
import { CardPackInfo, MemoryInspectionService, MemoryUpdatesService, PackInfo } from '@firestone/memory';
import { MercenariesReferenceData, MercenariesReferenceDataService } from '@firestone/mercenaries/common';
import { Events, PreferencesService } from '@firestone/shared/common/service';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, filter, tap } from 'rxjs/operators';
import { CardNotificationsService } from './card-notifications.service';
import type { ICardsMonitorEventHandler } from './cards-monitor-event-handler.interface';
import { CARDS_MONITOR_EVENT_HANDLER } from './cards-monitor-event-handler.interface';
import { CollectionManager } from './collection-manager.service';
import { dustFor } from './collection-utils';

@Injectable()
export class CardsMonitorService {
	private packNotificationQueue = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly cards: CardsFacadeService,
		private readonly events: Events,
		private readonly collectionManager: CollectionManager,
		private readonly prefs: PreferencesService,
		private readonly notifications: CardNotificationsService,
		private readonly memoryService: MemoryInspectionService,
		private readonly allCards: CardsFacadeService,
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
		private readonly memoryUpdates: MemoryUpdatesService,
		@Optional() @Inject(CARDS_MONITOR_EVENT_HANDLER) private readonly eventHandler?: ICardsMonitorEventHandler,
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.memoryUpdates);

		this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
			if (changes.IsOpeningPack) {
				this.packNotificationQueue.next(true);
			}
		});
		this.packNotificationQueue
			.pipe(
				filter((info) => info),
				debounceTime(500),
				tap(() => this.triggerMemoryDetection(true)),
			)
			.subscribe();
	}

	public receiveLogLine(data: string) {
		if (!data?.length) return;
		if (!data.includes('Handling card collection modification')) return;
		this.packNotificationQueue.next(true);
	}

	private async triggerMemoryDetection(process = true) {
		const changes = await this.memoryService.getMemoryChanges();
		if (!process || !changes) return;

		if (!!changes.MassOpenedPacks?.length || changes.OpenedPacks?.length > 1) {
			const packs = changes.MassOpenedPacks?.length > 0 ? changes.MassOpenedPacks : changes.OpenedPacks;
			const allCards = (
				await Promise.all(packs.flatMap((pack) => this.handleNewPack(pack, { skipPlayerInput: true })))
			).flat();
			const totalDustValues = allCards
				.filter((card) => !card.isNew && !card.isSecondCopy)
				.map((card) => dustFor(this.cards.getCard(card.cardId)?.rarity ?? '', card.cardType));
			const totalDust = totalDustValues.reduce((a, b) => a + b, 0);
			const newCards = allCards
				.filter((card) => card.isNew || card.isSecondCopy)
				.filter(
					(card) =>
						['legendary', 'epic'].includes((this.cards.getCard(card.cardId)?.rarity ?? '').toLowerCase()) ||
						card.cardType !== 'NORMAL',
				);
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
		} else if (changes?.NewCards) {
			this.handleNewCards(changes.NewCards, !changes.OpenedPacks?.length);
		}
		this.packNotificationQueue.next(false);
	}

	private async handleNewPack(pack: PackInfo, options: { skipPlayerInput?: boolean; showNotifs?: boolean } = {}) {
		const boosterId = pack.BoosterId;
		const collection = await this.collectionManager.collection$$.getValueWithInit();
		const mercRefData =
			boosterId === BoosterType.MERCENARIES
				? await this.mercenariesReferenceData.referenceData$$.getValueWithInit()
				: null;
		const packCards: readonly InternalCardInfo[] = pack.Cards.map((card) => {
			if (boosterId === BoosterType.MERCENARIES) {
				return {
					cardId: mercRefData ? (this.getLettuceCardId(card, mercRefData) ?? '') : '',
					cardType: cardPremiumToCardType(card.Premium),
					currencyAmount: card.CurrencyAmount,
					mercenaryCardId: mercRefData ? this.getMercenaryCardId(card.MercenaryId, mercRefData) : undefined,
				} as InternalCardInfo;
			} else {
				const cardInCollection = collection.find((c) => c.id === card.CardId);
				return {
					cardId: card.CardId,
					cardType: cardPremiumToCardType(card.Premium),
					isNew:
						!cardInCollection ||
						(card.Premium ? cardInCollection.premiumCount === 0 : cardInCollection.count === 0),
					isSecondCopy:
						cardInCollection &&
						(card.Premium ? cardInCollection.premiumCount === 1 : cardInCollection.count === 1),
				} as InternalCardInfo;
			}
		});

		const setId = boosterIdToSetId(boosterId) || this.cards.getCard(packCards[0]?.cardId)?.set?.toLowerCase();

		this.events.broadcast(Events.NEW_PACK, setId, packCards, boosterId, options.skipPlayerInput);
		this.eventHandler?.onNewPack(setId, boosterId, packCards);

		if (boosterId !== BoosterType.MERCENARIES && options?.showNotifs) {
			const totalDustValues = packCards
				.filter((card) => !card.isNew && !card.isSecondCopy)
				.map((card) => dustFor(this.cards.getCard(card.cardId)?.rarity ?? '', card.cardType));
			const totalDust = totalDustValues.reduce((a, b) => a + b, 0);
			const newCards = packCards
				.filter((card) => card.isNew || card.isSecondCopy)
				.filter(
					(card) =>
						['legendary', 'epic'].includes(this.cards.getCard(card.cardId)?.rarity?.toLowerCase() ?? '') ||
						card.cardType !== 'NORMAL',
				);
			this.notifications.createDustToast(totalDust, totalDustValues.length);
			for (const card of newCards) {
				this.notifications.createNewCardToast(card.cardId, card.isSecondCopy, card.cardType);
			}
		}

		return packCards;
	}

	private getMercenaryCardId(mercenaryId: number, referenceData: MercenariesReferenceData): string | null {
		if (!referenceData) return null;
		const cardDbfId = referenceData.mercenaries
			.find((merc) => merc.id === mercenaryId)
			?.skins?.find((skin) => skin.isDefaultVariation)?.cardId;
		return cardDbfId != null ? this.allCards.getCardFromDbfId(cardDbfId).id : null;
	}

	private getLettuceCardId(card: CardPackInfo, referenceData: MercenariesReferenceData): string | null {
		if (!referenceData) return null;
		const cardDbfId = referenceData.mercenaries
			.find((merc) => merc.id === card.MercenaryId)
			?.skins?.find((skin) => skin.artVariationId === card.MercenaryArtVariationId)?.cardId;
		return cardDbfId != null ? this.allCards.getCardFromDbfId(cardDbfId).id : null;
	}

	private async handleNewCards(newCards: readonly CardPackInfo[], showNotifs = true) {
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

	private async handleNotification(cardId: string, type: CollectionCardType, newCount: number, showNotifs = true) {
		const prefs = await this.prefs.getPreferences();
		const isDust = this.hasReachedMaxCollectibleOf(cardId, newCount);
		if (prefs.showCardsOutsideOfPacks && showNotifs) {
			if (!isDust) {
				this.notifications.createNewCardToast(cardId, newCount === 2, type);
			} else {
				const dbCard = this.cards.getCard(cardId);
				if (!dbCard) return;
				const dust = dustFor(dbCard.rarity ?? '', type);
				this.notifications.createDustToast(dust, 1);
			}
		}
	}

	private hasReachedMaxCollectibleOf(cardId: string, newCount: number): boolean {
		const dbCard = this.cards.getCard(cardId);
		if (!dbCard) return false;
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
			return 'NORMAL';
	}
};

export const cardTypeToPremium = (cardType: CollectionCardType): number => {
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
			return 0;
	}
};

export const isCatchupPack = (boosterId: BoosterType): boolean => CATCH_UP_PACK_IDS.includes(boosterId);
