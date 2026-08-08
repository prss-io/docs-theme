"use strict";

const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const config = require("../webpack.config");
const clientScriptConfig = require("../clientScript.webpack.config");
const manifest = require("../public/manifest.json");
const pkg = require("../package.json");

const publicFolder = path.resolve(__dirname, "../public");
const buildFolder = path.resolve(__dirname, "../build");
const manifestFile = path.resolve(__dirname, "../build/manifest.json");

const { version, name, license, homepage, description, author = "" } = pkg;
const { title, type, parser, siteVars, isSSR, combinedCSS, clientScript, search } = manifest;

const run = (cfg) =>
  new Promise((resolve, reject) => {
    webpack(cfg).run((err, stats) => {
      if (err) return reject(err);
      if (stats && stats.hasErrors()) {
        return reject(new Error(stats.toString({ all: false, errors: true })));
      }
      resolve(stats);
    });
  });

const copyPublicFolder = () => {
  fs.copySync(publicFolder, buildFolder, {
    dereference: true,
    filter: (file) => !file.includes("manifest.json")
  });
};

const start = async () => {
  fs.emptyDirSync(buildFolder);

  await run(config);
  await run(clientScriptConfig);

  copyPublicFolder();

  const templates = fs
    .readdirSync(buildFolder)
    .filter(
      (file) =>
        file.endsWith(".js") &&
        !file.includes(".js.LICENSE") &&
        !file.includes(".js.map") &&
        file !== "client.js" &&
        file !== "theme.js"
    )
    .map((file) => file.split(".")[0]);

  // Optional starter content shipped with the theme (seeds a real site on create).
  let sampleContent;
  const sampleFile = path.resolve(__dirname, "../public/sample.json");
  if (fs.existsSync(sampleFile)) {
    sampleContent = JSON.parse(fs.readFileSync(sampleFile, "utf8"));
  }

  const newManifest = {
    name,
    title,
    version,
    author: String(author).replace(/ *<[^)]*(\)|>) */g, ""),
    homepage,
    description,
    license,
    type,
    parser,
    siteVars,
    templates,
    isSSR,
    combinedCSS,
    clientScript,
    search,
    ...(sampleContent ? { sampleContent } : {})
  };

  fs.writeFileSync(manifestFile, JSON.stringify(newManifest, null, 2));
  console.log("Docs theme build complete. Templates:", templates.join(", "));
  if (sampleContent) console.log("Bundled starter content (sampleContent).");
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
