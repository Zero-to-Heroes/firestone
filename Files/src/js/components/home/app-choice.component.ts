import { Component, Output, EventEmitter } from '@angular/core';

import { CollectionManager } from '../../services/collection/collection-manager.service';

declare var overwolf: any;

@Component({
	selector: 'app-choice',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/home/app-choice.component.scss`,
	],
	template: `
		<div class="app-choice">
			<div (click)="showCollection()" [ngClass]="{'app binder': true, 'inactive': noCollection}">
				<div class="no-data" *ngIf="noCollection">Launch Hearthstone to start</div>
				<div class="info">
					<i class="i-150X150 gold-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#the_binder"/>
						</svg>
					</i>
					<span class="title">The Binder</span>
					<span class="sub-title">Deep dive into your card collection</span>
					<div class="banner"></div>
				</div>
			</div>
			<div class="app chronicler disabled">
				<div class="coming-soon">Coming soon</div>
				<div class="info">
					<i class="i-150X150 gold-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#achievements"/>
						</svg>
					</i>
					<span class="title">Achievements</span>
					<span class="sub-title">Celebrate your in-game triumphs</span>
					<div class="banner"></div>
				</div>
			</div>
			<div class="app deck-tracker last disabled">
				<div class="coming-soon">Coming soon</div>
				<div class="info">
					<i class="i-150X150 gold-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#deck_tracker"/>
						</svg>
					</i>
					<span class="title">Deck Tracker</span>
					<span class="sub-title">Build the best decks and track them!</span>
					<div class="banner"></div>
				</div>
			</div>
		</div>
	`,
})

export class AppChoiceComponent {

	@Output() close = new EventEmitter();

	private noCollection = true;

	constructor(private collectionManager: CollectionManager) {
		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "WelcomeWindow") {
				return;
			}
			console.log('state changed app choice', message);
			if (message.window_state == 'normal') {
				this.refreshContents();
			}
		});
		this.refreshContents();
	}

	private refreshContents() {
		this.collectionManager.getCollection((collection) => {
			console.log('retrieved collection', collection);
			this.noCollection = !collection || collection.length == 0;
		});
	}

	private showCollection() {
		if (this.noCollection) {
			return;
		}
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
			overwolf.windows.restore(result.window.id, (result2) => {
				this.close.emit(null);
			})
		});
	}
}
