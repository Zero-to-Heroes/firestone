import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewRef,
} from '@angular/core';
import { InGameReplayService, ReplayStatus } from '@firestone/mods/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'in-game-replay-widget',
	styleUrls: ['../../../../css/component/overlays/replay/in-game-replay-widget.component.scss'],
	template: `
		<div class="replay-controls">
			<img class="logo" src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/tray_icon.png" />

			<div class="progress-section">
				<div class="progress-bar">
					<div class="progress-fill" [style.width.%]="progressPercent"></div>
				</div>
				<div class="status-line">{{ statusText }}</div>
			</div>

			<div class="buttons">
				<button class="control-btn play-pause" (click)="togglePlayPause()" [attr.aria-label]="isPaused ? 'Play' : 'Pause'">
					<span *ngIf="isPaused">&#9654;</span>
					<span *ngIf="!isPaused">&#8214;</span>
				</button>

				<div class="speed-group">
					<button class="control-btn speed-btn" (click)="speedDown()" aria-label="Slow down">&#8722;</button>
					<span class="speed-label">{{ speedLabel }}</span>
					<button class="control-btn speed-btn" (click)="speedUp()" aria-label="Speed up">+</button>
				</div>

				<button class="control-btn play-again" (click)="playAgain()" aria-label="Play again">&#8634;</button>
				<button class="control-btn leave-btn" (click)="leaveReplay()">Leave</button>
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
	private currentSpeed = 1;

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

	togglePlayPause(): void {
		if (this.isPaused) {
			this.replayService.resume();
		} else {
			this.replayService.pause();
		}
	}

	speedDown(): void {
		this.replayService.setSpeed(this.currentSpeed * 0.5);
	}

	speedUp(): void {
		this.replayService.setSpeed(this.currentSpeed * 2);
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
		this.currentSpeed = status.speed ?? 1;
		this.speedLabel = `${this.currentSpeed.toFixed(1)}x`;

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
