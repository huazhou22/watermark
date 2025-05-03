import { useState, useEffect } from 'react';

/**
 * 屏幕方向类型
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * 自定义hook，用于检测和监听屏幕方向变化
 * @returns 当前屏幕方向 ('portrait' | 'landscape')
 */
const useOrientation = (): Orientation => {
  // 检测当前屏幕方向
  const getOrientation = (): Orientation => {
    // 使用window.matchMedia检测屏幕方向
    // 当宽度大于高度时为横屏(landscape)，否则为竖屏(portrait)
    return window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait';
  };

  const [orientation, setOrientation] = useState<Orientation>(getOrientation());

  useEffect(() => {
    // 创建媒体查询
    const mediaQuery = window.matchMedia('(orientation: landscape)');

    // 处理方向变化
    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setOrientation(e.matches ? 'landscape' : 'portrait');
    };

    // 添加事件监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleOrientationChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleOrientationChange);
    }

    // 初始化时立即获取一次
    setOrientation(getOrientation());

    // 清理函数
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleOrientationChange);
      } else {
        // 兼容旧版浏览器
        mediaQuery.removeListener(handleOrientationChange);
      }
    };
  }, []);

  return orientation;
};

export default useOrientation;
