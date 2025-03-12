import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BoardSecret, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, filter, Observable, switchMap, takeUntil } from 'rxjs';

@Component({
	selector: 'secrets-helper',
	styleUrls: ['../../../css/component/secrets-helper/secrets-helper.component.scss'],
	template: `
		<div
			class="root"
			[activeTheme]="'decktracker'"
			[style.opacity]="opacity$ | async"
			*ngIf="{ active: active$ | async } as value"
			[ngClass]="{ active: value.active }"
		>
			<div class="main-container">
				<secrets-helper-widget-icon class="icon" [active]="value.active"></secrets-helper-widget-icon>
				<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
				<div class="scalable">
					<div class="secrets-helper-container">
						<div class="secrets-helper" [style.width.px]="widthInPx">
							<!-- <div class="background"></div> -->
							<secrets-helper-control-bar [windowId]="windowId"></secrets-helper-control-bar>
							<secrets-helper-list
								[secrets]="secrets$ | async"
								[colorManaCost]="colorManaCost$ | async"
								[cardsGoToBottom]="cardsGoToBottom$ | async"
							>
							</secrets-helper-list>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	opacity$: Observable<number>;
	colorManaCost$: Observable<boolean>;
	cardsGoToBottom$: Observable<boolean>;
	active$: Observable<boolean>;
	secrets$: Observable<readonly BoardSecret[]>;

	windowId: string;
	widthInPx = 227;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.gameState);

		this.active$ = this.gameState.gameState$$.pipe(
			this.mapData((state) => state?.opponentDeck?.secretHelperActive),
		);
		this.secrets$ = this.gameState.gameState$$.pipe(this.mapData((state) => state?.opponentDeck?.secrets));
		this.opacity$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.secretsHelperOpacity / 100));
		this.colorManaCost$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayShowRarityColors));
		this.cardsGoToBottom$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.secretsHelperCardsGoToBottom),
		);

		this.active$
			.pipe(
				filter((active) => active),
				switchMap((show) =>
					combineLatest([
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.secretsHelperScale ?? 100)),
					]),
				),
				takeUntil(this.destroyed$),
			)
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				this.el.nativeElement.style.setProperty('--secrets-helper-scale', newScale);
				this.el.nativeElement.style.setProperty('--secrets-helper-max-height', '22vh');
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
