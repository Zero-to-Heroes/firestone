import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { CollectionCardType } from '../../models/collection/collection-card-type.type';
import { OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';

@Injectable()
export class CardNotificationsService {
	constructor(
		private readonly notificationService: OwNotificationsService,
		private readonly cards: CardsFacadeService,
		private readonly prefs: PreferencesService,
	) {}

	public async createNewCardToast(cardId: string, isSecondCopy: boolean, type: CollectionCardType) {
		const dbCard = this.cards.getCard(cardId);
		if (!dbCard) {
			console.warn('[card-notification] missing card', cardId);
			return;
		}

		const prefs = await this.prefs.getPreferences();
		if (!prefs.collectionEnableNotifications) {
			console.log('[card-notification] notifs disabled, not showing any notif');
			return;
		}

		if (!prefs.showCommon && dbCard.rarity === 'Common') {
			return;
		}

		const cardName: string =
			type === 'GOLDEN' ? `Golden ${dbCard.name}` : type === 'DIAMOND' ? `Diamond ${dbCard.name}` : dbCard.name;
		const goldenClass = type === 'GOLDEN' ? 'premium' : '';
		const newLabel = isSecondCopy ? 'Second copy' : 'New card';
		console.log('[card-notification] displaying new card toast notification for', cardName);
		const rarity = dbCard?.rarity?.toLowerCase() || 'free';

		this.notificationService.emitNewNotification({
			content: `<div class="message-container message-new-card ${goldenClass}">
					<div class="outer-border" *ngIf="goldenClass"></div>
					<img class="rarity" src="assets/images/rarity/rarity-${rarity}.png">
					<img class="art" src="https://static.zerotoheroes.com/hearthstone/cardart/256x/${dbCard.id}.jpg">
					<div class="message">
						<div *ngIf="goldenClass" class="premium-deco">
							<i class="gold-theme left">
								<svg class="svg-icon-fill">
									<use xlink:href="assets/svg/sprite.svg#two_gold_leaves"/>
								</svg>
							</i>
							<i class="gold-theme right">
								<svg class="svg-icon-fill">
									<use xlink:href="assets/svg/sprite.svg#two_gold_leaves"/>
								</svg>
							</i>
						</div>
						<span class="new-card"><span class="new">${newLabel}:</span> ${cardName}!</span>
						<span class="cta">Click to <span class="link">expand</span></span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			notificationId: `cards-${Date.now()}-${dbCard.id}`,
			cardId: dbCard.id,
		});
	}

	public async createDustToast(dust: number, numberOfCards: number) {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.collectionEnableNotifications) {
			console.log('[card-notification] notifs disabled, not showing any notif');
			return;
		}

		if (prefs.showDust) {
			console.log('[card-notification] showing dust notification', dust, numberOfCards);
			this.notificationService.emitNewNotification({
				content: `
                    <div class="message-container message-dust">
                        <div class="dust">
                            <i class="i-30 pale-theme">
                                <svg class="svg-icon-fill">
                                    <use xlink:href="assets/svg/sprite.svg#dust"/>
                                </svg>
                            </i>
                        </div>
                        <div class="text">
                            <span>${numberOfCards} duplicate cards</span>
                            <span class="dust-amount">${dust} Dust potential</span>
                        </div>
                        <button class="i-30 close-button">
                            <svg class="svg-icon-fill">
                                <use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
                            </svg>
                        </button>
                    </div>`,
				notificationId: `dust-${Date.now()}-${dust}-${numberOfCards}`,
			});
		}
	}
}
