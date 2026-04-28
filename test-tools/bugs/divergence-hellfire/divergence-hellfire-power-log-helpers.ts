/**
 * **`divergence-hellfire.log`** ends right after the opponent plays the **second** Divergence hand half
 * (**entity 146**): last line is `PowerProcessor.EndCurrentTaskList` for task list **679**.
 * `card-played-from-hand-parser` / `processCardLinks` then leaves **entity 26** (actually Hellfire later in the
 * match) showing {@link SPLIT_MINION_CARD_ID} — the visible bug.
 *
 * Splitting both pieces to hand (Divergence task **379** alone) does **not** flip row 26; the bad link shows up
 * once the linked half is played from hand.
 *
 * **Full last game:** `divergence-hellfire-full-last-game.log`.
 */
import { CardIds } from '@firestone-hs/reference-data';

/** Entity id of the unrelated hand row wrongly linked to the split minion in this fixture. */
export const WRONG_ROW_ENTITY_ID = 26;

/** Line count of committed `divergence-hellfire.log`; last line ends task list 679 (play of split entity 146). */
export const HAND_SPLIT_FIXTURE_LINE_COUNT = 20402;

/** Card id of the split minion halves in this match (shown later in the full log on PLAY). */
export const SPLIT_MINION_CARD_ID = CardIds.Agamaggan_EDR_489;

/** True identity of {@link WRONG_ROW_ENTITY_ID} after reveal in the full game log. */
export const HELLFIRE_CARD_ID_GROUND_TRUTH = 'CORE_CS2_062';
