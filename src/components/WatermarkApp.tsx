import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Button,
  Space,
  Spin,
  Empty,
  Typography,
  message,
  Tooltip,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { makeRGBAStyle } from '../utils/imageUtils';
import { downloadImage } from '../utils/downloadUtils';
import { v4 as uuidv4 } from 'uuid';
import useDebounce from '../hooks/useDebounce';
import useOrientation from '../hooks/useOrientation';
import WatermarkForm from './WatermarkForm';
import ErrorBoundary from './ErrorBoundary';
import { useMobileDevice } from '../utils/deviceDetection';
import '../styles/WatermarkApp.css';
import WatermarkDrawer from './WatermarkDrawer';

// 使用Typography中的组件
const { Text } = Typography;

interface ImageItem {
  id: string;
  file: File;
  src: string;
  imageElement: HTMLImageElement | null;
}

const defaultSettings = {
  text: '公众号琴姐惠生活',
  color: '#000000',
  alpha: 0.1,
  angle: -35,
  space: 4,
  size: 1.5,
};

const ZoomControls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <Space className="zoom-controls">
      <Tooltip title="放大">
        <Button icon={<ZoomInOutlined />} onClick={() => zoomIn()} />
      </Tooltip>
      <Tooltip title="缩小">
        <Button icon={<ZoomOutOutlined />} onClick={() => zoomOut()} />
      </Tooltip>
      <Tooltip title="重置缩放">
        <Button icon={<UndoOutlined />} onClick={() => resetTransform()} />
      </Tooltip>
    </Space>
  );
};

