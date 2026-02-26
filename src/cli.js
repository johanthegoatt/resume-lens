import fs from "node:fs";
import path from "node:path";
import { analyzeResume } from "./analyzer.js";
import { formatSummary } from "./formatter.js";

function sampleResume() {
  return [
    "Skills: JavaScript TypeScript React Node SQL Testing",
    "Experience: Built production APIs and frontend systems",
    "Projects: Portfolio automation, dashboard analytics",
    "Education: BSc Computer Science"
  ].join("\n");
}

function usage() {
  console.log("Usage:");
  console.log("  node src/cli.js [resumePath] [role]");
  console.log("  node src/cli.js --input <resumePath> --role <role> --format <json|summary> [--output <path>]");
}

function parseArgs(argv) {
  const options = {
    input: "",
    role: "fullstack",
    format: "json",
    output: "",
    help: false
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      options.help = true;
      continue;
    }

    if (token === "--input" || token === "-i") {
      index += 1;
      options.input = argv[index] || "";
      continue;
    }

    if (token === "--role" || token === "-r") {
      index += 1;
      options.role = argv[index] || "fullstack";
      continue;
    }

    if (token === "--format" || token === "-f") {
      index += 1;
      options.format = argv[index] || "json";
      continue;
    }

    if (token === "--output" || token === "-o") {
      index += 1;
      options.output = argv[index] || "";
      continue;
    }

    positional.push(token);
  }

  if (!options.input && positional[0]) {
    options.input = positional[0];
  }
  if (options.role === "fullstack" && positional[1]) {
    options.role = positional[1];
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  let resumeText = sampleResume();

  if (options.input) {
    const absolute = path.resolve(process.cwd(), options.input);
    resumeText = fs.readFileSync(absolute, "utf8");
  }

  const result = analyzeResume(resumeText, options.role);
  const format = options.format.toLowerCase();

  let outputText = "";
  if (format === "json") {
    outputText = JSON.stringify(result, null, 2);
  } else if (format === "summary") {
    outputText = formatSummary(result);
  } else {
    throw new Error("Invalid --format value. Use 'json' or 'summary'.");
  }

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    fs.writeFileSync(outputPath, outputText + "\n", "utf8");
    console.log(`Report written to ${options.output}`);
  } else {
    console.log(outputText);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
