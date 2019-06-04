import { Component, ChangeDetectionStrategy, Input, AfterViewInit, ElementRef } from '@angular/core';

@Component({
	selector: 'decktracker-twitch-title-bar',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/decktracker-title-bar.component.scss',
		`../../../../../css/component/controls/controls.scss`,
		`../../../../../css/component/controls/control-close.component.scss`,
	],
	template: `
		<div class="title-bar">
			<i class="logo">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#decktracker_logo"/>
				</svg>
			</i>
			<div class="controls">
                <button class="i-30 close-button" (click)="closeWindow()">
                    <svg class="svg-icon-fill">
                        <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
                    </svg>
                </button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTwitchTitleBarComponent {

    @Input() windowId: string;
    
    closeWindow() {
        console.log('minimizing window');
        (window as any).Twitch.ext.actions.minimize();
    }
}