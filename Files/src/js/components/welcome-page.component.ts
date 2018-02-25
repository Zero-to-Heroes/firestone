import { Component, ViewEncapsulation, HostListener } from '@angular/core';

import { DebugService } from '../services/debug.service';
import { CollectionManager } from '../services/collection/collection-manager.service';

import * as Raven from 'raven-js';

declare var overwolf: any;

@Component({
	selector: 'welcome-page',
	styleUrls: [`../../css/component/welcome-page.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<div class="menu-bar">
					<i class="glyphicon glyphicon-remove" (click)="closeWindow()"></i>
				</div>
				<div class="content-container">
					<div class="content">
						<h1>
							<img class="logo" src="/IconStore.png" />
							<div class="title-text">
								<span class="title">HS Collection Companion</span>
								<span class="subtitle">Pack Opening & Collection Assistant</span>
							</div>
						</h1>
						<div class="main-text">
							<span class="text">
								To begin, start opening packs in-game. <br />
								HS Collection Companion will automatically show you notifications for new cards and the amount of dust in case you open duplicates.
							</span>
							<span class="text">
								<b>NEW! </b>To display the Collection window in-game, press <span class="command">Alt</span> + <span class="command">C</span>.
							</span>
						</div>
					</div>
					<div class="actions">
						<div class="action" [ngClass]="emptyCollection ? 'inactive' : ''" (click)="openCollection()">
							<i class="icon glyphicon glyphicon-home"></i>
							<h2>Collection</h2>
							<span>View your collection and track your set completion!</span>
							<span *ngIf="emptyCollection" class="first-time">First-time user? Launch the game to backup your collection offline!</span>
						</div>
						<div class="action disabled">
							<i class="icon glyphicon glyphicon-question-sign"></i>
							<h2>Achievements</h2>
							<span class="coming-soon">Coming soon</span>
						</div>
						<div class="action disabled">
							<i class="icon glyphicon glyphicon-question-sign"></i>
							<h2>Tracker</h2>
							<span class="coming-soon">Coming soon</span>
						</div>
					</div>
					<social-media></social-media>
					<version></version>
				</div>
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class WelcomePageComponent {

	private emptyCollection = false;

	constructor(private debugService: DebugService, private collectionManager: CollectionManager) {
		this.collectionManager.getCollection((collection) => {
			console.log('loaded collection', collection);
			if (!collection || collection.length == 0) {
				this.emptyCollection = true;
			}
		})
	}

	@HostListener('mousedown', ['$event'])
	private dragMove(event: MouseEvent) {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				overwolf.windows.dragMove(result.window.id);
			}
		});
	};

	private closeWindow() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				overwolf.windows.close(result.window.id);
			}
		});
	};

	private openCollection() {
		if (this.emptyCollection) {
			return;
		}

		console.log('showing collection page');
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
			console.log('got collection window', result);
			this.closeWindow();

			overwolf.windows.restore(result.window.id, (result) => {
				console.log('CollectionWindow is on?', result);
				this.closeWindow();
			})
		});
	}

}
