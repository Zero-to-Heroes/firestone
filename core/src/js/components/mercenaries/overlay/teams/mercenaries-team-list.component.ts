import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Zone } from '@firestone-hs/reference-data';
import { Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { BattleMercenary, MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-team-list',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../../../css/component/decktracker/overlay/dim-overlay.scss',
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-list.component.scss',
	],
	template: `
		<perfect-scrollbar class="team-list" [ngClass]="{ 'active': isScroll }">
			<div class="list-background"></div>
			<mercenaries-team-mercenary
				*ngFor="let mercenary of mercenaries"
				[mercenary]="mercenary"
				[tooltipPosition]="tooltipPosition"
			></mercenaries-team-mercenary>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamListComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	@Input() tooltipPosition: boolean;

	@Input() set team(value: MercenariesBattleTeam) {
		this.mercenaries = [...value.mercenaries].sort((a, b) => {
			if (a.zone === Zone.PLAY && b.zone !== Zone.PLAY) {
				return -1;
			} else if (a.zone !== Zone.PLAY && b.zone === Zone.PLAY) {
				return 1;
			}

			if (a.zone === Zone.SETASIDE && b.zone !== Zone.SETASIDE) {
				return -1;
			} else if (a.zone !== Zone.SETASIDE && b.zone === Zone.SETASIDE) {
				return 1;
			}

			if (a.isDead < b.isDead) {
				return -1;
			} else if (a.isDead > b.isDead) {
				return 1;
			}

			if (a.zonePosition < b.zonePosition) {
				return -1;
			} else if (a.zonePosition > b.zonePosition) {
				return 1;
			}
			return 0;
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	mercenaries: readonly BattleMercenary[];
	isScroll: boolean;

	private scaleSub: Subscription;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly store: AppUiStoreFacadeService,
	) {
		super();
		this.scaleSub = this.store
			.listenPrefs$(
				// So that we don't pass scale extractors around, and the overhead of doing the refresh multiple
				// time is low
				(prefs) => prefs.mercenariesPlayerTeamOverlayScale + prefs.mercenariesOpponentTeamOverlayScale,
			)
			.pipe(debounceTime(100), takeUntil(this.destroyed$))
			.subscribe((scale) => this.refreshScroll());
	}

	ngAfterViewInit() {
		this.refreshScroll();
	}

	ngOnDestroy() {
		super.ngOnDestroy();
		this.scaleSub.unsubscribe();
	}

	private refreshScroll() {
		setTimeout(() => {
			const psContent = this.el.nativeElement.querySelector('.ps-content');
			const ps = this.el.nativeElement.querySelector('.ps');
			if (!ps || !psContent) {
				return;
			}
			const contentHeight = psContent.getBoundingClientRect().height;
			const containerHeight = ps.getBoundingClientRect().height;
			this.isScroll = contentHeight > containerHeight;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 500);
	}
}
