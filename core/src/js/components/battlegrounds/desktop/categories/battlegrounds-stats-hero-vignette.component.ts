import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
} from '@angular/core';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-stats-hero-vignette',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-stats-hero-vignette.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-stats-hero-vignette" [ngClass]="{ 'unused': gamesPlayed === 0 }">
			<div class="wrapper-for-flip" [@flipState]="flip">
				<div class="box-side">
					<div class="hero-name">{{ heroName }}</div>
					<img [src]="icon" class="portrait" />
					<div class="stats">
						<div class="item average-position">
							<div class="label">Average position</div>
							<div class="value">{{ buildValue(averagePosition) }}</div>
						</div>
						<div class="item games-played">
							<div class="label">Games played</div>
							<div class="value">{{ gamesPlayed }}</div>
						</div>
						<div
							class="item mmr"
							[ngClass]="{
								'positive': netMmr > 0,
								'negative': netMmr < 0,
								'missing': buildValue(netMmr) === '-'
							}"
						>
							<div class="label" helpTooltip="Average MMR gain/loss per match">Net MMR</div>
							<div class="value">{{ buildValue(netMmr) }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('flipState', [
			state(
				'active',
				style({
					transform: 'rotateY(179deg)',
				}),
			),
			state(
				'inactive',
				style({
					transform: 'rotateY(0)',
				}),
			),
			transition(
				'active => inactive',
				animate(
					'600ms cubic-bezier(0.65,-0.29,0.40,1.5)',
					keyframes([
						style({ transform: 'rotateY(179deg)', offset: 0 }),
						style({ transform: 'rotateY(0)', offset: 1 }),
					]),
				),
			),
			transition(
				'inactive => active',
				animate(
					'600ms cubic-bezier(0.65,-0.29,0.40,1.5)',
					keyframes([
						style({ transform: 'rotateY(0)', offset: 0 }),
						style({ transform: 'rotateY(179deg)', offset: 1 }),
					]),
				),
			),
		]),
	],
})
export class BattlegroundsStatsHeroVignetteComponent implements AfterViewInit {
	private readonly MOUSE_OVER_DELAY = 300;

	_stat: BgsHeroStat;
	heroName: string;
	icon: string;
	averagePosition: number;
	gamesPlayed: number;
	netMmr: number;

	flip = 'inactive';

	@Input() set stat(value: BgsHeroStat) {
		// console.log('setting stats', value);
		if (!value) {
			return;
		}
		this._stat = value;
		this.heroName = value.name;
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.id}.png?v=3`;
		this.averagePosition = value.playerAveragePosition;
		this.gamesPlayed = value.playerGamesPlayed;
		this.netMmr = value.playerAverageMmr;
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private timeoutHandler;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly elRef: ElementRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildPercents(value: number): string {
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return !value ? '-' : value.toFixed(2);
	}

	// @HostListener('mouseenter') onMouseEnter() {
	// 	this.timeoutHandler = setTimeout(() => {
	// 		this.flip = 'active';
	// 		const rect = this.elRef.nativeElement.getBoundingClientRect();
	// 		if (!(this.cdr as ViewRef)?.destroyed) {
	// 			this.cdr.detectChanges();
	// 		}
	// 	}, this.MOUSE_OVER_DELAY);
	// }

	// @HostListener('mouseleave')
	// onMouseLeave() {
	// 	clearTimeout(this.timeoutHandler);
	// 	this.flip = 'inactive';
	// 	if (!(this.cdr as ViewRef)?.destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }
}
