export interface PackageIntegrityConfig {
  version: 1;
  configId: string;
  packages: string[];
  requiredFiles: string[];
  forbiddenPatterns: string[];
  generatedFilesDenylist: string[];
  limitations: string[];
}
