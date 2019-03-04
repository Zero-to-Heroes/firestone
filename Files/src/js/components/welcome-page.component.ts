import { Component, ViewEncapsulation, HostListener, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';

import { DebugService } from '../services/debug.service';
import { CollectionManager } from '../services/collection/collection-manager.service';
import { FeatureFlags } from '../services/feature-flags.service';

declare var overwolf: any;

@Component({
	selector: 'welcome-page',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/welcome-page.component.scss`
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<section class="menu-bar">
					<i class="i-117X33 gold-theme logo">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#logo"/>
						</svg>
					</i>
					<div class="controls">
						<control-settings [windowId]="thisWindowId"></control-settings>
						<control-help></control-help>
						<control-minimize [windowId]="thisWindowId"></control-minimize>
						<control-close [windowId]="thisWindowId" [closeAll]="true"></control-close>
					</div>
				</section>
				<home-screen-info-text></home-screen-info-text>
				<app-choice (close)="hideWindow()"></app-choice>
				<social-media></social-media>
				<version></version>
			</div>

			<i class="i-54 gold-theme corner top-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner top-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePageComponent implements AfterViewInit {

	thisWindowId: string;

	constructor(private debugService: DebugService, private collectionManager: CollectionManager) {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				this.thisWindowId = result.window.id;
			}
		});
	}

	ngAfterViewInit() {
		overwolf.windows.onMessageReceived.addListener((message) => {
			if (message.id === 'move') {
				overwolf.windows.getCurrentWindow((result) => {
					if (result.status === "success"){
						const newX = message.content.x - result.window.width / 2;
						const newY = message.content.y - result.window.height / 2;
						overwolf.windows.changePosition(this.thisWindowId, newX, newY);
					}
				});
			}
		});
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		overwolf.windows.dragMove(this.thisWindowId);
	};

	hideWindow() {
		overwolf.windows.hide(this.thisWindowId);
	};
}
