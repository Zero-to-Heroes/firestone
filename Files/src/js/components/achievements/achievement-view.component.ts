import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { DomSanitizer } from '@angular/platform-browser';

import { Achievement } from '../../models/achievement';

declare var overwolf: any;

@Component({
	selector: 'achievement-view',
	styleUrls: [`../../../css/component/achievements/achievement-view.component.scss`],
	template: `
		<div class="achievement-container" [ngClass]="{'missing': _achievement.numberOfCompletions == 0}">
			<img src="/Files/assets/images/placeholder.png" class="pale-theme placeholder" [@showPlaceholder]="showPlaceholder" />

			<img src="{{image}}" class="real-achievement" (load)="imageLoadedHandler()" [@showRealAchievement]="!showPlaceholder"/>
			<div class="zth-tooltip bottom" *ngIf="_achievement.numberOfCompletions > 0">
				<p>Completed {{_achievement.numberOfCompletions}} times</p>
				<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
					<polygon points="0,0 8,-9 16,0"/>
				</svg>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('showPlaceholder', [
			state('false',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('true',	style({
				opacity: 1,
			})),
			transition(
				'true => false',
				animate(`150ms linear`)),
		]),
		trigger('showRealAchievement', [
			state('false',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('true',	style({
				opacity: 1,
			})),
			transition(
				'false => true',
				animate(`150ms linear`)),
		])
	]
})
export class AchievementViewComponent {

	_achievement: Achievement;
	image: string;
	showPlaceholder = true;
	
	constructor(private cdr: ChangeDetectorRef) {
		
	}

	@Input() set achievement(achievement: Achievement) {
		this._achievement = achievement;
		this.image = `http://static.zerotoheroes.com/hearthstone/fullcard/en/256/${achievement.cardId}.png`;
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		this.cdr.detectChanges();
	}
}
