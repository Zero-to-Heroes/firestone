import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';
import { BearTrapSecretParser } from './hunter/bear-trap-secret-parser';
import { CatTrickSecretParser } from './hunter/cat-trick-secret-parser';
import { DartTrapSecretParser } from './hunter/dart-trap-secret-parser';
import { ExplosiveTrapSecretParser } from './hunter/explosive-trap-secret-parser';
import { FreezingTrapSecretParser } from './hunter/freezing-trap-secret-parser';
import { HiddenCacheSecretParser } from './hunter/hidden-cache-secret-parser';
import { MisdirectionSecretParser } from './hunter/misdirection-secret-parser';
import { PressurePlateSecretParser } from './hunter/pressure-plate-secret-parser';
import { RatTrapSecretParser } from './hunter/rat-trap-secret-parser';
import { SnakeTrapSecretParser } from './hunter/snake-trap-secret-parser';
import { SnipeSecretParser } from './hunter/snipe-secret-parser';
import { VenomstrikeTrapSecretParser } from './hunter/venomstrike-trap-secret-parser';
import { WanderingMonsterSecretParser } from './hunter/wandering-monster-secret-parser';
@Injectable()
export class SecretsParserService {
	// https://hearthstone.gamepedia.com/Advanced_rulebook#Combat
	private secretParsers = this.buildSecretParsers();
	// private slowSecretParsers = this.buildSlowSecretParsers();

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

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
			new FreezingTrapSecretParser(this.helper, this.allCards),
			new ExplosiveTrapSecretParser(this.helper),
			new BearTrapSecretParser(this.helper),
			new CatTrickSecretParser(this.helper, this.allCards),
			new DartTrapSecretParser(this.helper),
			new HiddenCacheSecretParser(this.helper, this.allCards),
			new MisdirectionSecretParser(this.helper),
			new PressurePlateSecretParser(this.helper, this.allCards),
			new RatTrapSecretParser(this.helper, this.allCards),
			new SnakeTrapSecretParser(this.helper),
			new SnipeSecretParser(this.helper, this.allCards),
			new VenomstrikeTrapSecretParser(this.helper),
			new WanderingMonsterSecretParser(this.helper),
		];
	}
}
