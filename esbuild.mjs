#!/usr/bin/env node

import { context, build } from "esbuild";
import { readdirSync, statSync, existsSync, mkdirSync, cpSync, createWriteStream } from "fs";
import { basename, join, dirname } from "path";
import archiver from "archiver";
import url from "url";
import { rimraf } from "rimraf";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sourceDir = "src";
const buildDir = "build";
const outputDir = "dist";
const modname = basename(__dirname);

const files = readdirSync(sourceDir, { recursive: true })
	.map(file => join(".", sourceDir, file))
	.filter(file => statSync(file).isFile())
	// Exclude .d.ts files.
	.filter(file => !file.endsWith(".d.ts"));

const esbuildArgs = {
	entryPoints: files,
	bundle: false,
	outdir: join(buildDir, modname),
	platform: "node",
	tsconfig: join(__dirname, "tsconfig.json"),
	target: "es2018",
	plugins: [
		{
			name: "create-ccmod",
			setup(build) {
				build.onStart(() => {
					console.log("Building start...");
					// Clear output and build directories.
					if (!existsSync(buildDir))
						mkdirSync(buildDir);
					if (!existsSync(outputDir))
						mkdirSync(outputDir);
					rimraf.sync(`${buildDir}/**/*`, { glob: true });
					rimraf.sync(`${outputDir}/**/*`, { glob: true });
				});

				build.onEnd(async () => {
					const assetsSourcePath = "assets";
					if (existsSync(assetsSourcePath)) {
						const assetsDestPath = join(buildDir, "assets");
						mkdirSync(assetsDestPath, { recursive: true });
						cpSync(assetsSourcePath, assetsDestPath, { recursive: true });
					}
					cpSync(join(__dirname, "ccmod.json"), join(buildDir, "ccmod.json"));

					// Zip dist contents and copy to build directory.
					const outputZip = join(__dirname, outputDir, `${modname}.ccmod`);
					const zipStream = createWriteStream(outputZip);
					const archive = archiver("zip", { zlib: { level: 9 } });

					archive.pipe(zipStream);
					archive.directory(buildDir, false);

					zipStream.on("close", () => {
						// Run the post-step if it exists
						console.log("Building done!");
						if (existsSync("./esbuild-post.mjs")) {
							console.log("Running post-build step...");
							import("./esbuild-post.mjs")
								.then(post => post.default())
								.then(_ => console.log("Post-build step done!"))
						}
					});

					await archive.finalize();
				});
			},
		},
	],
};

if (process.argv[2] == "watch") {
	async function watch() {
		let ctx = await context(esbuildArgs);
		await ctx.watch();
		console.log("Watching...");
	}
	watch();
} else {
	build(esbuildArgs);
}
