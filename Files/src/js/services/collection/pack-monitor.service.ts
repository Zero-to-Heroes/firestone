import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { Card } from '../../models/card';
import { CardHistory } from '../../models/card-history';

import { Events } from '../../services/events.service';
import { GameEvents } from '../../services/game-events.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { CollectionManager } from './collection-manager.service';
import { LogRegisterService } from '../../services/log-register.service';
import { CardHistoryStorageService } from './card-history-storage.service';

declare var overwolf: any;
declare var parseCardsText: any;
declare var resemble: any;
declare var ga: any;

@Injectable()
export class PackMonitor {

	private unrevealedCards: string[] = [];
	private cardEvents = {};
	private detecting = false;
	private busy = false;
	private hadNewCard = false;

	private dpi = 1;

	private totalDustInPack = 0;
	private totalDuplicateCards = 0;
	// private timer: any;

	constructor(
		private events: Events,
		private logRegisterService: LogRegisterService,
		private storage: CardHistoryStorageService,
		private gameEvents: GameEvents,
		private notificationService: OwNotificationsService) {

		// You need to logout for the new dpi to take effect, so we can cache the value
		overwolf.games.getRunningGameInfo((gameInfo) => {
			this.dpi = gameInfo.logicalWidth / gameInfo.width;
		});

		this.gameEvents.onGameStart.subscribe(() => {
			this.unrevealedCards = [];
		})

		this.events.on(Events.NEW_PACK)
			.subscribe(event => {

				this.busy = true;
				// clearTimeout(this.timer);

				console.log('resetting cards for new pack');
				let undetectedCards = [];
				let anyUndetected = false;
				for (let j = 0; j < 5; j++) {
					if (this.unrevealedCards[j] !== '' && this.unrevealedCards[j]) {
						undetectedCards.push(this.unrevealedCards[j]);
						console.warn('undetected', this.unrevealedCards[j], JSON.stringify(this.unrevealedCards[j]));
						anyUndetected = true;
					}
				}
				if (anyUndetected) {
					console.warn('opening new pack with cards still undetected', anyUndetected, undetectedCards);
					ga('send', 'event', 'error', 'undetected-cards', JSON.stringify(anyUndetected));
				}

				if (this.totalDustInPack > 0) {
					this.createDustToast(this.totalDustInPack, this.totalDuplicateCards);
					this.totalDustInPack = 0;
					this.totalDuplicateCards = 0;
				}

				// // Show dust after a short amount of time if no new pack has been opened
				// this.timer = setTimeout(() => {
				// 	console.log('times up, showing dust earned', this.totalDustInPack, this.totalDuplicateCards);
				// 	if (this.totalDustInPack > 0) {
				// 		this.createDustToast(this.totalDustInPack, this.totalDuplicateCards);
				// 		this.totalDustInPack = 0;
				// 		this.totalDuplicateCards = 0;
				// 	}
				// }, 10 * 1000)

				this.busy = false;
				this.unrevealedCards = [];
			});

		this.events.on(Events.NEW_CARD)
			.subscribe(event => {
				let card: Card = event.data[0];
				this.unrevealedCards.push(card.Id);
				this.cardEvents[card.Id] = () => {
					this.hadNewCard = true;
					this.createNewCardToast(card);
				};

				let dbCard = parseCardsText.getCard(card.Id);
				this.storage.newCard(new CardHistory(dbCard.id, dbCard.name, dbCard.rarity, 0, card.Premium, true));
			});
		this.events.on(Events.MORE_DUST)
			.subscribe(event => {
				let card: Card = event.data[0];
				let dust: number = event.data[1];
				this.unrevealedCards.push(card.Id);
				this.cardEvents[card.Id] = () => { this.totalDustInPack += dust; this.totalDuplicateCards++; };

				let dbCard = parseCardsText.getCard(card.Id);
				this.storage.newDust(new CardHistory(dbCard.id, dbCard.name, dbCard.rarity, dust, card.Premium, false));
			});



		overwolf.games.inputTracking.onMouseUp.addListener((data) => {
			if (this.unrevealedCards.length > 0 && data.onGame) {
				console.log('Detecting revealed cards', data, this.unrevealedCards);
				this.cardClicked(data, (index) => {
					this.detectRevealedCard(index);
				});
			}
		});
	}

