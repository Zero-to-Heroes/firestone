import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
} from '@angular/core';
import { AchievementSet } from '../../models/achievement-set';
import { SelectAchievementSetEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-set-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievements-categories',
	styleUrls: [
		`../../../css/component/achievements/achievements-categories.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="achievements-categories">
			<ol class="achievements-set-list">
				<li *ngFor="let achievementSet of achievementSets; trackBy: trackById">
					<achievement-set-view
						[achievementSet]="achievementSet"
						(mousedown)="selectSet(achievementSet)"
					></achievement-set-view>
				</li>
			</ol>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsCategoriesComponent implements AfterViewInit {
	@Input() public achievementSets: AchievementSet[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectSet(set: AchievementSet) {
		this.stateUpdater.next(new SelectAchievementSetEvent(set.id));
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		const achievementsList = this.el.nativeElement.querySelector('.achievements-set-list');
		if (!achievementsList) {
			return;
		}
		const rect = achievementsList.getBoundingClientRect();
		// console.log('element rect', rect);
		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	trackById(achievementSet: AchievementSet, index: number) {
		return achievementSet.id;
	}
}
