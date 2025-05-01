import React from 'react';

// 在接口中添加 isMobileDevice 属性
interface WatermarkFormProps {
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
  isMobileDevice?: boolean; // 添加移动设备标志
}

// 在组件中使用这个属性
const WatermarkForm: React.FC<WatermarkFormProps> = ({
  text,
  setText,
  color,
  setColor,
  alpha,
  setAlpha,
  angle,
  setAngle,
  space,
  setSpace,
  size,
  setSize,
  onReset,
  isMobileDevice = false, // 默认为 false
}) => {
  return (
    <div className={`watermark-form ${isMobileDevice ? 'mobile-form' : ''}`}>
      {/* 移除了原来的标题部分，因为它现在在 WatermarkDrawer 中 */}
      <div className="form-controls-container">
        <div className="reset-button-container">
          <button 
            onClick={onReset} 
            className="reset-button"
            title="恢复默认设置"
          >
            恢复默认设置
          </button>
        </div>
        
        {/* 根据设备类型使用不同的布局 */}
        <div className={`form-controls ${isMobileDevice ? 'mobile-controls' : ''}`}>
          {isMobileDevice ? (
            // 移动设备布局 - 紧凑型，标签和控件在同一行
            <>
              <div className="form-group inline-group">
                <label htmlFor="watermark-text">水印文字:</label>
                <input
                  id="watermark-text"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入水印文字"
                  className="inline-input"
                />
              </div>

              <div className="form-group inline-group">
                <label htmlFor="watermark-color">颜色:</label>
                <input
                  id="watermark-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="inline-input color-input"
                />
              </div>

              <div className="form-group inline-group">
                <label htmlFor="watermark-alpha">透明度: {alpha.toFixed(1)}</label>
                <input
                  id="watermark-alpha"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="inline-input"
                />
              </div>

              <div className="form-group inline-group">
                <label htmlFor="watermark-angle">角度: {angle}°</label>
                <input
                  id="watermark-angle"
                  type="range"
                  min="-90"
                  max="90"
                  value={angle}
                  onChange={(e) => setAngle(parseInt(e.target.value))}
                  className="inline-input"
                />
              </div>

              <div className="form-group inline-group">
                <label htmlFor="watermark-space">间距: {space}</label>
                <input
                  id="watermark-space"
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={space}
                  onChange={(e) => setSpace(parseFloat(e.target.value))}
                  className="inline-input"
                />
              </div>

              <div className="form-group inline-group">
                <label htmlFor="watermark-size">大小: {size}</label>
                <input
                  id="watermark-size"
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={size}
                  onChange={(e) => setSize(parseFloat(e.target.value))}
                  className="inline-input"
                />
              </div>
            </>
          ) : (
            // 桌面布局 - 原始布局
            <>
              <div className="form-group">
                <label htmlFor="watermark-text">水印文字:</label>
                <input
                  id="watermark-text"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入水印文字"
                />
              </div>

              <div className="form-group">
                <label htmlFor="watermark-color">颜色:</label>
                <input
                  id="watermark-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="watermark-alpha">透明度: {alpha.toFixed(1)}</label>
                <input
                  id="watermark-alpha"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="watermark-angle">角度: {angle}°</label>
                <input
                  id="watermark-angle"
                  type="range"
                  min="-90"
                  max="90"
                  value={angle}
                  onChange={(e) => setAngle(parseInt(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="watermark-space">间距: {space}</label>
                <input
                  id="watermark-space"
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={space}
                  onChange={(e) => setSpace(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="watermark-size">大小: {size}</label>
                <input
                  id="watermark-size"
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={size}
                  onChange={(e) => setSize(parseFloat(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatermarkForm;