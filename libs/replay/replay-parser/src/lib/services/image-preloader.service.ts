import { Injectable } from '@angular/core';
import { HistoryItem } from '../models/history/history-item';
import { EntityDefinition } from '../models/parser/entity-definition';
import { AllCardsService } from './all-cards.service';

@Injectable({
	providedIn: 'root',
})
export class ImagePreloaderService {
	// Declare here all the image resources we will need in the app
	public readonly STATIC_IMAGES = {
		// Used in CSS
		enchantmentBanner:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/enchantments/enchantment-banner.png',
		mana: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/mana.png',
		manaSpent: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/mana_spent.png',
		manaLocked: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/mana_locked.png',
		// Used in JS
		raceBanner: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/card/race-banner.png',
		frameMinionPremium:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/frame-minion-premium.png',
		frameHeroPower: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_power.png',
		frameHeroPowerExhausted:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_power_exhausted.png',
		frameHeroPowerPremium:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_power_premium.png',
		frameHeroPowerExhaustedPremium:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_power_exhausted_premium.png',
		onBoardMinionFrame:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/onboard_minion_frame.png',
		onBoardMinionFramePremium:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/onboard_minion_frame_premium.png',
		onBoardMinionTaunt:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/onboard_minion_taunt.png',
		onBoardMinionTauntPremium:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/onboard_minion_taunt_premium.png',
		heroFrame: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_frame.png',
		heroFramePremium:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_frame_premium.png',
		nameBannerSpell: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/name-banner-spell.png',
		nameBannerMinion:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/name-banner-minion.png',
		nameBannerWeapon:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/name-banner-weapon.png',
		weaponSheathed: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/weapon_sheathed.png',
		weaponUnsheathed: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/weapon_unsheathed.png',
		exhausted: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/exhausted.png',
		iconDeathrattle:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/effects/icon_deathrattle.png',
		iconPoisonous: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/effects/icon_poisonous.png',
		iconLifesteal: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/effects/icon_lifesteal.png',
		iconInspire: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/effects/icon_inspire.png',
		iconTrigger: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/effects/icon_trigger.png',
		overlayImmune: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/minion_immune.png',
		overlayDivineShield:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/minion_divine_shield.png',
		overlaySilenced:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/minion_silenced.png',
		overlayFrozen: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/minion_frozen.png',
		overlayStealth: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/minion_stealth.png',
		overlayElusive: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/minion_elusive.png',
		overlayWindfury:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/minion_windfury.png',
		overlayTemporaryEffect:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/minion_temporary_effect.png',
		heroOverlayStealth:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/hero_stealth.png',
		heroOverlayImmune: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/hero_immune.png',
		heroOverlayHeavilyArmored:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/hero_heavily_armored.png',
		heroOverlayFrozen: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/hero_frozen.png',
		enchantmentRing:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/enchantments/enchantment-ring.png',
		rarityCommon: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/card/rarity-common.png',
		rarityRare: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/card/rarity-rare.png',
		rarityEpic: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/card/rarity-epic.png',
		rarityLegendary: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/card/rarity-legendary.png',
		attack: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/attack.png',
		health: 'https://static.zerotoheroes.com/hearthstone/asset/manastorm/health_new.png',
		armor: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/armor.png',
		damage: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/icon_damage.png',
		heal: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/icon_heal.png',
		burned: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/burned.png',
		mulliganDiscard: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/mulligan_discard.png',
		cardback: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/cardback.png',
		quest: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/quest_button.png',
		questBang: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/quest_bang.png',
		questInfo: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/quest_info_arrow.png',
		secretQuestionMark:
			'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/secret_question_mark.png',
		fatigue: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/fatigue.png',
		victoryScreen: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/victory_screen.png',
		lossScreen: 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/loss_screen.png',
	};
	public readonly CLASS_IMAGES = {
		spellFrame: playerClass =>
			`https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/frame-spell-${playerClass}.png`,
		minionFrame: playerClass =>
			`https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/frame-minion-${playerClass}.png`,
		weaponFrame: playerClass =>
			`https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/frame-weapon-${playerClass}.png`,
		secretFrame: playerClass => {
			if (['warlock', 'druid', 'priest', 'neutral'].indexOf(playerClass) !== -1) {
				return null;
			}
			return `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/secret_${playerClass}.png`;
		},
		secretSplash: playerClass => {
			if (['warlock', 'druid', 'priest', 'neutral'].indexOf(playerClass) !== -1) {
				return null;
			}
			return `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/secret_splash_${playerClass}.png`;
		},
		secretBanner: playerClass => {
			if (['warlock', 'druid', 'priest', 'neutral'].indexOf(playerClass) !== -1) {
				return null;
			}
			return `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/secret_banner_${playerClass}.png`;
		},
	};

	constructor(private cards: AllCardsService) {}

	public *preloadImages(history: readonly HistoryItem[]) {
		const imageUrls = this.buildImageUrls(history);
		// yield;
		// // // console.log('preloading ' + imageUrls.length + ' images');
		for (let i = 0; i < imageUrls.length; i++) {
			const imageUrl = imageUrls[i];
			// // // console.log('[image-preloader] preloading image', imageUrl);
			const image = new Image();
			image.onload = () =>
				// // // console.log('[image-preloader] preloaded image', imageUrl);
				(image.src = imageUrl);
			// if (i % 15 === 0) {
			// 	yield;
			// }
		}
		return;
	}

	private buildImageUrls(history: readonly HistoryItem[]): readonly string[] {
		const cardIds = history
			.filter(history => (history as any).entityDefintion)
			.map(history => (history as any).entityDefintion as EntityDefinition)
			.map(def => def.cardID)
			.filter(cardId => cardId);
		const cardArtUrls = cardIds.map(
			cardId => `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
		);

		const staticImageUrls = Object.values(this.STATIC_IMAGES);

		const classes = cardIds
			.map(cardId => this.cards.getCard(cardId))
			.filter(card => card && card.playerClass) // This could happen if the json cards are not in sync, like right after a patch
			.map(card => card.playerClass as string)
			.filter(playerClass => playerClass)
			.map(playerClass => playerClass.toLowerCase());
		const dynamicImageUrls = Object.values(this.CLASS_IMAGES)
			.map(generator => classes.map(playerClass => generator(playerClass)))
			.reduce((a, b) => a.concat(b), []);

		const withDuplications = [...cardArtUrls, ...staticImageUrls, ...dynamicImageUrls];
		return withDuplications.filter((item, index) => withDuplications.indexOf(item) === index);
	}
}
