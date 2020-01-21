import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { captureEvent } from '@sentry/core';
import { Key } from 'ts-keycode-enum';
import { Card } from '../../models/card';
import { Events } from '../../services/events.service';
import { LogRegisterService } from '../../services/log-register.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';

@Injectable()
export class PackMonitor {
	private unrevealedCards: string[] = [];
	private cardEvents = {};
	private busy = false;
	private spacePressed: number;

	private totalDustInPack = 0;
	private totalDuplicateCards = 0;
	private openingPack = false;

	constructor(
		private events: Events,
		private prefs: PreferencesService,
		private logRegisterService: LogRegisterService,
		private cards: AllCardsService,
		private gameEvents: GameEventsEmitterService,
		private ow: OverwolfService,
		private notificationService: OwNotificationsService,
	) {
		this.gameEvents.onGameStart.subscribe(() => {
			this.unrevealedCards = [];
		});

		this.events.on(Events.NEW_PACK).subscribe(event => {
			this.openingPack = true;
			this.busy = true;
			this.spacePressed = 0;
			console.log('[pack-monitor] resetting cards for new pack', event);
			const undetectedCards = [];
			let anyUndetected = false;
			for (let j = 0; j < 5; j++) {
				if (this.unrevealedCards[j] !== '' && this.unrevealedCards[j]) {
					undetectedCards.push(this.unrevealedCards[j]);
					console.warn(
						'[pack-monitor] undetected',
						this.unrevealedCards[j],
						JSON.stringify(this.unrevealedCards[j]),
					);
					anyUndetected = true;
				}
			}
			if (anyUndetected) {
				console.warn(
					'[pack-monitor] opening new pack with cards still undetected',
					anyUndetected,
					undetectedCards,
				);
			}

			if (this.totalDustInPack > 0) {
				this.createDustToast(this.totalDustInPack, this.totalDuplicateCards);
				this.totalDustInPack = 0;
				this.totalDuplicateCards = 0;
			}

			this.busy = false;
			this.unrevealedCards = [];
		});
		this.events.on(Events.NEW_CARD).subscribe(event => this.handleNewCardEvent(event));
		this.events.on(Events.MORE_DUST).subscribe(event => this.handleNewDustEvent(event));
		this.ow.addMouseUpListener(data => this.handleMouseUp(data));
		this.ow.addKeyUpListener(data => this.handleKeyUp(data));
		// console.log('[pack-monitor] all event handlers set');
	}

	private handleNewCardEvent(event) {
		if (this.busy) {
			setTimeout(() => this.handleNewCardEvent(event), 100);
			return;
		}
		console.log('[pack-monitor] preparing to handle new card event');
		const card: Card = event.data[0];
		const type: string = event.data[1];
		this.cardEvents[card.id] = () => {
			this.createNewCardToast(card, type);
		};
		if (this.openingPack) {
			if (!card.id) {
				console.error('[pack-monitor] Trying to add an empty card id to unrevealed cards', card, type);
			}
			this.unrevealedCards.push(card.id);
		} else {
			this.revealCardById(card.id);
		}
	}

	private handleNewDustEvent(event) {
		if (this.busy) {
			setTimeout(() => this.handleNewDustEvent(event), 100);
			return;
		}
		console.log('[pack-monitor] preparing to handle new dust event');
		const card: Card = event.data[0];
		const dust: number = event.data[1];
		if (this.openingPack) {
			// console.log('[pack-monitor] opening pack, waiting to show dust');
			if (!card.id) {
				console.error('[pack-monitor] Trying to add an empty card id to unrevealed cards', card, dust);
			}
			this.unrevealedCards.push(card.id);
			this.cardEvents[card.id] = () => {
				this.totalDustInPack += dust;
				this.totalDuplicateCards++;
			};
		} else {
			// console.log('[pack-monitor] not opening pack, showing dust');
			this.createDustToast(dust, 1);
		}
	}

	private handleMouseUp(data) {
		// console.log('[pack-monitor] preparing to handle mosue up event', data);
		if (this.unrevealedCards.length > 0 && data.onGame) {
			if (this.unrevealedCards.length !== 5) {
				console.log('[pack-monitor] all cards not revealed yet', this.unrevealedCards);
				setTimeout(() => {
					this.handleMouseUp(data);
				}, 50);
				return;
			}
			console.log('[pack-monitor] Detecting revealed cards', data, this.unrevealedCards);
			this.cardClicked(data, index => {
				this.detectRevealedCard(index);
			});
		}
	}

	private handleKeyUp(data) {
		// console.log('[pack-monitor] preparing to handle key up event', data);
		if (this.unrevealedCards.length > 0 && data.onGame && parseInt(data.key) === Key.Space) {
			if (this.unrevealedCards.length !== 5) {
				console.log('[pack-monitor] all cards not revealed yet', this.unrevealedCards);
				setTimeout(() => {
					this.handleKeyUp(data);
				}, 50);
				return;
			}
			this.spacePressed++;
			const cardsToBeRevealed: number = this.unrevealedCards.filter(card => card).length;
			if (cardsToBeRevealed !== this.spacePressed) {
				return;
			}

			for (let i = 0; i < this.unrevealedCards.length; i++) {
				if (this.unrevealedCards[i]) {
					this.detectRevealedCard(i);
				}
			}
		}
	}

