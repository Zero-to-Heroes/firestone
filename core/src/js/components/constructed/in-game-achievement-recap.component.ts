import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { EffectiveProgress } from './effective-progress';

@Component({
	selector: 'in-game-achievement-recap',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/constructed/in-game-achievement-recap.component.scss`,
	],
	template: `
		<div
			class="in-game-achievement-recap"
			[ngClass]="{ 'completed': isCompleted, 'no-progress': !gainedThisMatch }"
		>
			<div class="name" [helpTooltip]="text">{{ name }}</div>
			<div class="progress">
				<div class="count">
					<div class="progress">
						<div class="current">{{ currentProgress }}</div>
						<div class="quota">{{ quota }}</div>
					</div>
				</div>
				<div class="graph">
					<div class="background"></div>
					<div class="progress" [style.width.%]="progressWidth"></div>
					<div class="gain-progress" [style.left.%]="gainLeft" [style.width.%]="gainWidth"></div>
				</div>
				<div class="gain" *ngIf="gainedThisMatch" helpTooltip="Gained this match">+{{ gainedThisMatch }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InGameAchievementRecapComponent {
	@Input() set progress(value: EffectiveProgress) {
		this._progress = value;
		// console.log('updating progress', this._progress);
		this.updateInfo();
	}

	name: string;
	text: string;
	isCompleted: boolean;

	currentProgress: number;
	quota: number;
	gainedThisMatch: number;

	progressWidth: number;
	gainLeft: number;
	gainWidth: number;

	private _progress: EffectiveProgress;

	private updateInfo() {
		if (!this._progress) {
			return;
		}

		this.name = this._progress.name;
		this.text = this._progress.text;
		this.currentProgress = this._progress.currentProgress;
		this.quota = this._progress.quota;
		this.gainedThisMatch = this._progress.progressThisMatch;
		this.isCompleted = this._progress.completed;

		this.progressWidth = (100 * this.currentProgress) / this.quota;
		this.gainLeft = Math.max(0, (100 * (this.currentProgress - this.gainedThisMatch)) / this.quota);
		this.gainWidth = (100 * this.gainedThisMatch) / this.quota;
	}
}
