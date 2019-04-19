import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ElementRef, Input } from '@angular/core';
import { AchievementHistory } from '../../models/achievement/achievement-history';

@Component({
	selector: 'achievement-history',
	styleUrls: [
		`../../../css/component/achievements/achievement-history.component.scss`,
		`../../../css/global/scrollbar-achievements.scss`,
	],
	template: `
		<div class="achievement-history">
			<div class="top-container">
				<span class="title">My Achievements History</span>
			</div>
			<ul class="history">
				<li *ngFor="let historyItem of achievementHistory; trackBy: trackById">
					<achievement-history-item [historyItem]="historyItem"></achievement-history-item>
				</li>
				<section *ngIf="!achievementHistory || achievementHistory.length == 0" class="empty-state">
					<i class="i-60x78 pale-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_my_card_history"/>
						</svg>
					</i>
					<span>No history yet</span>
					<span>Complete an achievement to start one!</span>
				</section>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementHistoryComponent {
	
 	@Input() achievementHistory: ReadonlyArray<AchievementHistory>;
	
	constructor(
		private el: ElementRef,
		private cdr: ChangeDetectorRef) {
	}

	trackById(index, history: AchievementHistory) {
		return history.id;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		let rect = this.el.nativeElement.querySelector('.history').getBoundingClientRect();
		// console.log('element rect', rect);
		let scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}
}
