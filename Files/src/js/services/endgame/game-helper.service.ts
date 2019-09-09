import { Injectable } from '@angular/core';
import { LZStringService } from 'ng-lz-string';
import { GameForUpload } from './game-for-upload';

@Injectable()
export class GameHelper {
	constructor(private lz: LZStringService) {}

	public setXmlReplay(game: GameForUpload, xml: string) {
		const compressed = this.lz.compress(xml);
		// console.log("Compressed from " + xml.length + " to " + compressed.length);
		game.replay = compressed;
	}

	public getXmlReplay(game: GameForUpload): string {
		return this.lz.decompress(game.replay);
	}
}
