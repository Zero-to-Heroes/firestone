import { Component, ChangeDetectionStrategy, Input, AfterViewInit, ElementRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

declare var overwolf: any;

@Component({
	selector: 'decktracker-title-bar',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/decktracker-title-bar.component.scss',
	],
	template: `
		<div class="title-bar">
			<i class="logo">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#decktracker_logo"/>
				</svg>
			</i>
			<div class="controls">
				<control-settings 
					[settingsApp]="'decktracker'" 
					[shouldMoveSettingsWindow]="false"
					[windowId]="windowId">
				</control-settings>
				<control-settings 
					id="fakeClose"
					[settingsApp]="'decktracker'" 
					[shouldMoveSettingsWindow]="false"
					[windowId]="windowId">
				</control-settings>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTitleBarComponent implements AfterViewInit {

	@Input() windowId: string;

	constructor(private el: ElementRef) { }

	ngAfterViewInit() {
		let singleEl: HTMLElement = this.el.nativeElement.querySelector('#fakeClose button');
		singleEl.innerHTML = `
			<svg class="svg-icon-fill">
				<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
			</svg>`;
	}
}