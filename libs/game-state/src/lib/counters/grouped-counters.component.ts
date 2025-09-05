import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { auditTime, Observable } from 'rxjs';
import { GameStateFacadeService } from '../services/game-state-facade.service';
import { CounterInstance } from './_counter-definition-v2';

@Component({
	standalone: false,
	selector: 'grouped-counters',
	styleUrls: ['./grouped-counters.component.scss'],
	template: `
		<div class="grouped-counters scalable" [ngClass]="{ battlegrounds: isBattlegrounds$ | async }">
			<div class="header" [ngClass]="{ minimized: isMinimized }">
				<div class="title">Counters</div>
				<div class="minimize-container" (click)="toggleMinimize()">
					<div class="minimize" [inlineSVG]="'assets/svg/caret.svg'"></div>
				</div>
			</div>
			<div class="content" *ngIf="!isMinimized">
				<grouped-counters-side
					class="player side"
					[side]="'player'"
					[counters]="playerCounters"
				></grouped-counters-side>
				<grouped-counters-side
					class="opponent side"
					[side]="'opponent'"
					[counters]="opponentCounters"
				></grouped-counters-side>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedCountersComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	@Input() playerCounters: readonly CounterInstance<any>[];
	@Input() opponentCounters: readonly CounterInstance<any>[];

	isBattlegrounds$: Observable<boolean>;

	isMinimized: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterViewInit() {
		await this.prefs.isReady();

		this.isBattlegrounds$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => isBattlegrounds(state.metadata?.gameType)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleMinimize() {
		this.isMinimized = !this.isMinimized;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
