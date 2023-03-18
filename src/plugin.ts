import { Mod, PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod';

export default class ModuleCache implements PluginClass {
	mod: Mod;

	constructor(mod: Mod) {
		this.mod = mod;
	}

	prestart() {
		window.moduleCache.registerModPrefix("nax-art-switch", this.mod.baseDirectory.substring(7));
		ig._loadScript("nax-art-switch.keybind");
	}
	poststart() {
		ig._loadScript("nax-art-switch.switch");
	}
}