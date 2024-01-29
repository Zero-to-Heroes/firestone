import { Injectable } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';

const ARCHETYPE_ID_FETCH_URL = 'https://mbw3zfj7y4ti3pmb3wxwqdzu7i0vxdjg.lambda-url.us-west-2.on.aws/%deckstring%';

@Injectable()
export class ConstructedArchetypeService {
	constructor(private readonly api: ApiRunner) {}

	public async getArchetypeForDeck(deckstring: string): Promise<number | null> {
		if (!deckstring?.length) {
			return null;
		}

		const start = Date.now();
		const slug = deckstring.replaceAll('/', '-');
		const archetypeId = await this.api.callGetApi<number>(ARCHETYPE_ID_FETCH_URL.replace('%deckstring%', slug));
		console.log('[constructed-archetype] archetypeId', archetypeId, slug, deckstring, 'after', Date.now() - start);
		return archetypeId;
	}
}
