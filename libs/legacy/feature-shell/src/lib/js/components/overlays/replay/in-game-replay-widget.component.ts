import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { InGameReplayService, ReplayStatus } from '@firestone/mods/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'in-game-replay-widget',
	styleUrls: ['./in-game-replay-widget.component.scss'],
	template: `
		<div class="replay-widget" [ngClass]="{ collapsed: collapsed }">
			<!-- Header row: always visible -->
			<div class="header" (mousedown)="onHeaderMouseDown($event)" (click)="onHeaderClick($event)">
				<img
					class="logo"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/tray_icon.png"
				/>
				<span class="time">{{ statusText }}</span>
				<button
					class="control-btn play-pause"
					(click)="togglePlayPause(); $event.stopPropagation()"
					[attr.aria-label]="isPaused ? 'Play' : 'Pause'"
				>
					<span *ngIf="isPaused">&#9654;</span>
					<span *ngIf="!isPaused">&#8214;</span>
				</button>
				<span class="collapse-icon">{{ collapsed ? '&#9660;' : '&#9650;' }}</span>
			</div>

			<!-- Expanded body -->
			<div class="body" *ngIf="!collapsed">
				<div class="progress-bar">
					<div class="progress-fill" [style.width.%]="progressPercent"></div>
				</div>

				<div class="controls-row">
					<div class="speed-group">
						<button class="control-btn speed-btn" (click)="speedDown()" aria-label="Slow down">
							&#8722;
						</button>
						<span class="speed-label">{{ speedLabel }}</span>
						<button class="control-btn speed-btn" (click)="speedUp()" aria-label="Speed up">+</button>
					</div>

					<button class="control-btn icon-btn" (click)="playAgain()" aria-label="Play again">&#8634;</button>
					<button class="control-btn text-btn" (click)="leaveReplay()">Leave</button>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InGameReplayWidgetComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	progressPercent = 0;
	statusText = '';
	isPaused = false;
	speedLabel = '1.0x';
	collapsed = false;
	private currentSpeed = 1;
	private lastLocalSpeedChange = 0;
	private mouseDownPos: { x: number; y: number } | null = null;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly replayService: InGameReplayService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.replayService);

		this.replayService.status$$.pipe(this.mapData((s) => s)).subscribe((status) => {
			this.updateFromStatus(status);
		});
	}

	onHeaderMouseDown(event: MouseEvent): void {
		this.mouseDownPos = { x: event.clientX, y: event.clientY };
	}

	onHeaderClick(event: MouseEvent): void {
		if (!this.mouseDownPos) {
			return;
		}
		const dx = Math.abs(event.clientX - this.mouseDownPos.x);
		const dy = Math.abs(event.clientY - this.mouseDownPos.y);
		this.mouseDownPos = null;
		if (dx > 5 || dy > 5) {
			return;
		}
		this.collapsed = !this.collapsed;
	}

	togglePlayPause(): void {
		this.isPaused = !this.isPaused;
		if (!this.isPaused) {
			this.replayService.resume();
		} else {
			this.replayService.pause();
		}
	}

	speedDown(): void {
		this.applySpeed(this.currentSpeed * 0.5);
	}

	speedUp(): void {
		this.applySpeed(this.currentSpeed * 2);
	}

	private applySpeed(speed: number): void {
		this.currentSpeed = speed;
		this.speedLabel = `${speed.toFixed(1)}x`;
		this.lastLocalSpeedChange = Date.now();
		this.replayService.setSpeed(speed);
	}

	playAgain(): void {
		this.replayService.playAgain();
	}

	leaveReplay(): void {
		this.replayService.leave();
	}

	private updateFromStatus(status: ReplayStatus): void {
		const elapsed = status.elapsed ?? 0;
		const total = status.total ?? 0;
		this.progressPercent = total > 0 ? (elapsed / total) * 100 : 0;
		this.isPaused = status.state === 'paused';

		const recentLocalChange = Date.now() - this.lastLocalSpeedChange < 2000;
		if (!recentLocalChange) {
			this.currentSpeed = status.speed ?? 1;
			this.speedLabel = `${this.currentSpeed.toFixed(1)}x`;
		}

		const elapsedMin = Math.floor(elapsed / 60);
		const elapsedSec = Math.floor(elapsed % 60);
		const totalMin = Math.floor(total / 60);
		const totalSec = Math.floor(total % 60);
		const pad = (n: number) => n.toString().padStart(2, '0');
		this.statusText = `${elapsedMin}:${pad(elapsedSec)} / ${totalMin}:${pad(totalSec)}`;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
