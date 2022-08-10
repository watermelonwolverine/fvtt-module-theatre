export default class TheatreSettings {

	static NAMESPACE = "theatre";

	static REMOVE_LABEL_SHEET_HEADER = "removeLabelSheetHeader";
	static SUPPRESS_OPACITY = "suppressOpacity"
	static SHIFT_PAUSE_ICON = "shiftPauseIcon";
	static THEATRE_IMAGE_SIZE = "theatreImageSize";
	static GM_ONLY = "gmOnly";
	static NARRATOR_HEIGHT = "theatreNarratorHeight";

	static get<T>(key: string): T {
		return <T>game.settings.get(this.NAMESPACE, key);
	}

	static set<T>(key: string, value: T): void {
		game.settings.set<string, string, T>(this.NAMESPACE, key, value);
	}

}
