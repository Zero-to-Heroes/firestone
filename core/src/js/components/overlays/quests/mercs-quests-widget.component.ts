import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mercs-quests-widget',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/overlays/quests/quests-widget-view.component.scss',
	],
	template: `
		<div class="quests-widget">
			<!-- <div
				class="widget-icon"
				*ngIf="showQuests$ | async"
				(mouseenter)="onMouseEnter()"
				(mouseleave)="onMouseLeave()"
				(click)="onMouseLeave()"
				(mousedown)="onMouseLeave()"
				(mouseup)="onMouseLeave()"
			>
				<img [src]="widgetIcon" />
			</div>
			<hs-quests-list
				class="quests-container"
				[ngClass]="{
					'visible': showQuestsDetails$ | async,
					'right': showRight$ | async,
					'bottom': showBottom$ | async
				}"
				[quests]="quests$ | async"
				[theme]="theme"
				[xpIcon]="xpIcon"
				[xpBonusIcon]="xpBonusIcon"
			>
			</hs-quests-list> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsQuestsWidgetComponent {}
