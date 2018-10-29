import { AllCardsService } from "../../all-cards.service";
import { AbstractBossSetProvider } from "./boss-abstract";

export class DungeonRunBossSetProvider extends AbstractBossSetProvider {

    constructor(cardsService: AllCardsService) {
        super(
            'dungeon_run_boss', 
            'dungeon_run_category',
            'Dungeon Boss', 
            ['dungeon_run_boss_encounter', 'dungeon_run_boss_victory'],
            cardsService);
    }
}