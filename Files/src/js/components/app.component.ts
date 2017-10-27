import { Component } from '@angular/core';

import * as Raven from 'raven-js';

import { Card } from '../models/card';
import { LogListenerService } from '../services/log-listener.service';
import { Events } from '../services/events.service';
import { OwNotificationsService } from '../services/notifications.service';

declare var overwolf: any;
declare var parseCardsText: any;
declare var resemble: any;

@Component({
	selector: 'zh-app',
	styleUrls: [`../../css/component/app.component.scss`],
	template: `
		<div>
		</div>
	`,
})
// 7.1.1.17994
export class AppComponent {

	unrevealedCards: string[] = [];
	cardEvents = {};

	constructor(
		private logListenerService: LogListenerService,
		private events: Events,
		private notificationService: OwNotificationsService) {

		this.events.on(Events.NEW_CARD)
			.subscribe(event => {
				let card: Card = event.data[0];
				this.unrevealedCards.push(card.Id);
				this.cardEvents[card.Id] = () => { this.createNewCardToast(card); };
			});
		this.events.on(Events.MORE_DUST)
			.subscribe(event => {
				let card: Card = event.data[0];
				let dust: number = event.data[1];
				this.unrevealedCards.push(card.Id);
				this.cardEvents[card.Id] = () => { this.createDustToast(card, dust); };
			});

		// overwolf.settings.registerHotKey(
		// 	"test_screenshot",
		// 	(result) => {
		// 		if (result.status === 'success') {
		// 			console.log('taking screenshot', result);
		// 			this.testScreenshot();
		// 		}
		// 		else {
		// 			console.log('error registering hotkey', result);
		// 		}
		// 	}
		// )

		overwolf.games.inputTracking.onMouseUp.addListener((data) => {
			if (this.unrevealedCards.length > 0 && data.onGame) {
				console.log('Detecting revealed cards', data, this.unrevealedCards);
				this.detectRevealedCards();
			}
		});
	}

	private detectRevealedCards() {
		for (let i = 0; i < 5; i++) {
			this.detectRevealedCard(i);
		}
	}

	private detectRevealedCard(i: number) {
		// card has been revealed already
		if (this.unrevealedCards[i] === '') {
			return;
		}

		overwolf.media.getScreenshotUrl(
			{
				//Recommended for better rounding.
				roundAwayFromZero : "true",
				//Optional - Crop the screen (happens before the rescale, if both are used).
				//Positive values are absolute, negative values are relative (-1.0 - 0)
				crop: this.getBoxForCard(i)
			},
			(result) => {
				if (result.status !== 'success') {
					console.log('[WARN] Could not take screenshot', result);
				}
				// console.log('Part: Screenshot', result.url);
				// Load the reference images
				// TODO: increase reliability
				this.compare(result.url, 'unrevealed_card.JPG', (data) => {
					if (data.rawMisMatchPercentage > 65) {
						this.compare(result.url, 'unrevealed_card_zoom.JPG', (data) => {
							if (data.rawMisMatchPercentage > 65) {
								this.revealCard(i);
							}
						});
					}
				});
			}
		);
	}

	private revealCard(i: number) {
		let cardId = this.unrevealedCards[i];
		this.unrevealedCards[i] = '';
		this.cardEvents[cardId]();
		for (let j = 0; j < 5; j++) {
			// Not all cards have been revealed yet
			if (this.unrevealedCards[j] !== '') {
				return;
			}
		}
		// All cards have been revealed, full reset
		this.unrevealedCards = [];
		this.cardEvents = {};
	}

	private compare(actualUrl: string, imageName: string, callback: Function) {
		resemble('/Files/assets/images/' + imageName)
			.compareTo(actualUrl)
			.ignoreAntialiasing()
			.scaleToSameSize()
			.ignoreColors()
			.onComplete((data) => {
				callback(data);
			});
	}

	private getBoxForCard(i: number): any {
		let width = -0.08;
		let height = -0.17;
		let x, y;

		switch (i) {
			// Bottom left
			case 0:
				x = -0.45;
				y = -0.63;
				break;
			// Bottom right
			case 1:
				x = -0.62;
				y = -0.64;
				break;
			// Top card center
			case 2:
				x = -0.535;
				y = -0.19;
				break;
			// Top right
			case 3:
				x = -0.69;
				y = -0.28;
				break;
			// Top left
			case 4:
				x = -0.39;
				y = -0.28;
				break;
		}

		return {
			x: x,
			y: y,
			width: width,
			height: height
		}
	}

	// private testScreenshot() {
	// 	overwolf.media.getScreenshotUrl(
	// 		{
	// 			//Recommended for better rounding.
	// 			roundAwayFromZero : "true",
	// 			//Optional - Crop the screen (happens before the rescale, if both are used).
	// 			//Positive values are absolute, negative values are relative (-1.0 - 0)
	// 			crop: {
	// 				x: -0.39, //Start cropping at the middle of the screen
	// 				y: -0.28,
	// 				width: -0.08,
	// 				height: -0.17
	// 			},
	// 		},
	// 		function(result) {
	// 			// console.log('screenshot status', result);
	// 			if (result.status == "success") {
	// 				console.log('Part: Screenshot', result.url);
	// 				// Load the reference images
	// 				resemble('/Files/assets/images/unrevealed_card.JPG')
	// 					.compareTo(result.url)
	// 					.ignoreAntialiasing()
	// 					.scaleToSameSize()
	// 					.ignoreColors()
	// 					.onComplete((data) => {
	// 						console.log('comparison with unzoomed', data);
	// 						// The images move!
	// 						if (data.rawMisMatchPercentage > 60) {
	// 							console.log('matching with zoomed');
	// 							resemble('/Files/assets/images/unrevealed_card_zoom.JPG')
	// 								.compareTo(result.url)
	// 								.ignoreAntialiasing()
	// 								.scaleToSameSize()
	// 								.ignoreColors()
	// 								.onComplete((data) => {
	// 									console.log('comparison with zoom', data);
	// 									if (data.rawMisMatchPercentage > 60) {
	// 										console.log('no match');
	// 									}
	// 									else {
	// 										console.log('match');
	// 									}
	// 								})
	// 						}
	// 						else {
	// 							console.log('match');
	// 						}
	// 					})
	// 			}
	// 		}
	// 	);
	// }

	private createNewCardToast(card: Card) {
		let cardName: string = parseCardsText.getCard(card.Id).name;
		if (card.Premium) {
			cardName = 'Golden ' + cardName;
		}
		console.log('displaying new card toast notification for ' + cardName);
		this.notificationService.html('<div class="message-container"><div class="message">New card! ' + cardName + '</div></div>');
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
