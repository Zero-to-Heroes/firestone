import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { CounterType, GameState, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { CounterDefinition } from './definitions/_counter-definition';
import { AttackCounterDefinition } from './definitions/attack-counter';
import { Si7CounterDefinition } from './definitions/si7-counter';

@Component({
	selector: 'game-counters',
	styleUrls: ['../../../css/component/game-counters/game-counters.component.scss'],
	template: `
		<div
			class="root"
			[ngClass]="{ isBgs: activeCounter?.includes('bgs') }"
			[activeTheme]="'decktracker'"
			*ngIf="definition$ | async as definition"
		>
			<generic-counter
				*ngIf="activeCounter === definition?.type"
				[image]="definition.image"
				[helpTooltipText]="definition.tooltip"
				[value]="definition.value"
				[valueImg]="definition.valueImg"
				[counterClass]="definition.cssClass"
				[standardCounter]="definition.standardCounter"
				[cardTooltip]=""
				[cardTooltipRelatedCardIds]="definition.cardTooltips"
				[side]="side"
			></generic-counter>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCountersComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() activeCounter: CounterType;
	@Input() side: 'player' | 'opponent';

	definition$: Observable<NonFunctionProperties<CounterDefinition<any, any>>>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateFacadeService,
		private readonly bgsState: BgsStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady(), this.gameState.isReady(), this.bgsState.isReady()]);

		const definition = await this.buildDefinition(this.activeCounter, this.side);
		this.definition$ = combineLatest([this.gameState.gameState$$, definition.prefValue$ ?? of(null)]).pipe(
			filter(([state, prefValue]) => !!state),
			map(([state, prefValue]) => ({
				counterInfo: definition.select(state),
				prefValue: prefValue,
			})),
			filter((info) => info?.counterInfo != null),
			this.mapData(
				(info) => definition.emit(info.counterInfo, info.prefValue),
				// Because counters often return an object
				(a, b) => {
					return a?.value === b?.value && a?.type === b?.type && a?.tooltip === b?.tooltip;
				},
			),
		);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async buildDefinition(
		activeCounter: CounterType,
		side: 'player' | 'opponent',
	): Promise<CounterDefinition<GameState, any>> {
		switch (activeCounter) {
			case 'attack':
				return AttackCounterDefinition.create(side, this.allCards, this.i18n);
			case 'si7Counter':
				return Si7CounterDefinition.create(side, this.allCards, this.i18n);
			default:
				console.error('unexpected activeCounter for non-bgs', activeCounter);
		}
	}
}
