import { Injectable } from '@angular/core';
import { GameUniqueIdService } from './game-unique-id.service';

@Injectable()
export class BootstrapGameStateService {
	constructor(private readonly init_GameUniqueIdService: GameUniqueIdService) {}
}