	private cardClicked(data, callback: Function) {
		overwolf.games.getRunningGameInfo((result) => {
			let x = 1.0 * data.x / (result.width * this.dpi);
			let y = 1.0 * data.y / (result.height * this.dpi);
			// console.log('clicked at ', x, y, data, result);

			// Top left
			let ret = -1;
			if (x <= 0.505 && y <= 0.52) {
				ret = 4;
			}
			// Top center
			else if (x >= 0.51 && x <= 0.65 && y <= 0.425) {
				ret = 2;
			}
			// Top right
			else if (x >= 0.66 && y <= 0.52) {
				ret = 3;
			}
			// Bottom left
			else if (x <= 0.56 && y >= 0.55) {
				ret = 0;
			}
			// Bottom right
			else if (x >= 0.59 && y >= 0.55) {
				ret = 1;
			}
			else {
				console.log('[WARN] Could not detect the clicked on card', x, y, data, result);
				console.log('could not identify card');
				ga('send', 'event', 'error', 'card-unidentified', {x: x, y: y, data: data, result: result});
				return;
			}

			callback(ret);
		});
	}

	private detectRevealedCard(i: number) {
		if (this.busy) {
			setTimeout(() => {
				this.detectRevealedCard(i);
			}, 10);
			return;
		}

		this.busy = true;

		// card has been revealed already
		if (this.unrevealedCards[i] === '') {
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
		let cardId = this.unrevealedCards[i];
		console.log('revealing card', i, cardId, this.cardEvents[cardId], this.unrevealedCards);
		this.unrevealedCards[i] = '';
		this.cardEvents[cardId]();

		for (let j = 0; j < 5; j++) {
			// Not all cards have been revealed yet
			if (this.unrevealedCards[j] !== '') {
				return;
			}
		}
		console.log('All cards revealed, resetting');
		// All cards have been revealed, full reset
		if (this.totalDustInPack > 0) {
			this.createDustToast(this.totalDustInPack, this.totalDuplicateCards);
			this.totalDustInPack = 0;
			this.totalDuplicateCards = 0;
		}
		this.unrevealedCards = [];
		this.cardEvents = {};
		console.log('reset done');

		this.hadNewCard = false;
	}

	private compare(actualUrl: string, imageName: string, callback: Function) {
		resemble('/Files/assets/images/' + imageName)
			.compareTo(actualUrl)
			.ignoreAntialiasing()
			.scaleToSameSize()
			// .ignoreColors()
			.onComplete((data) => {
				callback(data);
			});
	}

	private getBoxForCard(i: number): any {
		let width = -0.02;
		let height = -0.05;
		let x, y;

		switch (i) {
			// Bottom left
			case 0:
				x = -0.505;
				y = -0.78;
				break;
			// Bottom right
			case 1:
				x = -0.675;
				y = -0.79;
				break;
			// Top card center
			case 2:
				x = -0.59;
				y = -0.34;
				break;
			// Top right
			case 3:
				x = -0.745;
				y = -0.43;
				break;
			// Top left
			case 4:
				x = -0.445;
				y = -0.42;
				break;
		}

		return {
			x: x,
			y: y,
			width: width,
			height: height
		}
	}

	private getBoxForCardZoom(i: number): any {
		let width = -0.02;
		let height = -0.05;
		let x, y;

		switch (i) {
			// Bottom left
			case 0:
				x = -0.505;
				y = -0.84;
				break;
			// Bottom right
			case 1:
				x = -0.675;
				y = -0.85;
				break;
			// Top card center
			case 2:
				x = -0.61;
				y = -0.30;
				break;
			// Top right
			case 3:
				x = -0.745;
				y = -0.37;
				break;
			// Top left
			case 4:
				x = -0.445;
				y = -0.36;
				break;
		}

		return {
			x: x,
			y: y,
			width: width,
			height: height
		}
	}

	private createNewCardToast(card: Card) {
		let dbCard = parseCardsText.getCard(card.Id);
		let cardName: string = dbCard.name;
		let goldenClass = undefined;
		if (card.Premium) {
			cardName = 'Golden ' + cardName;
			goldenClass = 'premium';
		}
		console.log('displaying new card toast notification for ' + cardName);
		this.notificationService.html({
			content: `<div class="message-container message-new-card ${goldenClass}">
					<div class="outer-border" *ngIf="goldenClass"></div>
					<img class="rarity" src="/Files/assets/images/rarity/rarity-${dbCard.rarity.toLowerCase()}.png">
					<img class="art" src="http://static.zerotoheroes.com/hearthstone/cardart/256x/${dbCard.id}.jpg">
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
						<span class="new-card"><span class="new">New card:</span> ${cardName}!</span>
						<span class="cta">Click to <span class="link">expand</span></span>
					</div>
				</div>`,
			cardId: dbCard.id
		});
	}

	private createDustToast(dust: number, numberOfCards: number) {
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
				</div>`
		});
	}
}
