export default class EaseVerifier {
	static verifyEase(name: string) {
		switch (name) {
			case "power1":
			case "power1Out":
				return Power1.easeOut;
			case "power1In":
				return Power1.easeIn;
			case "power1InOut":
				return Power1.easeInOut;
			case "power2":
			case "power2Out":
				return Power2.easeOut;
			case "power2In":
				return Power2.easeIn;
			case "power2InOut":
				return Power2.easeInOut;

			case "power3":
			case "power3Out":
				return Power3.easeOut;
			case "power3In":
				return Power3.easeIn;
			case "power3InOut":
				return Power3.easeInOut;

			case "power4":
			case "power4Out":
				return Power4.easeOut;
			case "power4In":
				return Power4.easeIn;
			case "power4InOut":
				return Power4.easeInOut;

			case "back":
			case "backOut":
				return Back.easeOut;
			case "backIn":
				return Back.easeIn;
			case "backInOut":
				return Back.easeInOut;

			case "elastic":
			case "elasticOut":
				return Elastic.easeOut;
			case "elasticIn":
				return Elastic.easeIn;
			case "elasticInOut":
				return Elastic.easeInOut;

			case "bounce":
			case "bounceOut":
				return Bounce.easeOut;
			case "bounceIn":
				return Bounce.easeIn;
			case "bounceInOut":
				return Bounce.easeInOut;

			case "circ":
			case "circOut":
				return Circ.easeOut;
			case "circIn":
				return Circ.easeIn;
			case "circInOut":
				return Circ.easeInOut;

			case "expo":
			case "expoOut":
				return Expo.easeOut;
			case "expoIn":
				return Expo.easeIn;
			case "expoInOut":
				return Expo.easeInOut;

			case "sine":
			case "sineOut":
				return Sine.easeOut;
			case "sineIn":
				return Sine.easeIn;
			case "sineInOut":
				return Sine.easeInOut;

			case "power0":
			default:
				return Power0.easeNone;
		}
	}
}
