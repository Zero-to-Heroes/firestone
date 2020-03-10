import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { CurrentAppType } from '../../../models/mainwindow/current-app.type';
import { NextFtueEvent } from '../../../services/mainwindow/store/events/ftue/next-ftue-event';
import { PreviousFtueEvent } from '../../../services/mainwindow/store/events/ftue/previous-ftue-event';
import { SkipFtueEvent } from '../../../services/mainwindow/store/events/ftue/skip-ftue-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'ftue',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/menu.scss`,
		`../../../../css/component/main-window/ftue/ftue.component.scss`,
	],
	template: `
		<div class="ftue">
			<div class="backdrop"></div>
			<div class="element">
				<div class="title">{{ title }}</div>
				<div class="text">{{ text }}</div>
				<div class="icon" [inlineSVG]="icon"></div>
				<div class="progress" *ngIf="!isHome">
					<div
						class="knot"
						*ngFor="let step of progressSteps; let i = index"
						[ngClass]="{ 'active': i === progressIndex }"
						(click)="goToStep(step)"
					></div>
				</div>
				<button *ngIf="isHome" class="get-started" (click)="next()" growOnClick>Let's start</button>
				<div *ngIf="isHome" class="skip-ftue" (click)="skip()" growOnClick>Skip</div>
				<div
					class="previous-ftue ftue-nav-link"
					(click)="previous()"
					*ngIf="!isHome && progressIndex > 0"
					growOnClick
				>
					Previous
				</div>
				<div class="next-ftue ftue-nav-link" (click)="next()" *ngIf="!isHome" growOnClick>
					{{ progressIndex === 3 ? 'Done' : 'Next' }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FtueComponent implements AfterViewInit {
	title: string;
	text: string;
	icon: string;
	progressIndex: number;
	isHome: boolean;
	progressSteps: CurrentAppType[] = ['achievements', 'collection', 'decktracker', 'replays'];

	@Input() set selectedModule(value: CurrentAppType) {
		switch (value) {
			case 'replays':
				this.title = 'Replays';
				this.text = 'Here you can find all your past games, broken into step by step actions';
				this.icon = `/Files/assets/svg/ftue/replays.svg`;
				this.isHome = false;
				this.progressIndex = 3;
				break;
			case 'achievements':
				this.title = 'Achievements';
				this.text =
					"Challenge yourself throughout the game. Here you'll find all the feats you have accomplished";
				this.icon = `/Files/assets/svg/ftue/achievements.svg`;
				this.progressIndex = 0;
				this.isHome = false;
				break;
			case 'collection':
				this.title = 'Collection';
				this.text =
					'Here your can find all the cards in the game, with detailed information (you can even play the sounds they make)';
				this.icon = `/Files/assets/svg/ftue/collection.svg`;
				this.progressIndex = 1;
				this.isHome = false;
				break;
			case 'decktracker':
				this.title = 'Deck Tracker';
				this.text = 'Track your cards in game and your deck stats';
				this.icon = `/Files/assets/svg/ftue/decktracker.svg`;
				this.progressIndex = 2;
				this.isHome = false;
				break;
			default:
				this.title = 'Welcome to Firestone!';
				this.text = 'How about a quick tour?';
				this.icon = `/Files/assets/svg/ftue/general.svg`;
				this.isHome = true;
				break;
		}
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	next() {
		this.stateUpdater.next(new NextFtueEvent());
	}

	previous(step: CurrentAppType) {
		this.stateUpdater.next(new PreviousFtueEvent());
	}

	skip() {
		this.stateUpdater.next(new SkipFtueEvent());
	}
}
