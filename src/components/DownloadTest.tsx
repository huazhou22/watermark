import React, { useRef, useEffect } from 'react';
import { Button, Space, Card, Typography, Divider } from 'antd';
import { DownloadOutlined, RestOutlined } from '@ant-design/icons';
import { downloadImage, detectEnvironment } from '../utils/downloadUtils';

const { Title, Text, Paragraph } = Typography;

const DownloadTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 创建测试图片
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    canvas.width = 400;
    canvas.height = 300;

    // 绘制测试图片
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // 绘制文字
    ctx.fillStyle = '#1890ff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('下载测试图片', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText('Test Download Image', canvas.width / 2, canvas.height / 2 + 10);
    
    // 绘制时间戳
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 40);
  }, []);

  const handleTestDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const success = await downloadImage(canvas, 'test-image.png', (message) => {
        console.log('下载进度:', message);
      });
      
      if (success) {
        console.log('下载成功');
      } else {
        console.log('下载失败');
      }
    } catch (error) {
      console.error('下载测试失败:', error);
    }
  };

  const env = detectEnvironment();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>
        <RestOutlined /> 下载功能测试
      </Title>
      
      <Card title="环境检测结果" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="small">
          <Text>
            <strong>APK环境:</strong> {env.isAPK ? '是' : '否'}
          </Text>
          <Text>
            <strong>移动设备:</strong> {env.isMobile ? '是' : '否'}
          </Text>
          <Text>
            <strong>iOS设备:</strong> {env.isIOS ? '是' : '否'}
          </Text>
          <Text>
            <strong>Android设备:</strong> {env.isAndroid ? '是' : '否'}
          </Text>
          <Text>
            <strong>支持Blob:</strong> {env.supportsBlob ? '是' : '否'}
          </Text>
          <Text>
            <strong>支持下载:</strong> {env.supportsDownload ? '是' : '否'}
          </Text>
          <Text>
            <strong>支持Canvas:</strong> {env.supportsCanvas ? '是' : '否'}
          </Text>
        </Space>
      </Card>

      <Card title="测试图片" style={{ marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <canvas
            ref={canvasRef}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
      </Card>

      <Card title="下载测试">
        <Paragraph>
          点击下方按钮测试不同环境下的图片下载功能。系统会自动选择最适合当前环境的下载方式：
        </Paragraph>
        
        <ul>
          <li><strong>APK/WebView环境:</strong> 使用DataURL + 新窗口显示方式</li>
          <li><strong>移动设备:</strong> 优先使用Blob，失败则降级到Base64</li>
          <li><strong>桌面设备:</strong> 使用标准Blob下载</li>
          <li><strong>兼容模式:</strong> 使用Base64直接下载</li>
        </ul>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleTestDownload}
          >
            测试下载
          </Button>
        </div>

        <Divider />

        <Paragraph type="secondary" style={{ fontSize: '12px' }}>
          <strong>预期行为:</strong>
          <br />
          • APK环境: 新窗口打开图片，可长按保存
          <br />
          • 浏览器环境: 直接下载到默认下载文件夹
          <br />
          • 移动浏览器: 可能需要用户确认下载位置
        </Paragraph>
      </Card>
    </div>
  );
};

export default DownloadTest;
