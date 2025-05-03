import { useState, useEffect } from 'react';

export const detectMobileDevice = () => {
  // 获取用户代理字符串
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // 移动设备正则表达式（排除平板设备）
  const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i;

  // 检查触摸支持
  const hasTouchSupport =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // 使用媒体查询检查屏幕尺寸
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;

  // 综合判断：优先用户代理，其次结合触摸和屏幕尺寸
  const isMobile = mobileRegex.test(userAgent) || (hasTouchSupport && isSmallScreen);

  // 调试日志（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('设备检测:', {
      userAgent,
      hasTouchSupport,
      screenWidth: window.innerWidth,
      isMobile,
    });
  }

  return isMobile;
};

export const useMobileDevice = () => {
  const [isMobile, setIsMobile] = useState(detectMobileDevice());

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = detectMobileDevice();
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  return isMobile;
};