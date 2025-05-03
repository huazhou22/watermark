import React, { useState } from 'react';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
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
  const [isExpanded, setIsExpanded] = useState(false); // 默认收起
  const { isMobileDevice, ...formProps } = props;

  const toggleDrawer = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isMobileDevice) {
    return (
      <div className="desktop-form-container">
        <WatermarkForm {...formProps} isMobileDevice={false} />
      </div>
    );
  }

  return (
    <div className={`watermark-drawer ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="drawer-header" onClick={toggleDrawer}>
        <h3>水印设置</h3>
        <div className="handle-icon">
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </div>
      </div>
      <div className={`drawer-content ${isExpanded ? 'visible' : 'hidden'}`}>
        {isExpanded && <WatermarkForm {...formProps} isMobileDevice={true} />}
      </div>
    </div>
  );
};

export default WatermarkDrawer;