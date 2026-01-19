import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qingsu.health.app',
  appName: '轻塑健康',
  webDir: 'dist',
  server: {
    // 使用你电脑在 Wi-Fi 下的内网 IP 地址
    url: 'http://10.63.79.192:3000',
    cleartext: true
  }
};

export default config;