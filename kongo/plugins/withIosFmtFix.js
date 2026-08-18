const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withIosFmtFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        console.warn('Podfile not found at:', podfilePath);
        return config;
      }
      
      let podfileContent = await fs.promises.readFile(podfilePath, 'utf8');

      const hookCode = `
    # FMT C++17 Fix from controle_avant_deployement.md
    installer.pods_project.targets.each do |target|
      if target.name.downcase.include?('fmt')
        target.build_configurations.each do |bc|
          bc.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
          bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
          bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FMT_USE_CONSTEVAL=0'
        end
      end
    end
`;

      if (!podfileContent.includes("CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'")) {
        const searchStr = 'post_install do |installer|';
        if (podfileContent.includes(searchStr)) {
          podfileContent = podfileContent.replace(
            searchStr,
            `${searchStr}${hookCode}`
          );
          console.log('Successfully injected withIosFmtFix hook into Podfile');
        } else {
          console.warn('Could not find post_install do |installer| in Podfile');
        }
        await fs.promises.writeFile(podfilePath, podfileContent, 'utf8');
      }

      return config;
    },
  ]);
};

module.exports = withIosFmtFix;
