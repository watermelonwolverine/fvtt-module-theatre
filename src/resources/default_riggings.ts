import type { RiggingResource } from "./resources_types";

export default class DefaultRiggingResources {
	/**
	 * Default rigging resources
	 *
	 * @return {RiggingResource[]} : An array of {name: (String), path: (String)} tuples
	 *							 representing the default rigging resource map.
	 */
	static get(): RiggingResource[] {
		return [
			// bubbles
			{ name: "angry", path: "modules/theatre/app/graphics/bubbles/angry.png" },
			{ name: "frustrated", path: "modules/theatre/app/graphics/bubbles/frustrated.png" },
			{ name: "annoyed", path: "modules/theatre/app/graphics/bubbles/annoyed.png" },
			{ name: "hearts", path: "modules/theatre/app/graphics/bubbles/hearts.png" },
			{ name: "sleeping", path: "modules/theatre/app/graphics/bubbles/sleeping.png" },
			{ name: "surprised", path: "modules/theatre/app/graphics/bubbles/surprised.png" },
			{ name: "confused", path: "modules/theatre/app/graphics/bubbles/confused.png" },
			{ name: "awe-struck", path: "modules/theatre/app/graphics/bubbles/awe-struck.png" },
			{ name: "kiss", path: "modules/theatre/app/graphics/bubbles/kiss.png" },
			{ name: "blushing", path: "modules/theatre/app/graphics/bubbles/blushing.png" },
			{ name: "cry", path: "modules/theatre/app/graphics/bubbles/cry.png" },
			{ name: "dissatisfied", path: "modules/theatre/app/graphics/bubbles/dissatisfied.png" },
			{ name: "dizzy", path: "modules/theatre/app/graphics/bubbles/dizzy.png" },
			{ name: "evil", path: "modules/theatre/app/graphics/bubbles/evil.png" },
			{ name: "frown", path: "modules/theatre/app/graphics/bubbles/frown.png" },
			{ name: "happy", path: "modules/theatre/app/graphics/bubbles/happy.png" },
			{ name: "grin", path: "modules/theatre/app/graphics/bubbles/grin.png" },
			{ name: "happytears", path: "modules/theatre/app/graphics/bubbles/happytears.png" },
			{ name: "laughing", path: "modules/theatre/app/graphics/bubbles/laughing.png" },
			{ name: "laughingsquint", path: "modules/theatre/app/graphics/bubbles/laughingsquint.png" },
			{ name: "meh", path: "modules/theatre/app/graphics/bubbles/meh.png" },
			{ name: "worried", path: "modules/theatre/app/graphics/bubbles/worried.png" },
			{ name: "panic", path: "modules/theatre/app/graphics/bubbles/panic.png" },
			{ name: "rofl", path: "modules/theatre/app/graphics/bubbles/rofl.png" },
			{ name: "sad", path: "modules/theatre/app/graphics/bubbles/sad.png" },
			{ name: "scared", path: "modules/theatre/app/graphics/bubbles/scared.png" },
			{ name: "smile", path: "modules/theatre/app/graphics/bubbles/smile.png" },
			{ name: "playful", path: "modules/theatre/app/graphics/bubbles/playful.png" },
			{ name: "smug", path: "modules/theatre/app/graphics/bubbles/smug.png" },
			{ name: "tongue", path: "modules/theatre/app/graphics/bubbles/tongue.png" },
			{ name: "wink", path: "modules/theatre/app/graphics/bubbles/wink.png" },
			{ name: "speechless", path: "modules/theatre/app/graphics/bubbles/speechless.png" },
			{ name: "thinking", path: "modules/theatre/app/graphics/bubbles/thinking.png" },
			{ name: "idea", path: "modules/theatre/app/graphics/bubbles/idea.png" },
			{ name: "serious", path: "modules/theatre/app/graphics/bubbles/serious.png" },
			{ name: "innocent", path: "modules/theatre/app/graphics/bubbles/innocent.png" },
			{ name: "carefree", path: "modules/theatre/app/graphics/bubbles/carefree.png" },

			// effects
			{ name: "swirl", path: "modules/theatre/app/graphics/effects/swirl.png" },
			{ name: "sweatdrop", path: "modules/theatre/app/graphics/effects/sweatdrop.png" },
			{ name: "notice", path: "modules/theatre/app/graphics/effects/notice.png" },
			{ name: "loud", path: "modules/theatre/app/graphics/effects/loud.png" },
			{ name: "semiloud", path: "modules/theatre/app/graphics/effects/semi-loud.png" },
			{ name: "veins", path: "modules/theatre/app/graphics/effects/veins.png" },
			{ name: "veins_red", path: "modules/theatre/app/graphics/effects/veins_red.png" },
			{ name: "twisty", path: "modules/theatre/app/graphics/effects/twisty.png" },
			{ name: "glimmer", path: "modules/theatre/app/graphics/effects/glimmer.png" },
			{ name: "heart", path: "modules/theatre/app/graphics/effects/heart.png" },
			{ name: "puff", path: "modules/theatre/app/graphics/effects/puff.png" },
			{ name: "line", path: "modules/theatre/app/graphics/effects/line.png" },
			{ name: "linesteep", path: "modules/theatre/app/graphics/effects/line_steep.png" },
			{ name: "star", path: "modules/theatre/app/graphics/effects/star.png" },
			{ name: "musicnote", path: "modules/theatre/app/graphics/effects/musicnote.png" },
			//{name: "ghostball", path: "modules/theatre/app/graphics/effects/ghostball.png"},
			{ name: "ghostball1", path: "modules/theatre/app/graphics/effects/ghostball1.png" },
			{ name: "ghostball2", path: "modules/theatre/app/graphics/effects/ghostball2.png" },
			{ name: "scribbleball", path: "modules/theatre/app/graphics/effects/scribbleball.png" },
			{ name: "thoughtbubble", path: "modules/theatre/app/graphics/effects/thoughtbubble.png" },
			{ name: "bubbledot", path: "modules/theatre/app/graphics/effects/bubbledot.png" },
			{ name: "dot", path: "modules/theatre/app/graphics/effects/dot.png" },
			{ name: "ziggy", path: "modules/theatre/app/graphics/effects/ziggy.png" },
			{ name: "sinking", path: "modules/theatre/app/graphics/effects/sinking.png" },
			{ name: "zzz", path: "modules/theatre/app/graphics/effects/zzz.png" },
			{ name: "lightbulb", path: "modules/theatre/app/graphics/effects/lightbulb.png" },
			{ name: "sigh", path: "modules/theatre/app/graphics/effects/sigh.png" },
			{ name: "halo", path: "modules/theatre/app/graphics/effects/halo.png" },
			{ name: "blush", path: "modules/theatre/app/graphics/effects/blush.png" },
			{ name: "miasma", path: "modules/theatre/app/graphics/effects/miasma.png" },
			{ name: "darkness", path: "modules/theatre/app/graphics/effects/darkness.png" },
			{ name: "tears", path: "modules/theatre/app/graphics/effects/tears.png" },
		];
	}
}
