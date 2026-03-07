import { Injectable } from '@angular/core';
import { CollectionCardType } from '@firestone-hs/user-packs';
import { NotificationsService, PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Injectable()
export class CardNotificationsService {
	constructor(
		private readonly notificationService: NotificationsService,
		private readonly cards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
	) {}

	public async createNewCardToast(cardId: string, isSecondCopy: boolean, type: CollectionCardType) {
		const dbCard = this.cards.getCard(cardId);
		if (!dbCard) return;

		const prefs = await this.prefs.getPreferences();
		if (!prefs.collectionEnableNotifications) return;

		if (!prefs.showCommon && dbCard.rarity === 'Common') return;

		const cardName: string = dbCard.name;
		const goldenClass = type === 'GOLDEN' || type === 'DIAMOND' || type === 'SIGNATURE' ? 'premium' : '';
		const newLabel = isSecondCopy
			? this.i18n.translateString('app.collection.card-history.second-copy-long', {
					version: goldenClass
						? this.i18n.translateString(`app.collection.card-history.version.${type.toLowerCase()}`) + ' '
						: '',
				})
			: this.i18n.translateString('app.collection.card-history.new-copy-long', {
					version: goldenClass
						? this.i18n.translateString(`app.collection.card-history.version.${type.toLowerCase()}`) + ' '
						: '',
				});
		const rarity = dbCard?.rarity?.toLowerCase() || 'free';
		const clickText = this.i18n.translateString('app.collection.card-history.click-to-expand');

		this.notificationService.emitNewNotification({
			content: `<div class="message-container message-new-card ${goldenClass}">
					<div class="outer-border" *ngIf="goldenClass"></div>
					<img class="rarity" src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/rarity/rarity-${rarity}.png">
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
						<div class="text-container link">
							<span class="new-card"><span class="new">${newLabel}</span> ${cardName}!</span>
							<span class="cta"> ${clickText}</span>
						</div>
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
		if (!prefs.collectionEnableNotifications) return;

		if (prefs.showDust) {
			const duplicateCardsText = this.i18n.translateString('app.collection.card-history.duplicate-cards', {
				numberOfCards: numberOfCards,
			});
			const dustPotentialText = this.i18n.translateString('app.collection.card-history.dust-potential', {
				dust: dust,
			});
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
                            <span>${duplicateCardsText}</span>
                            <span class="dust-amount">${dustPotentialText}</span>
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
