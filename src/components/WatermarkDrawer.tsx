import React, { useState } from 'react';
import WatermarkForm from './WatermarkForm';

interface WatermarkDrawerProps {
  text: string;
  setText: (text: string) => void;
  color: string;
  setColor: (color: string) => void;
  alpha: number;
  setAlpha: (alpha: number) => void;
  angle: number;
  setAngle: (angle: number) => void;
  space: number;
  setSpace: (space: number) => void;
  size: number;
  setSize: (size: number) => void;
  onReset: () => void;
  isMobileDevice?: boolean;
}

const WatermarkDrawer: React.FC<WatermarkDrawerProps> = (props) => {
  // 控制抽屉是否展开的状态，默认展开
  const [isExpanded, setIsExpanded] = useState(true);
  const { isMobileDevice } = props;

  // 切换抽屉展开/收缩状态
  const toggleDrawer = () => {
    setIsExpanded(!isExpanded);
  };

  // 如果是桌面设备，直接渲染表单
  if (!isMobileDevice) {
    return (
      <div className="desktop-form-container">
        <WatermarkForm {...props} />
      </div>
    );
  }

  // 移动设备渲染抽屉
  return (
    <div className={`watermark-drawer ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="drawer-header" onClick={toggleDrawer}>
        <h3>水印设置</h3>
        <button className="toggle-button">
          {isExpanded ? '收起' : '展开'}
        </button>
      </div>
      
      <div className={`drawer-content ${isExpanded ? 'visible' : 'hidden'}`}>
        <WatermarkForm {...props} />
      </div>
    </div>
  );
};

export default WatermarkDrawer;