import { Component, Input, ChangeDetectionStrategy, ElementRef, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { VisualAchievement } from '../../models/visual-achievement';

@Component({
	selector: 'achievement-view',
	styleUrls: [`../../../css/component/achievements/achievement-view.component.scss`],
	template: `
		<div class="achievement-container" [ngClass]="{'missing': !achieved}">
			<div class="stripe" (click)="toggleRecordings()">
				<achievement-image 
						[imageId]="_achievement.cardId" 
						[imageType]="_achievement.cardType">
				</achievement-image>
				<div class="achievement-body">
					<div class="text">
						<div class="achievement-name">{{_achievement.name}}</div>
						<div class="achievement-text" [innerHTML]="achievementText"></div>
					</div>
					<div class="completion-date" *ngIf="completionDate">Completed: {{completionDate}}</div>
					<div class="completion-progress">
						<div class="recordings">
							<span class="number">{{numberOfRecordings}}</span>
							<i class="i-30x20">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#video"/>
								</svg>
							</i>
						</div>
						<achievement-completion-step 
								*ngFor="let completionStep of _achievement.completionSteps"
								[step]="completionStep">
						</achievement-completion-step>
					</div>
				</div>
				<div class="collapse">
					<i class="i-13X7" [ngClass]="{'open': showRecordings}" *ngIf="numberOfRecordings > 0">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#collapse_caret"/>
						</svg>
					</i>
				</div>
			</div>
			<achievement-recordings *ngIf="showRecordings" [achievement]="_achievement"></achievement-recordings>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementViewComponent {

	@Output() requestGlobalHeaderCollapse = new EventEmitter<boolean>();

	_achievement: VisualAchievement;
	achievementText: string;
	achieved: boolean = false;
	completionDate: string;
	numberOfRecordings: number;
	showRecordings: boolean;

	@Input() set showReplays(showReplays: boolean) {
		// We just want to trigger the opening of the replay windows, not hide it
		if (showReplays) {
			this.showRecordings = true;
		}
	}

	@Input() set achievement(achievement: VisualAchievement) {
		this._achievement = achievement;
		this.completionDate = undefined;
		this.achieved = this._achievement.isAchieved();
		this.achievementText = this._achievement.text;
		this.numberOfRecordings = this._achievement.replayInfo.length;
		if (this._achievement.replayInfo.length > 0) {
			const allTs = this._achievement.replayInfo
					.map((info) => info.creationTimestamp)
					.filter((ts) => ts);
			if (allTs.length > 0) {
				const completionTimestamp = allTs.reduce((a, b) => Math.min(a, b));			
				this.completionDate = new Date(completionTimestamp).toLocaleDateString(
					"en-GB",
					{ day: "2-digit", month: "2-digit", year: "2-digit"} );
			}
		}
	}

	constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {
	}

	toggleRecordings() {
		if (this._achievement.replayInfo.length > 0) {
			this.showRecordings = !this.showRecordings;
			console.log('show recording?', this._achievement.id, this.showRecordings);
			if (this.showRecordings) {
				this.requestGlobalHeaderCollapse.next(true);
				console.log('requested global header collapse');
			}
			else {
				this.requestGlobalHeaderCollapse.next(false);
			}
			this.cdr.detectChanges();
		}
	}
}
