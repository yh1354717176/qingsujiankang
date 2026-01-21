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
      launchShowDuration: 3000, // 增加时长，防止 Web 加载前出现黑屏
      launchAutoHide: false, // 改为手动控制隐藏，确保 Web 渲染后才切掉
      launchFadeOutDuration: 500,
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