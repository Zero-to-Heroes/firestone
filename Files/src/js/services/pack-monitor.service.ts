import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { Card } from '../models/card';
import { Events } from '../services/events.service';
import { OwNotificationsService } from '../services/notifications.service';
import { CollectionManager } from '../services/collection-manager.service';
import { LogListenerService } from '../services/log-listener.service';

declare var overwolf: any;
declare var parseCardsText: any;
declare var resemble: any;

@Injectable()
export class PackMonitor {

	private unrevealedCards: string[] = [];
	private cardEvents = {};
	private detecting = false;
	private detectingSingleCard = false;
	private hadNewCard = false;

	constructor(
		private events: Events,
		private logListenerService: LogListenerService,
		private notificationService: OwNotificationsService) {

		this.events.on(Events.NEW_CARD)
			.subscribe(event => {
				let card: Card = event.data[0];
				this.unrevealedCards.push(card.Id);
				this.cardEvents[card.Id] = () => {
					this.hadNewCard = true;
					this.createNewCardToast(card);
				};
			});
		this.events.on(Events.MORE_DUST)
			.subscribe(event => {
				let card: Card = event.data[0];
				let dust: number = event.data[1];
				this.unrevealedCards.push(card.Id);
				this.cardEvents[card.Id] = () => { this.createDustToast(card, dust); };
			});

		overwolf.games.inputTracking.onMouseUp.addListener((data) => {
			// if (data.onGame) this.cardClicked(data, (result) => console.log('card clicked', result));
			if (this.unrevealedCards.length > 0 && data.onGame) {
				console.log('Detecting revealed cards', data, this.unrevealedCards);
				this.cardClicked(data, (index) => {
					// console.log('bouh')
					// We need to wait until the animation completes
					setTimeout(() => {
						this.detectRevealedCard(index);
						// this.detectRevealedCards();
					}, 500)
				});
			}
		});
	}

	private cardClicked(data, callback: Function) {
		overwolf.games.getRunningGameInfo((result) => {
			let x = 1.0 * data.x / result.width;
			let y = 1.0 * data.y / result.height;
			console.log('clicked at ', x, y, data, result);

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
			}

			callback(ret);
		});
	}

	private detectRevealedCards() {
		if (this.detecting || this.detectingSingleCard) {
			setTimeout(() => {
				this.detectRevealedCards();
			}, 500);
			return;
		}

		this.detecting = true;
		for (let i = 0; i < 5; i++) {
			this.detectRevealedCard(i);
		}
		this.detecting = false;
	}

	private detectRevealedCard(i: number) {
		if (this.detectingSingleCard) {
			setTimeout(() => {
				this.detectRevealedCard(i);
			}, 10);
			return;
		}

		this.detectingSingleCard = true;

		// card has been revealed already
		if (this.unrevealedCards[i] === '') {
			return;
		}

		console.log('detecting card', i);
		overwolf.media.getScreenshotUrl(
			{
				roundAwayFromZero : "true",
				crop: this.getBoxForCard(i)
			},
			(result) => {
				if (result.status !== 'success') {
					console.log('[WARN] Could not take screenshot', result);
					this.detectingSingleCard = false;
				}
				console.log('Part: Screenshot', result.url);
				this.compare(result.url, 'unrevealed_card.JPG', (data) => {
					console.log('screenshot match?', data);
					if (data.rawMisMatchPercentage > 5) {
						overwolf.media.getScreenshotUrl(
							{
								roundAwayFromZero : "true",
								crop: this.getBoxForCardZoom(i)
							},
							(result) => {
								if (result.status !== 'success') {
									console.log('[WARN] Could not take screenshot', result);
									this.detectingSingleCard = false;
								}
								console.log('Part: Screenshot zoom', result.url);
								this.compare(result.url, 'unrevealed_card_zoom.JPG', (data) => {
									console.log('screenshot match?', data);
									if (data.rawMisMatchPercentage > 5) {
										this.revealCard(i);
									}
									this.detectingSingleCard = false;
								});
							}
						);
					}
					else {
						this.detectingSingleCard = false;
					}
				});
			}
		);
	}

	private revealCard(i: number) {
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
		this.unrevealedCards = [];
		this.cardEvents = {};
		console.log('reset done');

		// if (this.hadNewCard) {
		// 	this.notificationService.html('<div class="message-container"><img src="/Files/assets/images/collection.png"><div class="message">Click to see your collection</div></div>');
		// }

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
		if (card.Premium) {
			cardName = 'Golden ' + cardName;
		}
		console.log('displaying new card toast notification for ' + cardName);
		this.notificationService.html('<div class="message-container"><img src="/Files/assets/images/rarity-' + dbCard.rarity.toLowerCase() + '.png"><div class="message">New card! ' + cardName + '</div></div>');
	}

	private createDustToast(card: Card, dust: number) {
		let cardName: string = parseCardsText.getCard(card.Id).name;
		if (card.Premium) {
			cardName = 'Golden ' + cardName;
		}
		console.log('displaying dust toast notification for ' + cardName);
		this.notificationService.html('<div class="message-container"><img src="/Files/assets/images/dust_small.png"><div class="message">Got ' + dust + ' dust for ' + cardName + '</div></div>');
	}
}
