import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qingsu.health.app',
  appName: '轻塑健康',
  webDir: 'dist',
  server: {
    // 使用你电脑在 Wi-Fi 下的内网 IP 地址
    url: 'https://qingsu.yazhu.cyou',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      // 启动屏设置
      launchShowDuration: 0, // 不使用原生启动屏，使用 Web 加载器
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#2563EB', // 与品牌色一致
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;