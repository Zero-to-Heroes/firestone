import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { VisualAchievement } from '../../models/visual-achievement';

@Component({
	selector: 'achievement-view',
	styleUrls: [`../../../css/component/achievements/achievement-view.component.scss`],
	template: `
		<div class="achievement-container" [ngClass]="{'missing': !achieved}">
			<div class="image-container">
				<img src="/Files/assets/images/placeholder.png" class="pale-theme placeholder" [@showPlaceholder]="showPlaceholder" />
				<img src="{{image}}" class="real-achievement" (load)="imageLoadedHandler()" [@showRealAchievement]="!showPlaceholder"/>
			</div>
			<div class="achievement-body">
				<div class="achievement-name">{{_achievement.name}}</div>
				<div class="achievement-text" [innerHTML]="achievementText"></div>
				<div class="completion-progress">
					<div class="completion-step" [ngClass]="{'completed': metTimes > 0}">
						met
						<div class="zth-tooltip bottom">
							<p>Boss encountered {{metTimes}} times</p>
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0"/>
							</svg>
						</div>
					</div>
					<div class="completion-step" [ngClass]="{'completed': defeatedTimes > 0}">
						vict
						<div class="zth-tooltip bottom">
							<p>Boss defeated {{defeatedTimes}} times</p>
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0"/>
							</svg>
						</div>
					</div>
				</div>
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

	_achievement: VisualAchievement;
	image: string;
	showPlaceholder = true;
	achievementText: string = 'placeholder text';
	achieved: boolean = false;
	metTimes: number;
	defeatedTimes: number;
	
	constructor(private cdr: ChangeDetectorRef) {
		
	}

	@Input() set achievement(achievement: VisualAchievement) {
		this._achievement = achievement;
		this.achieved = this._achievement.numberOfCompletions.reduce((a, b) => a + b, 0) > 0;
		this.metTimes = this._achievement.numberOfCompletions[0];
		this.defeatedTimes = this._achievement.numberOfCompletions[1];
		this.image = `http://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.cardId}.jpg`;
		this.achievementText = this._achievement.text;
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		this.cdr.detectChanges();
	}
}
