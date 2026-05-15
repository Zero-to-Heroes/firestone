/**
 * Ground truth from support power.log (71738f3b…): player 2 plays Mimicry (EDR_522, entity 102).
 * PowerTaskList ~18:41:53: copies go to player 2 hand as id=113 (TIME_009) and id=114 (TIME_009t2); the mirrored
 * draws remove the source rows from player 1’s deck into player 1’s hand as id=16 and id=7 (see COPIED_FROM_ENTITY_ID
 * on 113/114). From the **caster’s** client, those P1 cards are {@link GameState.opponentDeck}.
 *
 * Bug report (French): the **second** Mimicry-driven card is not revealed in the opponent’s hand — expect id=7
 * (TIME_009t2) to be the fragile slot; id=16 should be Gelbin (TIME_009).
 */
import { CardIds } from '@firestone-hs/reference-data';

/** Player 1 hand entity ids after Mimicry resolves (PowerTaskList), with public CardIDs from the same block. */
export const MIMICRY_EXPECTED_OPPONENT_VICTIM_HAND_SLOTS: readonly {
	readonly entityId: number;
	readonly cardId: string;
}[] = [
	{ entityId: 16, cardId: CardIds.GelbinOfTomorrow_TIME_009 },
	{ entityId: 7, cardId: CardIds.GelbinOfTomorrow_MekkatorquesAuraToken_TIME_009t2 },
];

const FIXTURE_P1_FIRST_DRAW = /TAG_CHANGE Entity=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=16 zone=DECK zonePos=0 cardId= player=1\] tag=ZONE value=HAND/;
const FIXTURE_P1_SECOND_DRAW = /TAG_CHANGE Entity=\[entityName=Aura de Mekkanivelle id=7 zone=DECK zonePos=0 cardId= player=1\] tag=ZONE value=HAND/;

/** Fails fast if the on-disk log no longer contains the documented Mimicry draws to player 1’s hand. */
export function assertMimicryFixtureContainsExpectedShowEntities(rawLogText: string): void {
	expect(rawLogText).toEqual(expect.stringMatching(FIXTURE_P1_FIRST_DRAW));
	expect(rawLogText).toEqual(expect.stringMatching(FIXTURE_P1_SECOND_DRAW));
}
