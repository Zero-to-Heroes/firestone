import { Component, ViewEncapsulation, HostListener, NgZone } from '@angular/core';

import * as Raven from 'raven-js';

import { DebugService } from '../services/debug.service';

declare var overwolf: any;

@Component({
	selector: 'errors',
	styleUrls: [`../../css/component/errors.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<div class="menu-bar">
					<span class="header">
						<img class="logo" src="/IconStore.png" />
						<span>Firestone - An error occured</span>
					</span>
					<i class="glyphicon glyphicon-remove" (click)="closeWindow()"></i>
				</div>
				<div class="content-container">
					<div class="content">
						<i class="icon glyphicon glyphicon-exclamation-sign"></i>
						<p class="error" [innerHTML]="error"></p>
					</div>
					<social-media></social-media>
					<version></version>
				</div>
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class ErrorsComponent {

	private error: string;
	private windowId: string;
	private mainWindowId: string;

	constructor(
		private ngZone: NgZone,
		private debugService: DebugService) {

		console.log('constructor ErrorsComponent');

		overwolf.windows.getCurrentWindow((result) => {
			this.windowId = result.window.id;

			console.log('retrieved current errors window', result, this.windowId);

			overwolf.windows.obtainDeclaredWindow("MainWindow", (result) => {
				if (result.status !== 'success') {
					console.warn('Could not get MainWindow', result);
				}
				this.mainWindowId = result.window.id;


				overwolf.windows.sendMessage(this.mainWindowId, 'ack_errors', 'ack_errors', (result) => {
					console.log('ack_errors sent to main window', result);
				});
			});
		})

		overwolf.windows.onMessageReceived.addListener((message) => {
			overwolf.windows.restore(this.windowId, (result) => {
				console.log('notifications window is on?', result);

				this.ngZone.run(() => {
					console.log('received message in errors window', message);
					switch (message.id) {
						case 'no_log_file':
							this.error = `We couldn\'t find the ${message.content} file. ` +
								'This means we won\'t be able to detect when you open new card packs. ' +
								'Please see <a href="" target="_blank">here (insert link to troubleshooting FAQ on OW KB)</a> for help on how to resolve this.';
							console.log('Showing no_log_file error', this.error);
							break;
						default:
							this.error = 'An unknown error has occured: ' + message.id + '. Please <a href="https://github.com/Zero-to-Heroes/overwolf-collection-companion/issues/" target="_blank">open an issue</a> so we can help you figure out what went wrong.';
					}
				});
			})
		})


		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			if (this.exitGame(res)) {
				this.closeApp();
			}
		});
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


	private exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	}

	private closeApp() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				console.log('closing');
				overwolf.windows.close(result.window.id);
			}
		});
	}
}
