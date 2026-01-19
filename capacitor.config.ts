import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qingsu.health.app',
  appName: '轻塑健康',
  webDir: 'dist',
  server: {
    // 使用你电脑在 Wi-Fi 下的内网 IP 地址
    url: 'https://qingsu.yazhu.cyou',
    cleartext: true
  }
};

export default config;