import React, { useState, useEffect } from 'react';
import WatermarkApp from './components/WatermarkApp';

function App() {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  useEffect(() => {
    // 检测是否为移动设备的函数
    const checkIfMobile = () => {
      // 检查是否有触摸功能
      const hasTouchScreen = (
        'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0
      ) || (
        'msMaxTouchPoints' in navigator && (navigator as any).msMaxTouchPoints > 0
      );
      
      // 检查用户代理字符串中是否包含移动设备关键词
      const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // 检查屏幕宽度是否小于特定值
      const smallScreen = window.innerWidth < 768;
      
      // 综合判断
      const isMobile = hasTouchScreen || userAgentMobile || smallScreen;
      setIsMobileDevice(isMobile);
    };

    // 初始检测
    checkIfMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkIfMobile);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1>图片水印工具</h1>
      </header>
      <main>
        <WatermarkApp isMobileDevice={isMobileDevice} />
      </main>
    </div>
  );
}

export default App;