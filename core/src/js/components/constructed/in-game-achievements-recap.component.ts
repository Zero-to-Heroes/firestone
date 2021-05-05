import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AchievementProgress } from '../../models/achievement/achievement-progress';
import { ConstructedState } from '../../models/constructed/constructed-state';
import { groupByFunction } from '../../services/utils';
import { EffectiveProgress } from './effective-progress';

@Component({
	selector: 'in-game-achievements-recap',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/constructed/in-game-achievements-recap.component.scss`,
	],
	template: `
		<div class="in-game-achievements-recap">
			<div class="achievements" scrollable>
				<in-game-achievement-recap
					*ngFor="let progress of effectiveProgress; trackBy: trackById"
					class="recap"
					[progress]="progress"
				></in-game-achievement-recap>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InGameAchievementsRecapComponent {
	@Input() set state(value: ConstructedState) {
		this._state = value;
		// console.log('updating achievements progress', this._state);
		this.updateInfo();
	}

	_state: ConstructedState;
	effectiveProgress: readonly EffectiveProgress[];

	trackById(progress: EffectiveProgress): string {
		return progress.id;
	}

	private updateInfo() {
		if (!this._state?.currentAchievementsProgress?.achievements?.length) {
			return;
		}

		const nonCompletedAchievements = this._state.initialAchievementsProgress.achievements.filter(
			(initial) => !initial.completed,
		);

		// Now keep only the first non-completed step
		const groupedByType = groupByFunction((progress: AchievementProgress) => progress.type)(
			nonCompletedAchievements,
		);
		const firstSteps = Object.values(groupedByType).map(
			(progresses: AchievementProgress[]) => progresses.sort((a, b) => a.step - b.step)[0],
		);

		// Don't show achievements that have been completed before the match starts
		this.effectiveProgress = firstSteps
			.map((initial) => {
				const current = this._state.currentAchievementsProgress.achievements.find(
					(ach) => ach.id === initial.id,
				);
				return {
					id: initial.id,
					name: initial.name,
					text: initial.text,
					initialProgress: initial.progress,
					currentProgress: initial.progress,
					progressThisMatch: current.progress - initial.progress,
					quota: initial.quota,
					completed: current.completed,
				};
			})
			// .filter(a => a.text && a.text.toLowerCase().includes('mech'))
			.sort((a, b) => a.progressThisMatch - b.progressThisMatch)
			.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0))
			.reverse();
	}
}
