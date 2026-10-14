const { withEntitlementsPlist } = require('expo/config-plugins');

const MANAGED_ENTITLEMENTS = [
  'aps-environment',
  'com.apple.developer.associated-domains',
];

function shouldStripEntitlements() {
  const explicit = process.env.EXPO_LOCAL_DEV;
  if (explicit === '0') return false;
  if (explicit === '1') return true;
  return !process.env.EAS_BUILD;
}

module.exports = function withIosLocalEntitlements(config) {
  if (!shouldStripEntitlements()) return config;

  if (config.ios && config.ios.associatedDomains) {
    delete config.ios.associatedDomains;
  }

  return withEntitlementsPlist(config, (cfg) => {
    for (const key of MANAGED_ENTITLEMENTS) {
      delete cfg.modResults[key];
    }
    return cfg;
  });
};
