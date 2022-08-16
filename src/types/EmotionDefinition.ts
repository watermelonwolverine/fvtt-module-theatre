export default class EmotionDefinition {
    emote: string;
    textFlyin: string;
    textStanding: string;
    textFont: string;
    textSize: number;
    textColor: string;

    constructor(
        emote: string = null,
        textFlying: string = null,
        textStanding: string = null,
        textFont: string = null,
        textSize: number = null,
        textColor: string = null) {
            
        this.emote = emote;
        this.textFlyin = textFlying;
        this.textStanding = textStanding;
        this.textFont = textFont;
        this.textSize = textSize;
        this.textColor = textColor;
    }
}