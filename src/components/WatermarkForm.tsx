import React from 'react';
import { Form, Input, Slider, ColorPicker, Row, Col } from 'antd';
import type { Color } from 'antd/es/color-picker';

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
  isMobileDevice: boolean;
}

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
  isMobileDevice,
}) => {
  const handleColorChange = (value: Color) => {
    setColor(value.toHexString());
  };

  // 为移动设备使用更紧凑的布局
  const formItemLayout = isMobileDevice
    ? {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
      }
    : {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
      };

  // 自定义标签样式，使标签左对齐
  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
    paddingLeft: '4px',
  };

  // 减少表单项之间的间距
  const formItemStyle = {
    marginBottom: isMobileDevice ? 8 : 16,
  };

  return (
    <Form 
      {...formItemLayout} 
      size={isMobileDevice ? 'small' : 'middle'}
      style={{ width: '100%' }}
    >
      {isMobileDevice ? (
        // 移动设备下的紧凑布局
        <>
          <Row gutter={4} align="middle">
            <Col span={6}>
              <div style={labelStyle}>水印文字</div>
            </Col>
            <Col span={18}>
              <Form.Item style={formItemStyle}>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入水印文字"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={4} align="middle">
            <Col span={6}>
              <div style={labelStyle}>水印颜色</div>
            </Col>
            <Col span={18}>
              <Form.Item style={formItemStyle}>
                <ColorPicker
                  value={color}
                  onChange={handleColorChange}
                  showText
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={4} align="middle">
            <Col span={6}>
              <div style={labelStyle}>透明度</div>
            </Col>
            <Col span={18}>
              <Form.Item style={formItemStyle}>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={alpha}
                  onChange={setAlpha}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={4} align="middle">
            <Col span={6}>
              <div style={labelStyle}>旋转角度</div>
            </Col>
            <Col span={18}>
              <Form.Item style={formItemStyle}>
                <Slider
                  min={-90}
                  max={90}
                  value={angle}
                  onChange={setAngle}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={4} align="middle">
            <Col span={6}>
              <div style={labelStyle}>间距大小</div>
            </Col>
            <Col span={18}>
              <Form.Item style={formItemStyle}>
                <Slider
                  min={1}
                  max={10}
                  value={space}
                  onChange={setSpace}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={4} align="middle">
            <Col span={6}>
              <div style={labelStyle}>文字大小</div>
            </Col>
            <Col span={18}>
              <Form.Item style={formItemStyle}>
                <Slider
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={size}
                  onChange={setSize}
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      ) : (
        // 桌面设备下的常规布局
        <>
          <Form.Item label="水印文字">
            <Input.TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="watermark-text-input"
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>

          <Form.Item label="水印颜色" style={formItemStyle}>
            <ColorPicker
              value={color}
              onChange={handleColorChange}
              showText
            />
          </Form.Item>

          <Form.Item label="透明度" style={formItemStyle}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={alpha}
              onChange={setAlpha}
            />
          </Form.Item>

          <Form.Item label="旋转角度" style={formItemStyle}>
            <Slider
              min={-90}
              max={90}
              value={angle}
              onChange={setAngle}
            />
          </Form.Item>

          <Form.Item label="间距大小" style={formItemStyle}>
            <Slider
              min={1}
              max={10}
              value={space}
              onChange={setSpace}
            />
          </Form.Item>

          <Form.Item label="文字大小" style={formItemStyle}>
            <Slider
              min={0.5}
              max={5}
              step={0.1}
              value={size}
              onChange={setSize}
            />
          </Form.Item>
        </>
      )}
    </Form>
  );
};

export default WatermarkForm;