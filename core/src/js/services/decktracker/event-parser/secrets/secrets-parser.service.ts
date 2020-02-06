import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';
import { TriggerOnAttackSecretsParser } from './trigger-on-attack-secrets-parser';
import { TriggerOnHeroPowerSecretsParser } from './trigger-on-hero-power-secrets-parser';
import { TriggerOnMinionPlaySecretsParser } from './trigger-on-minion-play-secrets-parser';
import { TriggerOnNumCardPlaySecretsParser } from './trigger-on-num-card-play-secrets-parser';
import { TriggerOnSpellPlaySecretsParser } from './trigger-on-spell-play-secrets-parser';

@Injectable()
export class SecretsParserService {
	private secretParsers = this.buildSecretParsers();

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	// In case there is only one secret in play, we can tick the options off based
	// on pure conditions logic
	// Once a secret triggers, we can take all the secrets that were played previously
	// and that didn't trigger (based on the same conditions) and mark them as invalid options
	// BUT while the global trigger condition can be the same (attacking_hero), it's possible
	// that some other conditions (like having space on board) are not met and thus secrets
	// should not be ticked off
	public async parseSecrets(gameState: GameState, gameEvent: GameEvent): Promise<GameState> {
		for (const parser of this.secretParsers) {
			if (parser.applies(gameEvent, gameState)) {
				gameState = await parser.parse(gameState, gameEvent);
			}
		}
		console.log('secrets', gameState.playerDeck.secrets, gameState);
		return gameState;
	}

	private buildSecretParsers(): readonly EventParser[] {
		return [
			new TriggerOnAttackSecretsParser(this.helper, this.allCards),
			new TriggerOnMinionPlaySecretsParser(this.helper, this.allCards),
			new TriggerOnHeroPowerSecretsParser(this.helper, this.allCards),
			new TriggerOnSpellPlaySecretsParser(this.helper, this.allCards),
			new TriggerOnNumCardPlaySecretsParser(this.helper, this.allCards),
			// new CatTrickSecretParser(this.helper, this.allCards),
			// new DartTrapSecretParser(this.helper),
			// new HiddenCacheSecretParser(this.helper, this.allCards),
			// new PressurePlateSecretParser(this.helper, this.allCards),
			// new RatTrapSecretParser(this.helper, this.allCards),
			// new SnipeSecretParser(this.helper, this.allCards),
		];
	}
}
