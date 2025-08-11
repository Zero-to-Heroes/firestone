import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { CounterInstance, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { auditTime, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'grouped-counters',
	styleUrls: ['./grouped-counters.component.scss'],
	template: `
		<div class="grouped-counters scalable" [ngClass]="{ battlegrounds: isBattlegrounds$ | async }">
			<div class="header" [ngClass]="{ minimized: isMinimized }">
				<div class="title" [fsTranslate]="'counters.grouped.title'"></div>
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
			this.cdr.markForCheck();
		}
	}

	toggleMinimize() {
		this.isMinimized = !this.isMinimized;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
