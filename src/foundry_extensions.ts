declare global {
	interface LenientGlobalVariableTypes {
		game: never;
		canvas: never;
	}
	interface String {
		/** Localizes the string via the global `game.i18n.localize()` function. */
		localize(): string
	}
	type AnyFunction = (...args: any) => any;
}

export default {};