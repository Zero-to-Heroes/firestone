import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

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
				<control-settings [windowId]="windowId"></control-settings>
				<control-close [windowId]="windowId"></control-close>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTitleBarComponent {

	@Input() windowId: string;
}