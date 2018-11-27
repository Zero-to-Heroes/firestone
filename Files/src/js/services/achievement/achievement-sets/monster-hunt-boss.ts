import { AllCardsService } from "../../all-cards.service";
import { AbstractBossSetProvider } from "./boss-abstract";
import { AchievementConfService } from "../achievement-conf.service";

export class MonsterHuntBossSetProvider extends AbstractBossSetProvider {

    constructor(cardsService: AllCardsService, conf: AchievementConfService) {
        super(
            'monster_hunt_boss',
            'monster_hunt_category',
            'Monster Hunt',
            ['monster_hunt_boss_encounter', 'monster_hunt_boss_victory'],
            cardsService,
            conf);
    }
}