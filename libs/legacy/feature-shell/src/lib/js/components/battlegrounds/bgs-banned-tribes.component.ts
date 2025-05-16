import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { Race, getTribeName } from '@firestone-hs/reference-data';
import { compareTribes } from '@firestone/battlegrounds/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	selector: 'bgs-banned-tribes',
	styleUrls: [
		// `../../../css/themes/battlegrounds-theme.scss`,
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/bgs-banned-tribes.component.scss',
	],
	template: `
		<div class="root scalable" [activeTheme]="'battlegrounds'">
			<div
				*ngIf="tribes$ | async as tribes"
				class="banned-tribes {{ orientation$ | async }}"
				[ngClass]="{ available: showAvailable$ | async, 'single-row': singleRow$ | async }"
				[helpTooltip]="tooltip$ | async"
				helpTooltipPosition="bottom"
			>
				<bgs-banned-tribe
					*ngFor="let tribe of tribes; trackBy: trackByFn"
					[tribe]="tribe"
					[available]="showAvailable$ | async"
					[useTribeColors]="useTribeColors$ | async"
					>{{ tribe }}</bgs-banned-tribe
				>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	tribes$: Observable<readonly Race[]>;
	useTribeColors$: Observable<boolean>;
	tooltip$: Observable<string>;

	orientation$: Observable<'row' | 'column'>;
	showAvailable$: Observable<boolean>;
	singleRow$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.gameState);

		this.showAvailable$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowAvailableTribesOverlay)),
			this.gameState.gameState$$,
		]).pipe(this.mapData(([pref, state]) => pref || state?.bgState.currentGame?.availableRaces?.length == 1));
		this.useTribeColors$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsUseBannedTribeColors));
		this.singleRow$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsTribesOverlaySingleRow));
		this.tribes$ = combineLatest([this.gameState.gameState$$, this.showAvailable$]).pipe(
			this.mapData(([state, showAvailable]) => {
				const tribes = showAvailable
					? state?.bgState.currentGame?.availableRaces
					: state?.bgState.currentGame?.bannedRaces;
				return [...(tribes ?? [])].sort((a, b) => compareTribes(a, b, this.i18n));
			}),
		);
		this.tooltip$ = combineLatest([this.tribes$, this.showAvailable$]).pipe(
			filter(([tribes, showAvailable]) => !!tribes?.length),
			this.mapData(([tribes, showAvailable]) => {
				const tribeNames = tribes.map((tribe) => getTribeName(tribe, this.i18n)).join(', ');
				if (showAvailable) {
					return this.i18n.translateString('battlegrounds.banned-tribes.available-tooltip', {
						tribeNames: tribeNames,
					});
				}

				const exceptionCards = tribes
					.map((tribe) => this.getExceptions(tribe))
					.reduce((a, b) => a.concat(b), []);
				const exceptions =
					exceptionCards && exceptionCards.length > 0
						? this.i18n.translateString('battlegrounds.banned-tribes.exceptions', {
								value: exceptionCards.join(', '),
						  })
						: '';
				const tooltip = this.i18n.translateString('battlegrounds.banned-tribes.exceptions-tooltip', {
					tribeNames: tribeNames,
					exceptions: exceptions,
				});
				return tooltip;
			}),
		);
		this.orientation$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => (prefs.bgsBannedTribesShowVertically ? 'column' : 'row') as 'row' | 'column'),
		);
		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsBannedTribeScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index: number, item: Race) {
		return item;
	}

	private getExceptions(value: Race): string[] {
		switch (value) {
			case Race.BEAST:
				return [];
			case Race.DEMON:
				return [];
			case Race.DRAGON:
				return [];
			case Race.MECH:
				return [];
			case Race.MURLOC:
				return [];
			case Race.PIRATE:
				return [];
			case Race.ELEMENTAL:
				return [];
			case Race.QUILBOAR:
				return [];
			case Race.NAGA:
				return [];
			case Race.UNDEAD:
				return [];
		}
		return [];
	}
}
