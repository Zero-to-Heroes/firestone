import { Component, Output, EventEmitter, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';

import { CollectionManager } from '../../services/collection/collection-manager.service';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ChangeVisibleApplicationEvent } from '../../services/mainwindow/store/events/change-visible-application-event';

declare var overwolf: any;

@Component({
	selector: 'app-choice',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/home/app-choice.component.scss`,
	],
	template: `
		<div class="app-choice" *ngIf="dataLoaded">
			<div (click)="showCollection()" 
					[ngClass]="{'app binder': true, 'inactive': noCollection}">
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
			<div (click)="showAchievements()" 
					class="app achievements" 
					[ngClass]="{'inactive': noCollection}">
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
			<div (click)="showDecktracker()" class="app deck-tracker last">
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
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AppChoiceComponent implements AfterViewInit {

	@Output() close = new EventEmitter();

	dataLoaded = false;
	noCollection = true;

	private collectionWindowId;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private collectionManager: CollectionManager, private cdr: ChangeDetectorRef) {
	}

	ngAfterViewInit() {
		this.cdr.detach();
		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "WelcomeWindow") {
				return;
			}
			// console.log('state changed app choice', message);
			if (message.window_state == 'normal') {
				this.refreshContents();
			}
		});
		this.refreshContents();
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
			this.collectionWindowId = result.window.id;
		});
		this.stateUpdater = overwolf.windows.getMainWindow().mainWindowStoreUpdater;
	}

	showCollection() {
		this.showMainWindow('collection');
	}

	showDecktracker() {
		this.showMainWindow('decktracker');
	}

	showAchievements() {
		if (this.noCollection) {
			return;
		}
		this.showMainWindow('achievements');
	}

	private showMainWindow(module: string) {
		if (this.noCollection) {
			return;
		}
		
		this.stateUpdater.next(new ChangeVisibleApplicationEvent(module));

		// overwolf.windows.sendMessage(this.collectionWindowId, 'module', module, () => {
		// 	console.log('module message sent', module);
		overwolf.windows.getCurrentWindow((currentWindoResult) => {
			const center = {
				x: currentWindoResult.window.left + currentWindoResult.window.width / 2,
				y: currentWindoResult.window.top + currentWindoResult.window.height / 2
			};
			// console.log('center is', center);
			overwolf.windows.sendMessage(this.collectionWindowId, 'move', center, () => {
				overwolf.windows.restore(this.collectionWindowId, () => {
					this.close.emit(null);
				});
			});
		});
		// });

	}

	private async refreshContents() {
		const collection = await this.collectionManager.getCollection();
		console.log('retrieved collection', collection);
		this.noCollection = !collection || collection.length == 0;
		this.dataLoaded = true;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
