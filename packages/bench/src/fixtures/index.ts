import { fingerprintChangeScenario } from "./fingerprintChange.js";
import { fingerprintChangeThenShellScenario } from "./fingerprintChangeThenShell.js";
import { browserThenShellScenario } from "./browserThenShell.js";
import { browserUntrustedThenShellScenario } from "./browserUntrustedThenShell.js";
import { cookieAuthorizationNetworkScenario } from "./cookieAuthorizationNetwork.js";
import { credentialTokenThenGitPushScenario } from "./credentialTokenThenGitPush.js";
import { filesystemReadSensitivePathScenario } from "./filesystemReadSensitivePath.js";
import { generatedCodeThenShellScenario } from "./generatedCodeThenShell.js";
import { gitPushSideEffectScenario } from "./gitPushSideEffect.js";
import { llmAdvisoryAllowConflictScenario } from "./llmAdvisoryAllowConflict.js";
import { networkWriteWithTokenScenario } from "./networkWriteWithToken.js";
import { packageInstallAttemptScenario } from "./packageInstallAttempt.js";
import { privateUserDataNetworkScenario } from "./privateUserDataNetwork.js";
import { readEnvSummarizeNetworkScenario } from "./readEnvSummarizeNetwork.js";
import { readEnvThenNetworkScenario } from "./readEnvThenNetwork.js";
import { repeatedDeniedAttemptsScenario } from "./repeatedDeniedAttempts.js";
import { secretExfiltrationScenario } from "./secretExfiltration.js";
import { secretTokenThenNetworkScenario } from "./secretTokenThenNetwork.js";
import { unknownToolScenario } from "./unknownTool.js";
import { writeThenExecScenario } from "./writeThenExec.js";
import { expandedAttackScenarios } from "./expandedCorpus.js";
import { registryAttackScenarios } from "./registryAttacks.js";
import { approvalBenchmarkFixtures } from "./approvalFixtures.js";
import { executionBrokerFixtures } from "./executionFixtures.js";
import { sandboxRequirementFixtures } from "./sandboxFixtures.js";
import { generatedRedteamAttackScenarios } from "./redteamGenerated.js";
export { policyV2BenchmarkFixtures } from "./policyV2.js";

export const defaultAttackScenarios = [
  writeThenExecScenario,
  secretExfiltrationScenario,
  unknownToolScenario,
  fingerprintChangeScenario,
  readEnvThenNetworkScenario,
  secretTokenThenNetworkScenario,
  repeatedDeniedAttemptsScenario,
  fingerprintChangeThenShellScenario,
  llmAdvisoryAllowConflictScenario,
  packageInstallAttemptScenario,
  gitPushSideEffectScenario,
  browserThenShellScenario,
  networkWriteWithTokenScenario,
  filesystemReadSensitivePathScenario,
  readEnvSummarizeNetworkScenario,
  browserUntrustedThenShellScenario,
  generatedCodeThenShellScenario,
  credentialTokenThenGitPushScenario,
  privateUserDataNetworkScenario,
  cookieAuthorizationNetworkScenario,
  ...expandedAttackScenarios,
  ...generatedRedteamAttackScenarios
];

export {
  browserThenShellScenario,
  browserUntrustedThenShellScenario,
  cookieAuthorizationNetworkScenario,
  credentialTokenThenGitPushScenario,
  filesystemReadSensitivePathScenario,
  generatedCodeThenShellScenario,
  fingerprintChangeScenario,
  fingerprintChangeThenShellScenario,
  gitPushSideEffectScenario,
  llmAdvisoryAllowConflictScenario,
  networkWriteWithTokenScenario,
  packageInstallAttemptScenario,
  privateUserDataNetworkScenario,
  readEnvSummarizeNetworkScenario,
  readEnvThenNetworkScenario,
  repeatedDeniedAttemptsScenario,
  secretExfiltrationScenario,
  secretTokenThenNetworkScenario,
  unknownToolScenario,
  writeThenExecScenario
};
export { expandedAttackScenarios };
export { registryAttackScenarios };
export { approvalBenchmarkFixtures };
export { executionBrokerFixtures };
export { sandboxRequirementFixtures };
export { generatedRedteamAttackScenarios };
