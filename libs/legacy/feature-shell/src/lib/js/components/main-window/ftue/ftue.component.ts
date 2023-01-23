import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { CurrentAppType } from '../../../models/mainwindow/current-app.type';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { NextFtueEvent } from '../../../services/mainwindow/store/events/ftue/next-ftue-event';
import { PreviousFtueEvent } from '../../../services/mainwindow/store/events/ftue/previous-ftue-event';
import { SkipFtueEvent } from '../../../services/mainwindow/store/events/ftue/skip-ftue-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';

@Component({
	selector: 'ftue',
	styleUrls: [`../../../../css/global/menu.scss`, `../../../../css/component/main-window/ftue/ftue.component.scss`],
	template: `
		<div class="ftue">
			<div class="backdrop"></div>
			<div class="element" *ngIf="isHome">
				<div class="title" [owTranslate]="'ftue.title'"></div>
				<div class="text" [owTranslate]="'ftue.subtitle'"></div>
				<div class="icon home" [inlineSVG]="'assets/svg/ftue/general.svg'"></div>
				<button class="get-started" (click)="next()" growOnClick [owTranslate]="'ftue.start-button'"></button>
				<div
					class="skip-ftue ftue-nav-link"
					(click)="skip()"
					growOnClick
					[owTranslate]="'ftue.skip-button'"
				></div>
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
						[ngClass]="{ active: i === currentIndex }"
					></div>
				</div>
				<div
					class="previous-ftue ftue-nav-link"
					tabindex="0"
					(click)="previous()"
					*ngIf="currentIndex > 0"
					growOnClick
					[owTranslate]="'ftue.previous-button'"
				></div>
				<div
					class="next-ftue ftue-nav-link"
					tabindex="0"
					*ngIf="currentIndex === ftueSteps.length - 1"
					(click)="next()"
					growOnClick
					[owTranslate]="'ftue.done-button'"
				></div>
				<div
					class="next-ftue ftue-nav-link"
					tabindex="0"
					*ngIf="currentIndex !== ftueSteps.length - 1"
					(click)="next()"
					growOnClick
					[owTranslate]="'ftue.next-button'"
				></div>
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
			title: this.i18n.translateString('ftue.steps.decktracker.title'),
			text: this.i18n.translateString('ftue.steps.decktracker.text'),
			icon: `assets/svg/ftue/decktracker.svg`,
			progressIndex: 0,
		},
		{
			id: 'battlegrounds',
			title: this.i18n.translateString('ftue.steps.battlegrounds.title'),
			text: this.i18n.translateString('ftue.steps.battlegrounds.text'),
			icon: `assets/svg/ftue/battlegrounds.svg`,
			progressIndex: 1,
		},
		{
			id: 'duels',
			title: this.i18n.translateString('ftue.steps.duels.title'),
			text: this.i18n.translateString('ftue.steps.duels.text'),
			icon: `assets/svg/ftue/duels.svg`,
			progressIndex: 2,
		},
		{
			id: 'arena',
			title: this.i18n.translateString('ftue.steps.arena.title'),
			text: this.i18n.translateString('ftue.steps.arena.text'),
			icon: `assets/svg/whatsnew/arena.svg`,
			progressIndex: 3,
		},
		{
			id: 'replays',
			title: this.i18n.translateString('ftue.steps.replays.title'),
			text: this.i18n.translateString('ftue.steps.replays.text'),
			icon: `assets/svg/ftue/replays.svg`,
			progressIndex: 4,
		},
		{
			id: 'achievements',
			title: this.i18n.translateString('ftue.steps.achievements.title'),
			text: this.i18n.translateString('ftue.steps.achievements.text'),
			icon: `assets/svg/ftue/achievements.svg`,
			progressIndex: 5,
		},
		{
			id: 'collection',
			title: this.i18n.translateString('ftue.steps.collection.title'),
			text: this.i18n.translateString('ftue.steps.collection.text'),
			icon: `assets/svg/ftue/collection.svg`,
			progressIndex: 6,
		},
	];

	@Input() set selectedModule(value: CurrentAppType) {
		const indexes = this.ftueSteps.map((step) => step.id);
		this.currentIndex = indexes.indexOf(value);
		this.isHome = this.currentIndex < 0;
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly i18n: LocalizationFacadeService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	next() {
		this.stateUpdater.next(new NextFtueEvent());
	}

	previous() {
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
