Folder with new cards: C:\Users\Daedin\Downloads\enUS
That folder contains all the cards that will be added to the next expansion of Hearthstone.
I want you to implement ALL of them as cards as defined in @libs/game-state/src/lib/services/cards/\_card.type.ts. If the card doesn't require any specific implementation, just leave it as an empty skeleton.
First make sure you correctly extract the text for all the cards to be implemented.
Card IDs are not defined yet - please add the missing ids to @libs/shared/framework/core/src/lib/temp-card-ids.ts and use these. Once the expansion is officially out, I will remove them from TempCardIds and use the real id.
Also create a table that lists all the cards, their text, and link to their implementation in-repo so I can check each of them afterwards. Update that doc as you implement new cards. Add comments if some cards can't be implemented correctly yet because they require some more stuff in the repo
And try to keep things as simple as possible, you shouldn't need to update much outside of the cards/ structure, and maybe add additional cases to existing switches, or selectors - if things start getting complex, please flag this in the recap table, so I can pay extra attention.

See also @docs/NEW_CARD.md for additional instructions

add the tracking doc to another file - you shouldn't modify @NEW_CARDS.md
