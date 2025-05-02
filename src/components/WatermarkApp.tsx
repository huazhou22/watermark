import React, { useState, useRef, useEffect, useCallback } from 'react';
import { dataURItoBlob, generateFileName, makeRGBAStyle } from '../utils/imageUtils';
import { v4 as uuidv4 } from 'uuid'; // 需要安装 uuid: npm install uuid @types/uuid
import useDebounce from '../hooks/useDebounce'; // 导入 useDebounce
import WatermarkDrawer from './WatermarkDrawer'; // 使用新的抽屉组件

// 定义图片对象接口
interface ImageItem {
  id: string;
  file: File;
  src: string;
  imageElement: HTMLImageElement | null;
}

interface WatermarkAppProps {
  isMobileDevice: boolean;
}

// --- 定义默认值 ---
const defaultSettings = {
  text: '公众号琴姐惠生活',
  color: '#000000',
  alpha: 0.1,
  angle: -35,
  space: 4,
  size: 1。5,
};
// --- 结束定义 ---

const WatermarkApp: React.FC<WatermarkAppProps> = ({ isMobileDevice }) => {
  // --- 使用默认值初始化状态 ---
  const [text, setText] = useState<string>(defaultSettings.text);
  const [color, setColor] = useState<string>(defaultSettings.color);
  const [alpha, setAlpha] = useState<number>(defaultSettings.alpha);
  const [angle, setAngle] = useState<number>(defaultSettings.angle);
  const [space, setSpace] = useState<number>(defaultSettings.space);
  const [size, setSize] = useState<number>(defaultSettings.size);
  // --- 结束修改 ---

  // --- Debounced 状态 (用于触发绘制) ---
  const debouncedAlpha = useDebounce(alpha, 150); // 150ms 延迟
  const debouncedAngle = useDebounce(angle, 150);
  const debouncedSpace = useDebounce(space, 150);
  const debouncedSize = useDebounce(size, 150);
  // text 和 color 通常不需要 debounce，因为它们不是连续触发的

  // --- 修改图片状态管理 ---
  const [images, setImages] = useState<ImageItem[]>([]); // 存储所有图片信息
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null); // 当前选中的图片ID
  // --- 结束修改 ---

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- 修改文件处理逻辑 (提取为独立函数) ---
  const processFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file =>
      ['image/png', 'image/jpeg', 'image/gif'].includes(file.type)
    );

    if (validFiles.length !== newFiles.length) {
      alert('部分文件格式不支持 (仅支持 png, jpg, gif)，已被忽略。');
    }

    if (validFiles.length > 0) {
      const newImageItems: ImageItem[] = validFiles.map(file => ({
        id: uuidv4(),
        file: file,
        src: URL.createObjectURL(file),
        imageElement: null,
      }));

      setImages(prevImages => [...prevImages, ...newImageItems]);
      if (!selectedImageId && newImageItems.length > 0) {
        setSelectedImageId(newImageItems[0].id);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    // 清空 input value 允许重复选择相同文件
    event.target.value = '';
  };
  // --- 结束修改 ---

  // --- 新增：图片选择逻辑 ---
  const handleSelectImage = (id: string) => {
    setSelectedImageId(id);
  };
  // --- 结束新增 ---

  // --- 新增：图片删除逻辑 ---
  const handleDeleteImage = (idToDelete: string) => {
    setImages(prevImages => {
      const remainingImages = prevImages.filter(img => img.id !== idToDelete);
      // 如果删除的是当前选中的图片
      if (selectedImageId === idToDelete) {
        if (remainingImages.length > 0) {
          // 尝试选中删除图片的前一张，如果不存在则选中第一张
          const deletedIndex = prevImages.findIndex(img => img.id === idToDelete);
          const newIndex = Math.max(0, deletedIndex - 1);
          setSelectedImageId(remainingImages[newIndex]?.id || remainingImages[0]?.id || null);
        } else {
          setSelectedImageId(null); // 没有图片了
        }
      }
      // 释放被删除图片的 Object URL
      const deletedImage = prevImages.find(img => img.id === idToDelete);
      if (deletedImage?.src) {
        URL.revokeObjectURL(deletedImage.src);
      }
      return remainingImages;
    });
  };
  // --- 结束新增 ---

  // --- 修改：水印绘制逻辑 (使用 useCallback 优化) ---
  // 依赖项改为使用 debounced 状态
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    const selectedImage = images.find(img => img.id === selectedImageId);

    if (!canvas || !selectedImage || !selectedImage.imageElement) {
      // 如果没有选中图片或图片未加载，清空画布
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        // 可以选择设置画布尺寸为0或显示提示信息
        canvas.width = 0;
        canvas.height = 0;
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = selectedImage.imageElement;
    // 确保画布尺寸与当前选中图片一致
    if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
    }

    // 清除画布并重绘当前选中的原始图像
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // --- 绘制水印逻辑 (与之前类似，但基于当前选中的图片) ---
    const textSize = size * Math.max(15, Math.min(canvas.width, canvas.height) / 25);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle * Math.PI / 180); // 使用原始 angle
    ctx.fillStyle = makeRGBAStyle(color, alpha); // 使用原始 color 和 alpha
    ctx.font = `bold ${textSize}px -apple-system,"Helvetica Neue",Helvetica,Arial,"PingFang SC","Hiragino Sans GB","WenQuanYi Micro Hei",sans-serif`;

    const width = ctx.measureText(text).width;
    // 修复：当文字为空时 width 为 0，导致 step 计算错误和死循环
    if (width <= 0) {
        ctx.restore();
        return; // 如果水印文字为空，则不绘制
    }
    const step = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2));
    const margin = ctx.measureText('啊').width; // 使用中文获取较宽字符宽度作为间距参考

    const xCount = Math.ceil(step / (width + margin));
    const yCount = Math.ceil((step / (space * textSize)) / 2);

    for (let i = -xCount; i <= xCount; i++) {
      for (let j = -yCount; j <= yCount; j++) {
        // 避免绘制在完全相同的位置 (虽然 translate 已经移动了中心点)
        if (i !== 0 || j !== 0) {
             ctx.fillText(text, (width + margin) * i, space * textSize * j);
        }
      }
    }
    // 单独绘制中心点文字，确保覆盖
    ctx.fillText(text, 0, 0);


    ctx.restore();
    // --- 结束绘制水印逻辑 ---
  }, [images, selectedImageId, text, color, alpha, angle, space, size]); // 保持原始依赖，确保拿到最新值用于计算
  // --- 结束修改 ---

  // --- 修改：下载逻辑 ---
  const handleDownload = () => {
    const canvas = canvasRef.current;
    const selectedImage = images.find(img => img.id === selectedImageId);
    if (!canvas || !selectedImage || canvas.width === 0 || canvas.height === 0) return; // 确保画布有内容

    const link = document.createElement('a');
    // 使用原始文件名加上后缀
    const originalFileName = selectedImage.file.name.replace(/\.[^/.]+$/, "");
    link.download = `${originalFileName}_watermarked_${generateFileName()}`;
    const imageData = canvas.toDataURL('image/png');
    const blob = dataURItoBlob(imageData);
    link.href = URL.createObjectURL(blob);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // 及时释放 URL 对象
  };
  // --- 结束修改 ---

  // --- 修改：加载图片 Effect ---
  useEffect(() => {
    images.forEach(imgItem => {
      // 只加载尚未加载的图片
      if (!imgItem.imageElement && imgItem.src) {
        const img = new Image();
        img.onload = () => {
          setImages(currentImages =>
            currentImages.map(item =>
              item.id === imgItem.id ? { ...item, imageElement: img } : item
            )
          );
          // 如果加载的是当前选中的图片，触发一次绘制
          if (imgItem.id === selectedImageId) {
            drawWatermark();
          }
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${imgItem.file.name}`);
          // 可以选择从列表中移除加载失败的图片
          // handleDeleteImage(imgItem.id);
        };
        img.src = imgItem.src;
      }
    });

    // 清理函数：组件卸载时释放所有 Object URL
    return () => {
      images.forEach(imgItem => {
        if (imgItem.src.startsWith('blob:')) {
          URL.revokeObjectURL(imgItem.src);
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);
  // --- 结束修改 ---


  // --- 修改：自动刷新 Effect ---
  // 依赖项改为使用 debounced 状态
  useEffect(() => {
    const selectedImage = images.find(img => img.id === selectedImageId);
    if (selectedImage?.imageElement) {
      drawWatermark();
    }
    // 监听 debounced 状态的变化来触发绘制
  }, [text, color, debouncedAlpha, debouncedAngle, debouncedSpace, debouncedSize, selectedImageId, drawWatermark, images]);
  // --- 结束修改 ---


  // --- 新增：重置设置 Handler ---
  const handleResetSettings = useCallback(() => {
    setText(defaultSettings.text);
    setColor(defaultSettings.color);
    setAlpha(defaultSettings.alpha);
    setAngle(defaultSettings.angle);
    setSpace(defaultSettings.space);
    setSize(defaultSettings.size);
  }, []); // 空依赖数组，因为它总是重置为常量
  // --- 结束新增 ---

  return (
      <div className={`watermark-container ${isMobileDevice ? 'mobile-layout' : 'desktop-layout'}`}>
        {/* --- 修改：图片预览和控制区域 --- */}
        <div className="image-preview-container">
          {/* 上传按钮 */}
          <div className="upload-section">
            <input
              type="file"
              id="image"
              className="file-input"
              accept="image/png,image/jpeg,image/gif"
              onChange={handleFileChange}
              multiple // 允许选择多个文件
            />
            <label htmlFor="image" className="file-label">
              {images.length > 0 ? '添加图片' : '选择图片'}
            </label>
          </div>

        {/* 主预览区域 */}
        <div className={`preview-section ${isMobileDevice ? 'mobile-preview' : ''}`}>
          {/* 在预览区域上方放置按钮 */}
          <div className="preview-controls">
             {selectedImageId && images.length > 0 && (
               <>
                 <button onClick={handleDownload} className="control-button download-button" title="下载当前图片" aria-label="下载当前带水印的图片">
                   下载
                 </button>
                 <button onClick={() => handleDeleteImage(selectedImageId)} className="control-button delete-button" title="删除当前图片" aria-label="删除当前选中的图片">
                   删除
                 </button>
               </>
             )}
          </div>
          {/* 在 JSX 之前声明变量，而不是在 JSX 中间 */}
          {(() => {
            const selectedImage = images.find(img => img.id === selectedImageId);
            const isLoadingSelectedImage = selectedImage && !selectedImage.imageElement;
            
            return (
              <>
                {/* --- 添加加载状态 --- */}
                {isLoadingSelectedImage && (
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <span>加载中...</span>
                  </div>
                )}
                {/* --- 结束添加 --- */}
                <canvas
                  ref={canvasRef}
                  style={{ display: isLoadingSelectedImage ? 'none' : 'block' }} // 加载时隐藏 canvas
                />
                {images.length === 0 && !isLoadingSelectedImage && <p className="no-image-text">请选择或拖放图片</p>}
                {images.length > 0 && !selectedImageId && !isLoadingSelectedImage && <p className="no-image-text">请从下方选择一张图片</p>}
              </>
            );
          })()}
        </div>

        {/* 缩略图区域 */}
        {images.length > 0 && (
          <div className="thumbnail-strip">
            {images.map((imgItem) => (
              <div
                key={imgItem.id}
                className={`thumbnail-item ${selectedImageId === imgItem.id ? 'selected' : ''}`}
                onClick={() => handleSelectImage(imgItem.id)}
                title={imgItem.file.name} // 添加 title 提示文件名
              >
                {/* --- 添加缩略图加载状态 --- */}
                {!imgItem.imageElement && (
                   <div className="thumbnail-loading-overlay">
                     <div className="spinner small"></div>
                   </div>
                )}
                {/* --- 结束添加 --- */}
                <img src={imgItem.src} alt={imgItem.file.name} />
                {/* --- 新增：缩略图删除按钮 --- */}
                <button
                  className="delete-thumb-button"
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡到父 div 的 onClick
                    handleDeleteImage(imgItem.id);
                  }}
                  title="删除此图片" // 添加 title
                  aria-label="删除此图片" // 添加 aria-label
                >
                  &times; {/* 使用 HTML 实体 '×' */}
                </button>
                {/* --- 结束新增 --- */}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* --- 结束修改 --- */}

      {/* 桌面设备时，将抽屉组件放在容器内部 */}
      {!isMobileDevice && (
        <div className="desktop-form-wrapper">
          <WatermarkDrawer
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
      )}
      
      {/* 移动设备时，将抽屉组件放在容器外部，使其固定在屏幕底部 */}
      {isMobileDevice && (
        <WatermarkDrawer
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
      )}
    </div>
  );
};

export default WatermarkApp;
