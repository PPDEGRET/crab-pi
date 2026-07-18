import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const piCli = join(
  packageRoot,
  "node_modules",
  "@earendil-works",
  "pi-coding-agent",
  "dist",
  "cli.js"
);

const profilePath = join(packageRoot, "profiles", "crab.md");
const manifestPath = join(packageRoot, "package.json");

export function getStatePaths(env = process.env, platform = process.platform) {
  let root;
  if (env.CRAB_STATE_DIR?.trim()) {
    root = resolve(env.CRAB_STATE_DIR.trim());
  } else if (platform === "win32") {
    const localAppData = env.LOCALAPPDATA || join(env.USERPROFILE || homedir(), "AppData", "Local");
    root = join(localAppData, "Crab");
  } else {
    root = env.XDG_STATE_HOME
      ? join(env.XDG_STATE_HOME, "crab")
      : join(env.HOME || homedir(), ".crab");
  }

  const agentDir = join(root, "pi");
  return {
    root,
    agentDir,
    sessionDir: join(agentDir, "sessions"),
    codexHome: join(root, "codex"),
    settingsPath: join(agentDir, "settings.json"),
    authPath: join(agentDir, "auth.json")
  };
}

function copyIfMissing(source, destination) {
  if (existsSync(destination)) return false;
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  return true;
}

function ensureSettings(settingsPath) {
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch (error) {
      throw new Error(`Crab could not parse ${settingsPath}: ${error.message}`);
    }
  }

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new Error(`Crab expected ${settingsPath} to contain a JSON object.`);
  }

  const originalPackages = Array.isArray(settings.packages) ? settings.packages : [];
  const packages = [];
  let hasCrab = false;
  let changed = !existsSync(settingsPath) || !Array.isArray(settings.packages);

  for (const entry of originalPackages) {
    if (typeof entry === "string" && resolve(entry) === packageRoot) {
      if (!hasCrab) packages.push(entry);
      else changed = true;
      hasCrab = true;
      continue;
    }
    const normalized = typeof entry === "string"
      ? entry.replaceAll("\\", "/").replace(/\/+$/, "")
      : "";
    if (/\/node_modules\/crab-pi$/i.test(normalized)) {
      changed = true;
      continue;
    }
    packages.push(entry);
  }

  if (!hasCrab) {
    packages.push(packageRoot);
    changed = true;
  }
  if (changed) settings.packages = packages;
  if (settings.enableInstallTelemetry === undefined) {
    settings.enableInstallTelemetry = false;
    changed = true;
  }

  if (changed) {
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  }
  return { settings, changed };
}

export function ensureState(paths = getStatePaths()) {
  mkdirSync(paths.agentDir, { recursive: true });
  mkdirSync(paths.sessionDir, { recursive: true });
  mkdirSync(paths.codexHome, { recursive: true });

  const created = {
    permissions: copyIfMissing(
      join(packageRoot, "runtime", "default-permissions.jsonc"),
      join(paths.agentDir, "pi-permissions.jsonc")
    ),
    permissionConfig: copyIfMissing(
      join(packageRoot, "runtime", "extension-configs", "pi-permission-system.json"),
      join(paths.agentDir, "extensions", "pi-permission-system", "config.json")
    ),
    subagentConfig: copyIfMissing(
      join(packageRoot, "runtime", "extension-configs", "subagent.json"),
      join(paths.agentDir, "extensions", "subagent", "config.json")
    )
  };
  const settingsResult = ensureSettings(paths.settingsPath);

  return {
    paths,
    created,
    settingsChanged: settingsResult.changed,
    authFilePresent: existsSync(paths.authPath)
  };
}

export function buildEnvironment(paths = getStatePaths(), env = process.env) {
  const next = { ...env };
  const binDir = join(packageRoot, "node_modules", ".bin");
  const separator = process.platform === "win32" ? ";" : ":";

  next.PI_CODING_AGENT_DIR = paths.agentDir;
  next.PI_CODING_AGENT_SESSION_DIR = paths.sessionDir;
  next.PI_SUBAGENT_PI_BINARY = piCli;
  next.CODEX_HOME = paths.codexHome;
  next.PI_TELEMETRY ??= "0";
  next.PI_SKIP_VERSION_CHECK ??= "1";
  next.CRAB_PACKAGE_ROOT = packageRoot;
  next.PATH = `${binDir}${separator}${env.PATH || ""}`;
  return next;
}

export function getProfileText() {
  if (!existsSync(profilePath)) throw new Error(`Crab profile missing: ${profilePath}`);
  return readFileSync(profilePath, "utf8");
}

export function buildLaunchSpec({
  userArgs = [],
  paths = getStatePaths(),
  includeRemote = false,
  env = process.env
} = {}) {
  if (!existsSync(piCli)) {
    throw new Error(`Pi is not installed at ${piCli}. Reinstall Crab with npm install -g.`);
  }
  if (!existsSync(manifestPath)) throw new Error(`Crab package manifest missing: ${manifestPath}`);

  const args = [
    piCli,
    "--session-dir",
    paths.sessionDir,
    "--append-system-prompt",
    getProfileText()
  ];

  if (includeRemote) {
    const remoteExtension = join(packageRoot, "node_modules", "remote-pi", "dist");
    if (!existsSync(remoteExtension)) {
      throw new Error("remote-pi is not installed. Reinstall Crab before using `crab remote`.");
    }
    args.push("--extension", remoteExtension);
  }

  args.push(...userArgs);
  return {
    command: process.execPath,
    args,
    cwd: process.cwd(),
    env: buildEnvironment(paths, env),
    shell: false
  };
}

export function hasProviderCredentials(env = process.env) {
  const names = [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_OAUTH_TOKEN",
    "ANT_LING_API_KEY",
    "OPENAI_API_KEY",
    "AZURE_OPENAI_API_KEY",
    "DEEPSEEK_API_KEY",
    "NVIDIA_API_KEY",
    "GOOGLE_API_KEY",
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
    "CEREBRAS_API_KEY",
    "XAI_API_KEY",
    "FIREWORKS_API_KEY",
    "TOGETHER_API_KEY",
    "OPENROUTER_API_KEY",
    "AI_GATEWAY_API_KEY",
    "ZAI_API_KEY",
    "ZAI_CODING_CN_API_KEY",
    "MISTRAL_API_KEY",
    "MINIMAX_API_KEY",
    "MOONSHOT_API_KEY",
    "OPENCODE_API_KEY",
    "KIMI_API_KEY",
    "CLOUDFLARE_API_KEY",
    "XIAOMI_API_KEY",
    "XIAOMI_TOKEN_PLAN_CN_API_KEY",
    "XIAOMI_TOKEN_PLAN_AMS_API_KEY",
    "XIAOMI_TOKEN_PLAN_SGP_API_KEY",
    "AWS_PROFILE",
    "AWS_ACCESS_KEY_ID",
    "AWS_BEARER_TOKEN_BEDROCK"
  ];
  return names.some((name) => Boolean(env[name]?.trim()));
}

export function getPackageManifest() {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}
