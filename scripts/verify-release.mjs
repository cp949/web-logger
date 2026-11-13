export function createNpmEnvironment(sourceEnv = process.env) {
  return { ...sourceEnv };
}

export function getReleaseVerificationSteps() {
  return [];
}

export function runReleaseVerification() {
  return 0;
}
