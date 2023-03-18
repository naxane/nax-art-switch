ig.module("nax-art-switch.keybind")
	.defines(() => {

		sc.OPTIONS_DEFINITION["keys-nax-art-switch"] = {
			type: "CONTROLS",
			init: {
				key1: ig.KEY.F, // whatever key you use here
				key2: undefined,
			},
			// @ts-ignore They're not typed.
			cat: 5 //sc.OPTION_CATERGORY.CONTROLS
		};

		// @ts-ignore
		sc.KEY_OPTION_MAP["nax-art-switch"] = "keys-nax-art-switch";

		// @ts-ignore
		sc.fontsystem.changeGamepadIcon("nax-art-switch", "left-stick-press");
	})