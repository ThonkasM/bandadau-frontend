const { withXcodeProject } = require('expo/config-plugins');

/**
 * Silencia el warning «Script has ambiguous dependencies causing it to run on every build».
 *
 * Xcode lo emite cuando un `PBXShellScriptBuildPhase` no declara ni `inputPaths` ni
 * `outputPaths`: con el análisis de dependencias activado no hay forma de saber cuándo
 * ejecutarlo. El build phase que agrega `expo-dev-client` («[Expo Dev Launcher] Strip
 * Local Network Keys for Release») solo edita el Info.plist en builds no-Debug y no
 * depende de archivos de entrada, así que su intención es correr siempre.
 *
 * `alwaysOutOfDate = 1` es exactamente lo que hace Xcode al desmarcar «Based on dependency
 * analysis», es decir, la primera de las dos correcciones que el propio aviso sugiere.
 *
 * Orden: los mods `ios.xcodeproj` se ejecutan del último plugin registrado al primero.
 * `expo-dev-client` se auto-aplica después de los plugins del usuario (lista
 * `legacyExpoPlugins` de prebuild), así que al correr este mod el phase ya existe. Por eso
 * NO hay que declarar `expo-dev-client` explícitamente en `app.config.ts`.
 */
const PHASES_TO_MARK_ALWAYS_OUT_OF_DATE = [
  '[Expo Dev Launcher] Strip Local Network Keys for Release',
];

module.exports = function withIosDevLauncherPhase(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const targetId = project.findTargetKey(cfg.modRequest.projectName ?? '');
    if (!targetId) return cfg;

    const targetPhases = project.pbxNativeTargetSection()[targetId]?.buildPhases ?? [];
    const shellScriptPhases = project.hash?.project?.objects?.PBXShellScriptBuildPhase ?? {};

    PHASES_TO_MARK_ALWAYS_OUT_OF_DATE.forEach((phaseName) => {
      const ref = targetPhases.find((phase) => phase.comment === phaseName);
      if (!ref) return;
      const phase = shellScriptPhases[ref.value];
      if (phase) phase.alwaysOutOfDate = 1;
    });

    return cfg;
  });
};
