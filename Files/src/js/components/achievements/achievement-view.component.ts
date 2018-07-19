import { Component, NgZone, Input, SimpleChanges, Directive, ElementRef, HostListener } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { DomSanitizer } from '@angular/platform-browser';

import { Events } from '../../services/events.service';

import { Achievement } from '../../models/achievement';

declare var overwolf: any;

@Component({
	selector: 'achievement-view',
	styleUrls: [`../../../css/component/achievements/achievement-view.component.scss`],
	template: `
		<div class="achievement-container" [ngClass]="{'missing': achievement.numberOfCompletions == 0}">
			<img src="/Files/assets/images/placeholder.png" class="pale-theme placeholder" [@showPlaceholder]="showPlaceholder" />

			<img src="{{image()}}" class="real-achievement" (load)="imageLoadedHandler()" [@showRealAchievement]="!showPlaceholder"/>
		</div>
	`,
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
// 7.1.1.17994
export class AchievementViewComponent {

	@Input() public achievement: Achievement;

	showPlaceholder = true;

	constructor(
		private el: ElementRef,
		private events: Events) {
	}

	image() {
		return 'http://static.zerotoheroes.com/hearthstone/fullcard/en/256/' + this.achievement.cardId + '.png';
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
	}
}
