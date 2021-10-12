import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input } from '@angular/core';
import { AchievementHistory } from '../../models/achievement/achievement-history';

@Component({
	selector: 'achievement-history',
	styleUrls: [
		`../../../css/component/achievements/achievement-history.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="achievement-history">
			<div class="history">
				<div class="top-container">
					<span class="title">My Achievements History</span>
				</div>
				<ul>
					<li *ngFor="let historyItem of achievementHistory; trackBy: trackById">
						<achievement-history-item [historyItem]="historyItem"></achievement-history-item>
					</li>
					<section *ngIf="!achievementHistory || achievementHistory.length === 0" class="empty-state">
						<i class="i-60x78 pale-theme">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#empty_state_my_card_history" />
							</svg>
						</i>
						<span>No history yet</span>
						<span>Complete an achievement to start one!</span>
					</section>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementHistoryComponent {
	@Input() achievementHistory: readonly AchievementHistory[];

	constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

	trackById(index, history: AchievementHistory) {
		return history.id;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		const rect = this.el.nativeElement.querySelector('.history').getBoundingClientRect();

		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}
}