const WatermarkApp: React.FC = () => {
  // 检测设备类型和屏幕方向
  const isMobileDevice = useMobileDevice();
  const orientation = useOrientation();

  // 水印设置状态
  const [text, setText] = useState<string>(defaultSettings.text);
  const [color, setColor] = useState<string>(defaultSettings.color);
  const [alpha, setAlpha] = useState<number>(defaultSettings.alpha);
  const [angle, setAngle] = useState<number>(defaultSettings.angle);
  const [space, setSpace] = useState<number>(defaultSettings.space);
  const [size, setSize] = useState<number>(defaultSettings.size);

  // 使用防抖处理频繁变化的值
  const debouncedAlpha = useDebounce(alpha, 150);
  const debouncedAngle = useDebounce(angle, 150);
  const debouncedSpace = useDebounce(space, 150);
  const debouncedSize = useDebounce(size, 150);

  // 图片相关状态
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // 引用
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transformWrapperRef = useRef<any>(null);

  const processSingleFile = (file: File | null) => {
    console.log('Processing file:', file?.name);
    if (!file) {
      console.log('File is null, skipping.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      message.warning(`文件格式不支持: ${file.name} (仅支持 png, jpg, gif)，已被忽略。`);
      console.log('Unsupported file type:', file.type);
      return;
    }
    const isDuplicate = images.some(
      (img) => img.file.name === file.name && img.file.size === file.size
    );
    if (isDuplicate) {
      console.log('File already exists:', file.name);
      return;
    }
    const newImageItem: ImageItem = {
      id: uuidv4(),
      file: file,
      src: URL.createObjectURL(file),
      imageElement: null,
    };
    console.log('Adding new image:', newImageItem.id, file.name);
    setImages((prevImages) => [...prevImages, newImageItem]);
    if (!selectedImageId) {
      console.log('Setting selected image to new upload:', newImageItem.id);
      setSelectedImageId(newImageItem.id);
    }
    const img = new Image();
    img.src = newImageItem.src;
    img.onload = () => {
      setImages((prevImages) =>
        prevImages.map((item) =>
          item.id === newImageItem.id ? { ...item, imageElement: img } : item
        )
      );
      console.log('Image loaded:', newImageItem.id);
    };
    img.onerror = () => {
      console.error('Failed to load image:', newImageItem.id);
      message.error(`无法加载图片: ${file.name}`);
      setImages((prevImages) => prevImages.filter((item) => item.id !== newImageItem.id));
      if (selectedImageId === newImageItem.id) {
        setSelectedImageId(null);
      }
    };
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file: File) => {
      console.log('beforeUpload triggered for:', file.name);
      processSingleFile(file);
      return false;
    },
    onChange: (info: any) => {
      console.log('onChange triggered', info.file.name);
    },
    accept: 'image/png,image/jpeg,image/gif',
  };

  const renderThumbnails = () => {
    return images.map((imgItem) => (
      <div
        key={imgItem.id}
        className={`thumbnail-item ${selectedImageId === imgItem.id ? 'selected' : ''}`}
        onClick={() => handleSelectImage(imgItem.id)}
      >
        {!imgItem.imageElement ? (
          <Spin size="small" />
        ) : (
          <>
            <img src={imgItem.src} alt={imgItem.file.name} />
            {/* 删除缩略图中的删除按钮，防止误操作 */}
          </>
        )}
      </div>
    ));
  };

  const renderPreview = () => {
    const selectedImage = images.find((img) => img.id === selectedImageId);
    const isLoadingSelectedImage = selectedImage && !selectedImage.imageElement;

    if (isLoadingSelectedImage) {
      return (
        <div className="loading-container">
          <Spin>
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <Text type="secondary">加载中...</Text>
            </div>
          </Spin>
        </div>
      );
    }

    if (images.length === 0) {
      return (
        <Empty
          description="请选择或拖放图片"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    if (!selectedImageId || !selectedImage) {
      return (
        <Empty
          description="请从下方选择一张图片"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <TransformWrapper
        ref={transformWrapperRef}
        initialScale={1}
        minScale={0.2}
        maxScale={5}
        limitToBounds={true}
        doubleClick={{ disabled: true }}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
      >
        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden' // 确保这一行存在
          }}
          contentStyle={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden' // 确保这一行存在
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </TransformComponent>
        {selectedImageId && (
          <div className="preview-controls">
            <Space>
              <ZoomControls />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              >
                下载
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(selectedImageId);
                }}
              >
                删除
              </Button>
            </Space>
          </div>
        )}
      </TransformWrapper>
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const selectedImage = images.find((img) => img.id === selectedImageId);
    if (!canvas || !selectedImage?.imageElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = selectedImage.imageElement.width;
    canvas.height = selectedImage.imageElement.height;
    ctx.drawImage(selectedImage.imageElement, 0, 0);

    const fontSize = debouncedSize * Math.max(15, Math.min(canvas.width, canvas.height) / 25);
    ctx.font = `bold ${fontSize}px -apple-system,"Helvetica Neue",Helvetica,Arial,"PingFang SC","Hiragino Sans GB","WenQuanYi Micro Hei",sans-serif`;
    
    // 不再直接设置fillStyle
    // ctx.fillStyle = makeRGBAStyle(color, debouncedAlpha);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(text).width;
    if (textWidth <= 0) return;
    const margin = ctx.measureText('啊').width;
    const step = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2));
    const xCount = Math.ceil(step / (textWidth + margin));
    const yCount = Math.ceil((step / (debouncedSpace * fontSize)) / 2);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((debouncedAngle * Math.PI) / 180);
    
    // 计算描边颜色 - 与填充颜色相反
    const getContrastColor = (hexColor: string): string => {
      const match = hexColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (!match) return '#ffffff';
      
      const r = 255 - parseInt(match[1], 16);
      const g = 255 - parseInt(match[2], 16);
      const b = 255 - parseInt(match[3], 16);
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
    const strokeColor = getContrastColor(color);
    
    // 绘制水印文字函数
    const drawWatermarkText = (x: number, y: number) => {
      // 设置描边样式
      ctx.strokeStyle = makeRGBAStyle(strokeColor, debouncedAlpha + 0.2);
      ctx.lineWidth = fontSize * 0.05; // 描边宽度
      ctx.strokeText(text, x, y);
      
      // 设置填充样式
      ctx.fillStyle = makeRGBAStyle(color, debouncedAlpha);
      ctx.fillText(text, x, y);
    };
    
    for (let i = -xCount; i <= xCount; i++) {
      for (let j = -yCount; j <= yCount; j++) {
        if (i !== 0 || j !== 0) {
          drawWatermarkText((textWidth + margin) * i, debouncedSpace * fontSize * j);
        }
      }
    }
    drawWatermarkText(0, 0);
    ctx.restore();
  }, [
    selectedImageId,
    images,
    text,
    color,
    debouncedAlpha,
    debouncedAngle,
    debouncedSpace,
    debouncedSize,
  ]);

  // 水印表单组件已直接在布局中使用，不再需要单独的渲染函数

  const handleSelectImage = (imageId: string) => {
    console.log('选择图片:', imageId);
    // 确保图片存在后再设置选中状态
    const imageExists = images.some(img => img.id === imageId);
    if (imageExists) {
      setSelectedImageId(imageId);
    } else {
      console.error('尝试选择不存在的图片:', imageId);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    const imageToDelete = images.find((img) => img.id === imageId);
    if (imageToDelete?.src.startsWith('blob:')) {
      URL.revokeObjectURL(imageToDelete.src);
    }
    setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
    if (selectedImageId === imageId) {
      const remainingImages = images.filter((img) => img.id !== imageId);
      setSelectedImageId(remainingImages.length > 0 ? remainingImages[0].id : null);
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const selectedImage = images.find((img) => img.id === selectedImageId);
    if (!selectedImage) return;

    try {
      const fileName = selectedImage.file.name;

      // 使用新的下载工具
      const success = await downloadImage(canvas, fileName, (progressMessage) => {
        message.loading({ content: progressMessage, key: 'download' });
      });

      if (success) {
        message.success({ content: '图片下载成功', key: 'download' });
      } else {
        message.error({ content: '下载失败，请重试', key: 'download' });
      }
    } catch (error) {
      console.error('下载过程出错:', error);
      message.error({ content: '下载失败，请重试', key: 'download' });
    }
  };

  const handleResetSettings = useCallback(() => {
    setText(defaultSettings.text);
    setColor(defaultSettings.color);
    setAlpha(defaultSettings.alpha);
    setAngle(defaultSettings.angle);
    setSpace(defaultSettings.space);
    setSize(defaultSettings.size);
    message.info('已重置水印设置');
  }, []);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src);
        }
      });
    };
  }, [images]);

  // 根据屏幕方向决定布局
  const isLandscape = orientation === 'landscape';

  // 横屏布局：左右结构
  if (isLandscape && !isMobileDevice) {
    return (
      <div className="layout-landscape">
        {/* 内容区域 */}
        <div className="content-area">
          {/* 上传按钮区域 */}
          <div className="upload-container">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                {images.length > 0 ? '添加图片' : '选择图片'}
              </Button>
            </Upload>
          </div>

          {/* 预览区域 */}
          <div className="preview-container">
            <ErrorBoundary>{renderPreview()}</ErrorBoundary>
          </div>

          {/* 缩略图区域 - 只在有图片时显示 */}
          {images.length > 0 && (
            <div className="thumbnails-container">
              {renderThumbnails()}
            </div>
          )}
        </div>

        {/* 设置区域 */}
        <div className="settings-area">
          <div className="settings-header">
            <h3 className="settings-title">水印设置</h3>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetSettings}
              size="small"
            >
              重置
            </Button>
          </div>
          <WatermarkForm
            text={text}
            setText={setText}
            color={color}
            setColor={setColor}
            alpha={alpha}
            setAlpha={setAlpha}
            angle={angle}
            setAngle={setAngle}
            space={space}
            setSpace={setSpace}
            size={size}
            setSize={setSize}
            onReset={handleResetSettings}
            isMobileDevice={isMobileDevice}
          />
        </div>
      </div>
    );
  }

  // 竖屏布局：上下结构
  return (
    <div className="layout-portrait">
      {/* 内容区域 */}
      <div className="content-area">
        {/* 上传按钮区域 */}
        <div className="upload-container">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>
              {images.length > 0 ? '添加图片' : '选择图片'}
            </Button>
          </Upload>
        </div>

        {/* 预览区域 */}
        <div className="preview-container">
          <ErrorBoundary>{renderPreview()}</ErrorBoundary>
        </div>

        {/* 缩略图区域 - 只在有图片时显示 */}
        {images.length > 0 && (
          <div className="thumbnails-container">
            {renderThumbnails()}
          </div>
        )}
      </div>

      {/* 水印设置抽屉 */}
      <WatermarkDrawer
        title="水印设置"
        defaultExpanded={false}
        onReset={handleResetSettings}
        orientation={orientation}
        position="bottom"
      >
        <WatermarkForm
          text={text}
          setText={setText}
          color={color}
          setColor={setColor}
          alpha={alpha}
          setAlpha={setAlpha}
          angle={angle}
          setAngle={setAngle}
          space={space}
          setSpace={setSpace}
          size={size}
          setSize={setSize}
          onReset={handleResetSettings}
          isMobileDevice={true}
        />
      </WatermarkDrawer>
    </div>
  );

};

export default WatermarkApp;
