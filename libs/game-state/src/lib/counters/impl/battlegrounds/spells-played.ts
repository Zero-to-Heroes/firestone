/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

const BUFF_THRESHOLD = 4;

export class SpellsPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bgsSpellsPlayed';
	public override image = CardIds.Groundbreaker_BG31_035;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsSpellsPlayedCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			return !bgState?.currentGame?.availableRaces?.includes(Race.NAGA)
				? null
				: (state.fullGameState?.Player?.PlayerEntity?.tags?.find(
						(tag) => tag.Name === GameTag.NUM_SPELLS_PLAYED_THIS_GAME,
					)?.Value ?? null);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-spells-played-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-spells-played-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override formatValue(value: number | null | undefined): string | null {
		if (value == null) {
			return null;
		}
		// Integer division
		const currentBuff = Math.floor(value / BUFF_THRESHOLD);
		const progress = value % BUFF_THRESHOLD;
		return `${currentBuff} - ${progress}/${BUFF_THRESHOLD}`;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const value = this.player.value(gameState, bgState)!;
		const currentBuff = Math.floor(value / BUFF_THRESHOLD);
		const progress = value % BUFF_THRESHOLD;

		return this.i18n.translateString(`counters.bgs-spells-played.${side}`, {
			buff: currentBuff,
			target: progress,
		});
	}
}
