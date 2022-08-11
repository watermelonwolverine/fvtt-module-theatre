export default class TheatreSettings {

	static NAMESPACE = "theatre";

	// keys
	static REMOVE_LABEL_SHEET_HEADER = "removeLabelSheetHeader";
	static SUPPRESS_OPACITY = "suppressOpacity"
	static SHIFT_PAUSE_ICON = "shiftPauseIcon";
	static THEATRE_IMAGE_SIZE = "theatreImageSize";
	static GM_ONLY = "gmOnly";
	static NARRATOR_HEIGHT = "theatreNarratorHeight";

	// default values
	static THEATRE_IMAGE_SIZE_DEFAULT = 400;

	static getNameLocalizationKey(name: string): string {
		return "Theatre.UI.Settings" + "." + name;
	}

	static getHintLocalizationKey(name: string): string {
		return this.getNameLocalizationKey(name) + "Hint";
	}

	static get<T>(key: string): T {
		return <T>game.settings.get(this.NAMESPACE, key);
	}

	static set<T>(key: string, value: T): void {
		game.settings.set<string, string, T>(this.NAMESPACE, key, value);
	}

	static getRemoteLabelSheetHeader(): boolean {
		return this.get(TheatreSettings.REMOVE_LABEL_SHEET_HEADER);
	}

	static getTheatreImageSize(): string {
		return this.get(TheatreSettings.THEATRE_IMAGE_SIZE);
	}

}
