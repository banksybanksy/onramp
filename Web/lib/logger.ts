export const logger = {
  info(scope: string, message: string, detail?: unknown) {
    console.info(`[${scope}] ${message}`, detail ?? "");
  },
  warn(scope: string, message: string, detail?: unknown) {
    console.warn(`[${scope}] ${message}`, detail ?? "");
  },
  error(scope: string, message: string, detail?: unknown) {
    console.error(`[${scope}] ${message}`, detail ?? "");
  }
};
