import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-name',
	styleUrls: ['../../../text.scss', './card-name.component.scss'],
	template: `
		<div class="card-name">
			<img src="{{ banner }}" class="banner" />
			<div class="text" [innerHTML]="textSvg"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardNameComponent {
	banner: string | undefined;
	textSvg: SafeHtml | undefined;

	constructor(private cards: AllCardsService, private domSanitizer: DomSanitizer) {}

	@Input() set cardId(cardId: string) {
		console.debug('[card-name] setting cardId', cardId);
		const originalCard = this.cards.getCard(cardId);
		const cardType: CardType =
			originalCard && originalCard.type ? CardType[originalCard.type.toUpperCase() as string] : undefined;
		this.banner =
			cardType === CardType.HERO_POWER || cardType === CardType.LOCATION || !cardType
				? undefined // Banner already included in frame art
				: `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/name-banner-${CardType[
						cardType
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  ]?.toLowerCase()}.png`;
		this.textSvg = cardType
			? this.domSanitizer.bypassSecurityTrustHtml(this.buildNameSvg(cardType, originalCard.name))
			: undefined;
	}

	private buildNameSvg(cardType: CardType, name: string): string {
		const pathId = `${CardType[cardType]?.toLowerCase()}Path`;
		const path = this.buildPath(cardType, pathId);
		return `
            <svg x="0" y ="0" viewBox="0 0 1000 200" id="svg">
                <defs>${path}</defs>
                <text id="svgText" font-size="97">
                    <textPath startOffset="50%" href="#${pathId}">${name}</textPath>
                </text>
            </svg>`;
	}

	private buildPath(cardType: CardType, pathId: string): string | null {
		switch (cardType) {
			case CardType.MINION:
				return `<path id=${pathId} d="M 0,110 C 30,120 100,120 180,105 M 180,105 C 250,90 750,-35 1000,80" />`;
			case CardType.SPELL:
				return `<path id=${pathId} d="M 0,120 Q 500,-35 1000,120" />`;
			case CardType.LOCATION:
				return `<path id=${pathId} d="M 0,60 Q 500,215 1000,60" />`;
			case CardType.WEAPON:
				return `<path id=${pathId} d="M 0,35 H 1000" />`;
			case CardType.HERO_POWER:
				return `<path id=${pathId} d="M 0,35 H 1000" />`;
			case CardType.HERO:
				return `<path id=${pathId} d="M 0,160 Q 500,-83 1000,160" />`;
			default:
				return null;
		}
	}
}
