import { Component, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, HostListener, ElementRef, ViewRef, Input } from '@angular/core';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';

declare var overwolf: any;

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
					<achievement-history-item 
						[historyItem]="historyItem">
					</achievement-history-item>
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
export class AchievementHistoryComponent implements AfterViewInit {
	
 	@Input() achievementHistory: ReadonlyArray<AchievementHistory>;
	
	constructor(
		// private storage: AchievementHistoryStorageService,
		private el: ElementRef,
		private cdr: ChangeDetectorRef) {
		// overwolf.windows.onStateChanged.addListener((message) => {
		// 	if (message.window_name != "CollectionWindow") {
		// 		return;
		// 	}
		// 	// console.log('state changed achievement-history', message);
		// 	if (message.window_state == 'normal') {
		// 		this.refreshContents();
		// 	}
		// });
	}

	ngAfterViewInit() {
		// this.cdr.detach();
		// this.refreshContents();
	}

	// refreshContents() {
	// 	if (this.refreshing) {
	// 		return;
	// 	}
	// 	this.refreshing = true;
	// 	console.log('request to load');
	// 	this.storage.loadAll().then((result: AchievementHistory[]) => {
    //         console.log('loaded history', result);
	// 		this.achievementHistory = result
	// 			.filter((history) => history.numberOfCompletions == 1)
	// 			// We want to have the most recent at the top
	// 			.reverse();
    //         this.refreshing = false;
	// 		if (!(<ViewRef>this.cdr).destroyed) {
	// 			this.cdr.detectChanges();
	// 		}
    //     });
	// }

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
