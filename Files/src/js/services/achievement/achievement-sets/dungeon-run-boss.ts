import { AllCardsService } from "../../all-cards.service";
import { AbstractBossSetProvider } from "./boss-abstract";
import { AchievementConfService } from "../achievement-conf.service";

export class DungeonRunBossSetProvider extends AbstractBossSetProvider {

    constructor(cardsService: AllCardsService, conf: AchievementConfService) {
        super(
            'dungeon_run_boss', 
            'achievements_boss',
            'Bosses', 
            ['dungeon_run_boss_encounter', 'dungeon_run_boss_victory'],
            cardsService,
            conf);
    }
}