import { useState, useEffect } from 'react';

/**
 * 自定义hook，用于获取和监听屏幕高度
 * @returns 当前屏幕高度
 */
const useScreenHeight = (): number => {
  const [screenHeight, setScreenHeight] = useState<number>(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    
    // 初始化时立即获取一次
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return screenHeight;
};

export default useScreenHeight;
