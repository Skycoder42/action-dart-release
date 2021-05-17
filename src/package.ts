import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token";
import { join } from "path";
import { clean, SemVer } from "semver";
import { parse } from "yaml";
import { promises } from "fs";

const { readFile } = promises;

type PubspecYaml = {
  name: string;
  version: string;
};

export type PackageInfo = {
  name: string;
  version: SemVer;
};

enum ParserState {
  Searching,
  CheckingHeader,
  DrainingHeader,
  Collecting,
  Done,
}

export class Package {
  public readonly projectDir: string;

  public constructor(projectDir: string) {
    this.projectDir = projectDir;
  }

  public async loadInfo(): Promise<PackageInfo> {
    const yamlFile = await readFile(
      join(this.projectDir, "pubspec.yaml"),
      "utf-8"
    );
    const yamlData = parse(yamlFile) as PubspecYaml;
    const version = clean(yamlData.version, {
      includePrerelease: false,
      loose: true,
    });
    if (!version) {
      throw Error(`Invalid project version: ${yamlData.version}`);
    }

    return {
      name: yamlData.name,
      version: new SemVer(version),
    };
  }

  public async loadChangelog(version: SemVer): Promise<string> {
    const changelogContent = await readFile(
      join(this.projectDir, "CHANGELOG.md"),
      "utf-8"
    );
    const versionAst = this.parseChangelog(changelogContent, version);
    const lines = this.findLines(versionAst);
    const versionContent = this.extractLines(changelogContent, ...lines);
    return versionContent;
  }

  private parseChangelog(changelogContent: string, version: SemVer): Token[] {
    const md = new MarkdownIt();
    const ast = md.parse(changelogContent, {});

    let parserState = ParserState.Searching;
    let versionTokens = [];
    for (const token of ast) {
      if (parserState == ParserState.Done) {
        break;
      }

      switch (parserState) {
        case ParserState.Searching:
          if (token.type == "heading_open" && token.tag === "h2") {
            parserState = ParserState.CheckingHeader;
          }
          break;
        case ParserState.CheckingHeader:
          if (
            token.type === "inline" &&
            token.content.trim().startsWith(`[${version.version}]`)
          ) {
            parserState = ParserState.DrainingHeader;
          } else if (token.type == "heading_close" && token.tag === "h2") {
            parserState = ParserState.Searching;
          }
          break;
        case ParserState.DrainingHeader:
          if (token.type == "heading_close" && token.tag === "h2") {
            parserState = ParserState.Collecting;
          }
          break;
        case ParserState.Collecting:
          if (token.type == "heading_open" && token.tag === "h2") {
            parserState = ParserState.Done;
          } else {
            versionTokens.push(token);
          }
          break;
      }
    }

    if (versionTokens.length === 0) {
      throw new Error(
        `Unabled to find version ${version.version} in changelog.`
      );
    }

    return versionTokens;
  }

  private findLines(tokens: Token[]): [number, number] {
    let start = Number.MAX_SAFE_INTEGER;
    let end = -1;

    for (const token of tokens) {
      if (token.map) {
        start = Math.min(start, token.map[0]);
        end = Math.max(end, token.map[1]);
      }
    }

    return [start, end];
  }

  private extractLines(content: string, start: number, end: number): string {
    return content.split("\n").slice(start, end).join("\n").trim() + "\n";
  }
}
