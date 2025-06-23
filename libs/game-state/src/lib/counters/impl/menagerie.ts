/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState, ShortCard } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class MenagerieCounterDefinitionV2 extends CounterDefinitionV2<readonly ShortCard[]> {
	public override id: CounterType = 'menagerie';
	public override image = CardIds.TheOneAmalgamBand;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.TheOneAmalgamBand,
		CardIds.PowerSlider,
		TempCardIds.SpiritOfTheMountain as unknown as CardIds,
		TempCardIds.MountainMap as unknown as CardIds,
	];

	readonly player = {
		pref: 'playerMenagerieCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.cardsPlayedThisMatch;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.menagerie-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.menagerie-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(value: readonly ShortCard[] | null | undefined): null | undefined | number | string {
		if (!value) {
			return null;
		}
		const allPlayedCards = value.map((c) => this.allCards.getCard(c.cardId));
		const uniqueTribes = extractUniqueTribes(allPlayedCards)
			.map((tribe) => this.i18n.translateString(`global.tribe.${Race[tribe].toLowerCase()}`))
			.sort();
		return uniqueTribes.length;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
		countersUseExpandedView: boolean,
	): string | null {
		const value = this[side]?.value(gameState) ?? 0;
		if (!value) {
			return null;
		}
		const allPlayedCards = value.map((c) => this.allCards.getCard(c.cardId));
		const uniqueTribes = extractUniqueTribes(allPlayedCards)
			.map((tribe) => this.i18n.translateString(`global.tribe.${Race[tribe].toLowerCase()}`))
			.sort();
		const tribeText = countersUseExpandedView ? '<br/>' + uniqueTribes?.join('<br/>') : uniqueTribes.join(', ');
		const tooltip = this.i18n.translateString(`counters.menagerie.${side}`, {
			value: tribeText,
		});
		return tooltip;
	}
}

export const extractUniqueTribes = (allPlayedCards: readonly ReferenceCard[]) => {
	const minionsPlayedWithTribes = allPlayedCards.filter((c) => c.type === 'Minion').filter((c) => !!c.races?.length);
	const minionsToProcess: Mutable<ReferenceCard & { picked?: boolean }>[] = [
		...minionsPlayedWithTribes
			.filter((c) => !c.races!.includes(Race[Race.ALL]))
			.map((c) => ({ ...c, races: [...c.races!] })),
	];

	const uniqueTribes: Race[] = [];
	const maxTribesPerMinion = 2;
	for (let i = 1; i <= maxTribesPerMinion; i++) {
		let dirty = true;
		while (dirty) {
			dirty = false;
			for (let j = 0; j < minionsToProcess.length; j++) {
				const minion = minionsToProcess[j];
				if (!minion.picked && minion.races!.length > 0 && minion.races!.length <= i) {
					const raceToAdd: string = minion.races![0];
					uniqueTribes.push(Race[raceToAdd]);
					// console.debug('added', raceToAdd, uniqueTribes);
					for (const m of minionsToProcess) {
						m.races = m.races!.filter((r) => r !== raceToAdd);
						// console.debug('updates races', m.name, m.races, raceToAdd);
					}
					minion.picked = true;
					dirty = true;
					// Restart the loop, so we're not dependant on the order in which we process things
					j = 0;
				}
			}
			// minionsToProcess = minionsToProcess.filter((c) => !c.picked);
		}
	}

	uniqueTribes.push(
		...minionsPlayedWithTribes
			.filter((m) => m.races!.includes(Race[Race.ALL]))
			.flatMap((m) => m.races!)
			.map((r: string) => Race[r]),
	);
	return uniqueTribes;
};

type Mutable<T> = {
	-readonly [key in keyof T]: T[key];
};
