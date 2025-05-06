import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Injectable()
export class StatePostProcessService {
	constructor(private readonly allCards: CardsFacadeService) {}
}
