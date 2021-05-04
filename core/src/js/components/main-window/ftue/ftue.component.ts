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
			<div class="element" *ngIf="isHome">
				<div class="title">Welcome to Firestone</div>
				<div class="text">How about a quick tour?</div>
				<div class="icon home" [inlineSVG]="'assets/svg/ftue/general.svg'"></div>
				<button class="get-started" (click)="next()" growOnClick>Let's start</button>
				<div class="skip-ftue ftue-nav-link" (click)="skip()" growOnClick>Skip</div>
			</div>
			<div class="element" *ngIf="!isHome">
				<div class="steps">
					<div class="scroller" [style.marginLeft.%]="-1 * currentIndex * 100"></div>
					<div *ngFor="let step of ftueSteps; let i = index" class="step">
						<div class="title">{{ step.title }}</div>
						<div class="text">{{ step.text }}</div>
						<div class="icon" [inlineSVG]="step.icon"></div>
					</div>
				</div>
				<div class="progress">
					<div
						class="knot"
						*ngFor="let step of ftueSteps; let i = index"
						[ngClass]="{ 'active': i === currentIndex }"
					></div>
				</div>
				<div class="previous-ftue ftue-nav-link" (click)="previous()" *ngIf="currentIndex > 0" growOnClick>
					Previous
				</div>
				<div class="next-ftue ftue-nav-link" (click)="next()" growOnClick>
					{{ currentIndex === ftueSteps.length - 1 ? 'Done' : 'Next' }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FtueComponent implements AfterViewInit {
	currentIndex = 0;
	isHome = true;
	ftueSteps: FtueStep[] = [
		{
			id: 'decktracker',
			title: 'Deck Tracker',
			text: 'Track your cards in game and your deck stats',
			icon: `assets/svg/ftue/decktracker.svg`,
			progressIndex: 0,
		},
		{
			id: 'battlegrounds',
			title: 'Battlegrounds',
			text:
				'Our in game helper will appear once you start a game! We will accompany you along your game from hero selection to post match.',
			icon: `assets/svg/ftue/battlegrounds.svg`,
			progressIndex: 1,
		},
		{
			id: 'duels',
			title: 'Duels',
			text:
				'Check global and personal stats, and see a selection of succesful decks for both Casual and Heroic Duels',
			icon: `assets/svg/ftue/duels.svg`,
			progressIndex: 2,
		},
		{
			id: 'replays',
			title: 'Replays',
			text: 'Here you can find all your past games, broken into step by step actions',
			icon: `assets/svg/ftue/replays.svg`,
			progressIndex: 3,
		},
		{
			id: 'achievements',
			title: 'Achievements',
			text: "Challenge yourself throughout the game. Here you'll find all the feats you have accomplished",
			icon: `assets/svg/ftue/achievements.svg`,
			progressIndex: 4,
		},
		{
			id: 'collection',
			title: 'Collection',
			text:
				'Here you can find all the cards in the game, with detailed information (you can even play the sounds they make)',
			icon: `assets/svg/ftue/collection.svg`,
			progressIndex: 5,
		},
	];

	@Input() set selectedModule(value: CurrentAppType) {
		const indexes = this.ftueSteps.map((step) => step.id);
		this.currentIndex = indexes.indexOf(value);
		this.isHome = this.currentIndex < 0;
		// console.log('currentIndex', value, this.currentIndex, indexes, this.ftueSteps, this.isHome);
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

interface FtueStep {
	readonly id: CurrentAppType;
	readonly title: string;
	readonly text: string;
	readonly icon: string;
	readonly progressIndex: number;
}
