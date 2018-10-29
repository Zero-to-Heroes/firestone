import { AllCardsService } from "../../all-cards.service";
import { AbstractBossSetProvider } from "./boss-abstract";

export class MonsterHuntBossSetProvider extends AbstractBossSetProvider {

    constructor(cardsService: AllCardsService) {
        super(
            'monster_hunt_boss',
            'monster_hunt_category',
            'Monster Hunt',
            ['monster_hunt_boss_encounter', 'monster_hunt_boss_victory'],
            cardsService);
    }
}