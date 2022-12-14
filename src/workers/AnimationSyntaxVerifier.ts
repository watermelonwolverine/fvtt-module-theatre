export type PropDef = {
	name: string;
	initial: string;
	final: string;
};

export type TweenParams = {
	resName: string;
	duration: number;
	advOptions: { [key: string]: string };
	props: PropDef[];
};

export class AnimationSyntaxVerifier {
	/**
	 * Return an array of tween params if the syntax is correct,
	 * else return an empty array if any tweens in the syntax
	 * are flag as incorrect.
	 *
	 * @param str (String) : The syntax to verify
	 *
	 * @return (Array[Object]) : The array of verified tween params, or null
	 */
	static verifyAnimationSyntax(str: string): TweenParams[] {
		if (!str || typeof str != "string") {
			throw "IllegalArgumentException: " + str;
		}

		let tweenParams: TweenParams[] = [];

		try {
			const sections: string[] = str.split("|");
			const resName = <string>sections[0];

			let verifyTarget = (...args: any[]) => {
				// TODO verify each property
				return true;
			};

			for (let sdx = 1; sdx < sections.length; ++sdx) {
				// if(!sections[sdx]){
				//   continue;
				// }
				let parts = sections[sdx]?.split(";");
				if (!parts || parts.length == 0) {
					continue;
				}
				let idx = 0;

				const duration = Number(parts[idx]) || 1;

				let advOptionsStr: string = "";
				const advOptions: { [key: string]: string } = {};
				let optionToCheck = <string>parts[++idx];

				if (/\([^\)\(]*\)/g.test(optionToCheck)) {
					advOptionsStr = <string>parts[idx];
					idx++;
				}
				if (advOptions) {
					advOptionsStr = advOptionsStr.replace(/[\(\)]/g, "");
					let advParts = advOptionsStr.split(",");
					for (let advPart of advParts) {
						let components = advPart.split(":");
						if (components.length != 2) {
							throw "component properties definition : " + advPart + " is incorrect";
						}
						let advPropName = <string>components[0]?.trim();
						let advPropValue = <string>components[1]?.trim();
						if (advPropName) {
							advOptions[advPropName] = advPropValue;
						}
					}
				}

				const targets: string[] = [];
				const propDefs: PropDef[] = [];
				for (let jdx = 0; jdx < parts.length; ++jdx) {
					targets.push(<string>parts[jdx]);
				}
				for (let target of targets) {
					let components = target.split(":");
					if (components.length != 2) {
						throw "component properties definition : " + target + " is incorrect";
					}
					let propName = <string>components[0];
					let scomps = <string[]>components[1]?.split(",");
					if (scomps.length != 2) {
						throw "component properties definition : " + target + " is incorrect";
					}
					let init = <string>scomps[0];
					let fin = <string>scomps[1];
					if (verifyTarget(propName, init, fin)) {
						let propDef = {
							name: propName,
							initial: init,
							final: fin,
						};
						propDefs.push(propDef);
					} else throw "component properties definition : " + target + " is incorrect";
				}
				tweenParams.push({
					resName: resName,
					duration: duration,
					advOptions: advOptions,
					props: propDefs,
				});
			}
		} catch (e) {
			console.warn("BAD ANIMATION SYNTAX: %s", e);
			return tweenParams;
		}

		return tweenParams;
	}
}
