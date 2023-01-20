import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { getTribeName } from '../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'bgs-banned-tribes',
	styleUrls: [
		`../../../css/themes/battlegrounds-theme.scss`,
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
					>{{ tribe }}</bgs-banned-tribe
				>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribesComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	tribes$: Observable<readonly Race[]>;
	tooltip$: Observable<string>;
	orientation$: Observable<'row' | 'column'>;
	showAvailable$: Observable<boolean>;
	singleRow$: Observable<boolean>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showAvailable$ = this.listenForBasicPref$((prefs) => prefs.bgsShowAvailableTribesOverlay);
		this.singleRow$ = this.listenForBasicPref$((prefs) => prefs.bgsTribesOverlaySingleRow);
		this.tribes$ = combineLatest(
			this.store.listenBattlegrounds$(([state]) => state),
			this.showAvailable$,
		).pipe(
			this.mapData(([[state], showAvailable]) =>
				showAvailable ? state?.currentGame?.availableRaces : state?.currentGame?.bannedRaces,
			),
		);
		this.tooltip$ = combineLatest(this.tribes$, this.showAvailable$).pipe(
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
		this.orientation$ = this.store
			.listen$(([main, nav, prefs]) => prefs.bgsBannedTribesShowVertically)
			.pipe(this.mapData(([pref]) => (pref ? 'column' : 'row') as 'row' | 'column'));
		this.store
			.listen$(([main, nav, prefs]) => prefs.bgsBannedTribeScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((scale) => {
				// this.el.nativeElement.style.setProperty('--bgs-banned-tribe-scale', scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
			});
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
