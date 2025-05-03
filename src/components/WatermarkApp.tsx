import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layout,
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
import { dataURItoBlob, makeRGBAStyle } from '../utils/imageUtils';
import { v4 as uuidv4 } from 'uuid';
import useDebounce from '../hooks/useDebounce';
import WatermarkForm from './WatermarkForm';
import ErrorBoundary from './ErrorBoundary';
import { useMobileDevice } from '../utils/deviceDetection';
import '../styles/WatermarkApp.css';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

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
  const isMobileDevice = useMobileDevice();
  const [text, setText] = useState<string>(defaultSettings.text);
  const [color, setColor] = useState<string>(defaultSettings.color);
  const [alpha, setAlpha] = useState<number>(defaultSettings.alpha);
  const [angle, setAngle] = useState<number>(defaultSettings.angle);
  const [space, setSpace] = useState<number>(defaultSettings.space);
  const [size, setSize] = useState<number>(defaultSettings.size);

  const debouncedAlpha = useDebounce(alpha, 150);
  const debouncedAngle = useDebounce(angle, 150);
  const debouncedSpace = useDebounce(space, 150);
  const debouncedSize = useDebounce(size, 150);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

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
          wrapperStyle={{ width: '100%', height: '100%', position: 'relative' }}
          contentStyle={{ width: '100%', height: '100%' }}
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
    ctx.fillStyle = makeRGBAStyle(color, debouncedAlpha);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  
    const textWidth = ctx.measureText(text).width;
    if (textWidth <= 0) return;
    const margin = ctx.measureText('啊').width;
    const textHeight = fontSize;
    const step = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2));
    const xCount = Math.ceil(step / (textWidth + margin));
    const yCount = Math.ceil((step / (debouncedSpace * fontSize)) / 2);
  
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((debouncedAngle * Math.PI) / 180);
    for (let i = -xCount; i <= xCount; i++) {
      for (let j = -yCount; j <= yCount; j++) {
        if (i !== 0 || j !== 0) {
          ctx.fillText(text, (textWidth + margin) * i, debouncedSpace * fontSize * j);
        }
      }
    }
    ctx.fillText(text, 0, 0);
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

  const renderWatermarkForm = () => {
    return (
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
    );
  };

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

  const generateCustomFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop();
    const baseName = fileName.replace(`.${extension}`, '');
    return `watermarked_${baseName}.${extension}`;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const selectedImage = images.find((img) => img.id === selectedImageId);
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.download = generateCustomFileName(selectedImage.file.name);
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // 桌面布局：左右布局
  if (!isMobileDevice) {
    return (
      <Layout style={{ height: '100vh', display: 'flex', boxSizing: 'border-box' }}>
        <Content
          style={{
            padding: '16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                {images.length > 0 ? '添加图片' : '选择图片'}
              </Button>
            </Upload>
          </div>
          <div
            className="preview-container-outer"
            style={{
              flex: 1,
              minHeight: 0, // 防止溢出
              position: 'relative',
              background: '#f0f0f0',
              borderRadius: '8px',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <ErrorBoundary>{renderPreview()}</ErrorBoundary>
          </div>
          {images.length > 0 && (
            <div
              className="thumbnail-strip"
              style={{
                marginTop: '16px',
                height: '60px',
                overflowX: 'auto',
                flexShrink: 0,
              }}
            >
              {renderThumbnails()}
            </div>
          )}
        </Content>
        <Sider
          width="30%"
          style={{
            padding: '16px',
            background: '#fff',
            borderLeft: '1px solid #f0f0f0',
            overflow: 'auto',
            minWidth: '250px',
            maxWidth: '400px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              水印设置
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetSettings}
              size="small"
            >
              重置
            </Button>
          </div>
          {renderWatermarkForm()}
        </Sider>
      </Layout>
    );
  }

  // 移动布局：上下布局
  return (
    <Layout
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <Content
        style={{
          flex: '0 0 65%', // 增加图片区域高度
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: '8px', flexShrink: 0 }}>
          <Upload {...uploadProps}>
            <Button block icon={<UploadOutlined />}>
              {images.length > 0 ? '添加图片' : '选择图片'}
            </Button>
          </Upload>
        </div>
        <div
          className="preview-container-outer"
          style={{
            flex: 1,
            minHeight: 0, // 防止溢出
            position: 'relative',
            background: '#f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <ErrorBoundary>{renderPreview()}</ErrorBoundary>
        </div>
        {images.length > 0 && (
          <div
            className="thumbnail-strip"
            style={{
              marginTop: '8px',
              height: '50px', // 减小高度
              overflowX: 'auto',
              flexShrink: 0,
            }}
          >
            {renderThumbnails()}
        </div>
        )}
      </Content>
      <div
        style={{
          flex: '0 0 35%', // 相应减少水印设置高度
          padding: '8px',
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          overflow: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            水印设置
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetSettings}
            size="small"
          >
            重置
          </Button>
        </div>
        {renderWatermarkForm()}
      </div>
    </Layout>
  );
};

export default WatermarkApp;