	private async cardClicked(data, callback: Function) {
		const result = await this.ow.getRunningGameInfo();
		const x = (1.0 * data.x) / result.logicalWidth;
		const y = (1.0 * data.y) / result.logicalHeight;
		// console.log('[pack-monitor] clicked at ', x, y, data, result);

		// Top left
		let ret = -1;
		if (x <= 0.505 && y <= 0.52) {
			ret = 4;
		} else if (x >= 0.51 && x <= 0.65 && y <= 0.425) {
			ret = 2;
		} else if (x >= 0.66 && y <= 0.52) {
			ret = 3;
		} else if (x <= 0.56 && y >= 0.55) {
			ret = 0;
		} else if (x >= 0.59 && y >= 0.55) {
			ret = 1;
		} else {
			console.warn('[pack-monitor] Could not detect the clicked on card', x, y, data, result);
			captureEvent({
				message: 'could not identify the card the user clicked on',
				extra: {
					x: x,
					y: y,
					data: data,
					result: result,
					unrevealedCards: this.unrevealedCards,
				},
			});
			return;
		}
		// console.log('matching card position', ret);

		callback(ret);
	}

	private detectRevealedCard(i: number) {
		// console.log('[pack-monitor] preparing to detect revealed card');
		if (this.busy) {
			setTimeout(() => {
				this.detectRevealedCard(i);
			}, 50);
			return;
		}

		this.busy = true;

		// card has been revealed already
		if (this.unrevealedCards[i] === '' || !this.unrevealedCards[i]) {
			this.busy = false;
			return;
		}

		// console.log('detecting card', i);
		this.revealCard(i);
		// Prevent spamming the same card
		this.busy = false;
	}

	private revealCard(i: number) {
		if (i === -1) {
			return;
		}
		const cardId = this.unrevealedCards[i];
		this.unrevealedCards[i] = '';
		this.revealCardById(cardId);
	}

	private revealCardById(cardId: string) {
		console.log('[pack-monitor] revealing card', cardId, this.unrevealedCards);
		if (this.cardEvents[cardId]) {
			this.cardEvents[cardId]();
		}

		for (let j = 0; j < 5; j++) {
			// Not all cards have been revealed yet
			if (this.unrevealedCards.length > j && this.unrevealedCards[j] !== '') {
				return;
			}
		}
		// console.log('[pack-monitor] All cards revealed, resetting');
		this.openingPack = false;
		// All cards have been revealed, full reset
		if (this.totalDustInPack > 0) {
			this.createDustToast(this.totalDustInPack, this.totalDuplicateCards);
			this.totalDustInPack = 0;
			this.totalDuplicateCards = 0;
		}
		this.unrevealedCards = [];
		this.cardEvents = {};
		console.log('[pack-monitor] reset done');
	}

	public async createNewCardToast(card: Card, type: string) {
		const dbCard = this.cards.getCard(card.id);
		if (!dbCard) {
			console.error('[pack-monitor] missing card', card.id);
			return;
		}
		const prefs = await this.prefs.getPreferences();
		if (!prefs.showCommon && dbCard.rarity === 'Common') {
			return;
		}
		if (!this.openingPack && !prefs.showCardsOutsideOfPacks) {
			return;
		}
		let cardName: string = dbCard.name;
		let goldenClass;
		let newLabel = 'New card';
		if (type === 'GOLDEN') {
			cardName = 'Golden ' + cardName;
			goldenClass = 'premium';
			if (card.premiumCount >= 2) {
				newLabel = 'Second copy';
			}
		} else if (card.count >= 2) {
			newLabel = 'Second copy';
		}
		console.log('[pack-monitor] displaying new card toast notification for ' + cardName);
		const rarity = dbCard && dbCard.rarity ? dbCard.rarity.toLowerCase() : 'free';
		this.notificationService.html({
			content: `<div class="message-container message-new-card ${goldenClass}">
					<div class="outer-border" *ngIf="goldenClass"></div>
					<img class="rarity" src="/Files/assets/images/rarity/rarity-${rarity}.png">
					<img class="art" src="https://static.zerotoheroes.com/hearthstone/cardart/256x/${dbCard.id}.jpg">
					<div class="message">
						<div *ngIf="goldenClass" class="premium-deco">
							<i class="gold-theme left">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
								</svg>
							</i>
							<i class="gold-theme right">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
								</svg>
							</i>
						</div>
						<span class="new-card"><span class="new">${newLabel}:</span> ${cardName}!</span>
						<span class="cta">Click to <span class="link">expand</span></span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			notificationId: `cards-${Date.now()}-${dbCard.id}`,
			cardId: dbCard.id,
			timeout: 5000,
		});
	}

	private async createDustToast(dust: number, numberOfCards: number) {
		const prefs = await this.prefs.getPreferences();
		if (prefs.showDust) {
			console.log('[pack-monitor] showing dust notification', dust, numberOfCards);
			this.notificationService.html({
				content: `
                    <div class="message-container message-dust">
                        <div class="dust">
                            <i class="i-30 pale-theme">
                                <svg class="svg-icon-fill">
                                    <use xlink:href="/Files/assets/svg/sprite.svg#dust"/>
                                </svg>
                            </i>
                        </div>
                        <div class="text">
                            <span>${numberOfCards} duplicate cards</span>
                            <span class="dust-amount">${dust} Dust potential</span>
                        </div>
                        <button class="i-30 close-button">
                            <svg class="svg-icon-fill">
                                <use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
                            </svg>
                        </button>
                    </div>`,
				timeout: 5000,
				notificationId: `dust-${Date.now()}-${dust}-${numberOfCards}`,
			});
		}
	}
}
