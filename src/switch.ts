ig.module("nax-art-switch.switch")
	.requires(
		"game.feature.player.player-model",
		"game.feature.model.options-model",
		"game.feature.control.control"
	)
	.defines(() => {

		type skill = {
			branchType: "A" | "B";
			classId: number;
			element: number;
			id: number;
			level: number;
			skillKey: string;
			skillType: "THROW" | "GUARD" | "ATTACK" | "DASH";
			type: number;
		};

		type hash = string;
		const skills: { [index: hash]: skill } = {};
		const pairs: { [index: hash]: hash } = {};


		// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
		function simpleHash(input: string): hash {
			var hash = 0, i, chr;
			if (input.length === 0) return hash.toString();
			for (i = 0; i < input.length; i++) {
				chr = input.charCodeAt(i);
				hash = ((hash << 5) - hash) + chr;
				hash |= 0; // Convert to 32bit integer
			}
			return hash.toString();
		}

		function skillHash(skill: skill) {
			return simpleHash(skill.skillKey + "|" + skill.element + "|" + skill.level);
		}

		function getOther(skill: skill): hash {
			let skillKey = "";
			if (skill.skillKey.substring(-1) === "A") {
				skillKey = skill.skillKey.replace(/.$/, "B");
			}
			else {
				skillKey = skill.skillKey.replace(/.$/, "A");
			}
			return simpleHash(skillKey + "|" + skill.element + "|" + skill.level);
		}

		function* getAllArts() {
			//@ts-ignore
			for (let i = 0; i < sc.skilltree.skills.length; i++) {
				//@ts-ignore
				yield sc.skilltree.getSkill(i);
			};
		}

		[...getAllArts()]
			.filter((skill: skill) => skill.skillType)
			.map((skill: skill) => {
				const hash = skillHash(skill);
				//console.log(hash);
				skills[hash] = skill;
				if (skill.branchType == "B") {
					const other = getOther(skill);
					pairs[hash] = other;
					pairs[other] = hash;
				}
				return { skill, hash };
			})
			.forEach(({ skill, hash }) => {
				if (skill.branchType === "A" && !skills[pairs[hash]]) {
					delete skills[hash];
				}
			});

		function swapSingle(skillId: number, offset: number) {
			// @ts-ignore
			if (sc.model.player.skills[skillId]) {
				// @ts-ignore
				sc.model.player.skills[skillId] = null;
				// @ts-ignore
				sc.model.player.skills[skillId + offset] = sc.skilltree.skills[skillId + offset];
			} else {
				// @ts-ignore
				sc.model.player.skills[skillId + offset] = null;
				// @ts-ignore
				sc.model.player.skills[skillId] = sc.skilltree.skills[skillId];
			}
		}

		function swapAll() {
			const swapped: hash[] = [];
			Object.keys(skills).forEach(hash => {
				if (!swapped.includes(hash)) {
					swapped.push(hash, pairs[hash]);
					//console.log(skills[hash]);

					let id = skills[hash].id;
					// @ts-ignore
					swapSingle(id, skills[pairs[hash]].id - id);
				}
			});


			// @ts-ignore
			sc.model.player.updateStats()
			// @ts-ignore
			sc.Model.notifyObserver(sc.model, sc.PLAYER_MSG.SKILL_BRANCH_SWAP);
		}

		// @ts-ignore
		sc.GlobalInput.inject({
			onPostUpdate() {
				this.parent();
				if (
					!ig.loading &&
					// @ts-ignore
					!sc.model.isPaused() &&
					// @ts-ignore
					!sc.model.isCutscene() &&
					// @ts-ignore
					sc.model.isRunning() &&
					// @ts-ignore
					(ig.input.pressed("nax-art-switch") || ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_STICK)
					)
				) {
					// Key bind stuff goes here
					swapAll();

					// Particle event stuff here

					const steps = [];
					steps.push({
						type: "SHOW_EFFECT",
						entity: ig.game.playerEntity,
						effect: {
							"sheet": "scene.hacking",
							"name": "shredderHack"
						}
					});
					// @ts-ignore
					const event = new ig.Event({ steps });
					// @ts-ignore
					event.addHint("SKIN_ALLOWED");
					// @ts-ignore
					ig.game.events.callEvent(event, ig.EventRunType.PARALLEL)
				}
			}
		});
	});