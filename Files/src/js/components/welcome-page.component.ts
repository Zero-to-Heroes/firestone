import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
} from '@angular/core';
import { DebugService } from '../services/debug.service';
import { OverwolfService } from '../services/overwolf.service';

@Component({
	selector: 'welcome-page',
	styleUrls: [`../../css/global/components-global.scss`, `../../css/component/welcome-page.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<section class="menu-bar">
					<i class="i-117X33 gold-theme logo">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
						</svg>
					</i>
					<div class="controls">
						<control-bug></control-bug>
						<control-settings [windowId]="thisWindowId"></control-settings>
						<control-discord></control-discord>
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
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner top-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePageComponent implements AfterViewInit, OnDestroy {
	thisWindowId: string;

	private messageReceivedListener: (message: any) => void;

	constructor(private debugService: DebugService, private ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		this.messageReceivedListener = this.ow.addMessageReceivedListener(async message => {
			if (message.id === 'move') {
				const window = await this.ow.getCurrentWindow();
				const newX = message.content.x - window.width / 2;
				const newY = message.content.y - window.height / 2;
				this.ow.changeWindowPosition(this.thisWindowId, newX, newY);
			}
		});
	}

	ngOnDestroy(): void {
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		this.ow.dragMove(this.thisWindowId);
	}

	hideWindow() {
		this.ow.hideWindow(this.thisWindowId);
	}
}
