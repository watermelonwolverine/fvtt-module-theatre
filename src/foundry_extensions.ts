declare global {
	interface LenientGlobalVariableTypes {
		game: never;
		canvas: never;
		ui: never;
	}
	interface String {
		/** Localizes the string via the global `game.i18n.localize()` function. */
		localize(): string
	}
	interface HTMLElement {
		currentStyle: CSSStyleDeclaration;
	}
	type AnyFunction = (...args: any) => any;

}

export class PIXIText extends PIXI.Text{
	theatreComponentName: string;
}

export class PIXISprite extends PIXI.Sprite{
	theatreComponentName: string;
}

export interface PIXILabel extends PIXI.Text{
	theatreComponentName: string;
}

export default interface Resources extends Partial<Record<string, PIXI.LoaderResource>> { }




