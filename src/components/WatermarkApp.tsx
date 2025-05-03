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
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {isMobileDevice && (
              <div className="mobile-download-tip">
                提示：如果下载按钮无效，可长按图片保存
              </div>
            )}
          </div>
        </TransformComponent>
        {selectedImageId && (
          <div className="preview-controls">
            <Space>
              <ZoomControls />
              <Space.Compact>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                >
                  下载
                </Button>
                {isMobileDevice && (
                  <Tooltip title="在新窗口中打开图片">
                    <Button
                      type="primary"
                      onClick={handleOpenInNewWindow}
                    >
                      查看
                    </Button>
                  </Tooltip>
                )}
              </Space.Compact>
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

    // 为移动设备添加长按保存功能
    if (isMobileDevice && canvas) {
      // 移除之前的事件监听器（如果有）
      canvas.removeEventListener('touchstart', handleCanvasTouchStart);

      // 添加新的事件监听器
      canvas.addEventListener('touchstart', handleCanvasTouchStart);
    }
  }, [
    selectedImageId,
    images,
    text,
    color,
    debouncedAlpha,
    debouncedAngle,
    debouncedSpace,
    debouncedSize,
    isMobileDevice, // 添加isMobileDevice作为依赖项
  ]);

  // 处理Canvas长按事件（用于移动设备）
  const handleCanvasTouchStart = useCallback((e: TouchEvent) => {
    // 防止默认行为，如滚动
    e.preventDefault();

    // 对于iOS设备，长按可能会显示上下文菜单，这是我们想要的
    // 对于Android设备，我们可能需要手动处理长按

    // 注意：这个函数不需要做太多，因为我们主要是想确保canvas可以被长按
    // 大多数移动浏览器会自动提供保存图片的选项
  }, []);

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

  const generateCustomFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop();
    const baseName = fileName.replace(`.${extension}`, '');
    return `watermarked_${baseName}.${extension}`;
  };

  // 在新窗口中打开图片（移动设备备用下载方法）
  const handleOpenInNewWindow = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // 显示加载提示
      message.loading({ content: '正在准备图片...', key: 'openImage' });

      // 转换为Blob
      canvas.toBlob((blob) => {
        if (!blob) {
          message.error({ content: '生成图片失败，请重试', key: 'openImage' });
          return;
        }

        // 创建URL并在新窗口打开
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

        // 提示用户如何保存
        message.success({
          content: '图片已在新窗口打开，长按图片可保存',
          key: 'openImage',
          duration: 5
        });

        // 我们不会立即释放URL，因为用户可能需要时间保存图片
        // 设置一个较长的超时时间来释放URL
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 60000); // 1分钟后释放
      }, 'image/png');
    } catch (error) {
      console.error('打开图片出错:', error);
      message.error({ content: '打开图片失败，请重试', key: 'openImage' });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const selectedImage = images.find((img) => img.id === selectedImageId);
    if (!selectedImage) return;

    try {
      // 显示加载提示
      message.loading({ content: '正在准备下载...', key: 'download' });

      // 使用更兼容的方式：先转换为Blob
      canvas.toBlob((blob) => {
        if (!blob) {
          message.error({ content: '生成图片失败，请重试', key: 'download' });
          return;
        }

        const fileName = generateCustomFileName(selectedImage.file.name);

        // 检测是否为移动设备
        if (isMobileDevice) {
          // 移动设备处理方式
          try {
            // 创建URL
            const url = URL.createObjectURL(blob);

            // 创建链接
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.setAttribute('target', '_blank'); // 在新窗口打开
            link.setAttribute('rel', 'noopener noreferrer');

            // 模拟点击
            document.body.appendChild(link);
            link.click();

            // 延迟移除链接和释放URL
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              message.success({ content: '下载已准备完成', key: 'download' });
            }, 100);
          } catch (err) {
            console.error('移动设备下载失败:', err);
            message.error({
              content: '下载失败。请尝试长按图片并选择"保存图片"',
              key: 'download',
              duration: 5
            });

            // 如果自动下载失败，提供备用方案：在新窗口打开图片
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
        } else {
          // 桌面设备处理方式
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = fileName;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // 释放URL
          setTimeout(() => {
            URL.revokeObjectURL(url);
            message.success({ content: '下载成功', key: 'download' });
          }, 100);
        }
      }, 'image/png');
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
