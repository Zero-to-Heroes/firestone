import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { distinctUntilChanged } from 'rxjs';
import { BgsReconnectorService } from './bgs-reconnector.service';

@Component({
	selector: 'bgs-reconnector',
	styleUrls: ['./bgs-reconnector.component.scss'],
	template: ` <div class="reconnector battlegrounds-theme">
		<div class="reconnect-button" (click)="reconnect()" *ngIf="!reconnecting">单击重新连接</div>
		<div class="reconnect-button" *ngIf="reconnecting">Reconnecting</div>
		<div class="reconnect-options">
			<checkbox
				class="auto-reconnect"
				[label]="'战斗开始时自动重连'"
				[value]="autoReconnect"
				(valueChanged)="onAutoReconnectChanged($event)"
			></checkbox>
			<checkbox
				class="auto-reconnect-after-boards"
				[ngClass]="{ disabled: !autoReconnect }"
				[label]="'获取对手的阵容后自动重连'"
				[value]="waitAfterBoards"
				(valueChanged)="onWaitAfterBoardsChanged($event)"
			></checkbox>
		</div>
		<div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
	</div>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsReconnectorComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	errorMessage: string | undefined;
	autoReconnect: boolean;
	waitAfterBoards: boolean;
	reconnecting: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly reconnectService: BgsReconnectorService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => ({
					autoReconnect: prefs.bgsReconnectorAutoReconnect,
					waitAfterBoards: prefs.bgsReconnectorAutoReconnectWaitAfterBoards,
				})),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe((prefs) => {
				this.autoReconnect = prefs.autoReconnect;
				this.waitAfterBoards = prefs.waitAfterBoards;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			});
		this.gameState.gameState$$.pipe(this.mapData((state) => state?.reconnectOngoing)).subscribe((reconnecting) => {
			this.reconnecting = reconnecting ?? false;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async reconnect() {
		const status = await this.reconnectService.reconnect();
		if (status === 'Not elevated') {
			this.showErrorMessage('您需要以管理员身份运行 Overwolf 以启用重新连接功能');
		}
	}

	onAutoReconnectChanged(value: boolean) {
		this.prefs.updatePrefs('bgsReconnectorAutoReconnect', value);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onWaitAfterBoardsChanged(value: boolean) {
		this.prefs.updatePrefs('bgsReconnectorAutoReconnectWaitAfterBoards', value);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private showErrorMessage(message: string) {
		this.errorMessage = message;
		setTimeout(() => {
			this.errorMessage = undefined;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}, 5000);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
