/**
 * 下载工具函数 - 支持多种环境的图片下载方式
 */

// 检测运行环境
export const detectEnvironment = () => {
  const userAgent = navigator.userAgent;
  
  return {
    // APK/WebView环境检测
    isAPK: userAgent.includes('wv') || // WebView标识
           (userAgent.includes('Android') && userAgent.includes('Version/')) ||
           window.location.protocol === 'file:' || // 本地文件协议
           !window.URL || !window.URL.createObjectURL, // 不支持blob URL
    
    // 移动设备检测
    isMobile: /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent),
    
    // iOS设备检测
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    
    // Android设备检测
    isAndroid: /Android/.test(userAgent),
    
    // 支持的功能检测
    supportsBlob: !!(window.Blob && window.URL && window.URL.createObjectURL),
    supportsDownload: 'download' in document.createElement('a'),
    supportsCanvas: !!(document.createElement('canvas').getContext),
  };
};

// 生成文件名
export const generateFileName = (originalName: string, prefix: string = 'watermarked'): string => {
  const extension = originalName.split('.').pop() || 'png';
  const baseName = originalName.replace(`.${extension}`, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${baseName}_${timestamp}.${extension}`;
};

// 方案1：DataURL + 新窗口显示（APK兼容）
export const downloadViaDataURL = (canvas: HTMLCanvasElement, fileName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const dataURL = canvas.toDataURL('image/png');
      
      // 创建新窗口显示图片
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        // 使用innerHTML而不是document.write避免警告
        newWindow.document.documentElement.innerHTML = `
          <html>
            <head>
              <title>保存图片 - ${fileName}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta charset="utf-8">
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  background: #f5f5f5; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                  text-align: center;
                }
                .container {
                  max-width: 100%;
                  margin: 0 auto;
                }
                img { 
                  max-width: 100%; 
                  height: auto; 
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  margin: 20px 0;
                }
                .instructions {
                  margin: 20px 0;
                  padding: 15px;
                  background: #e6f7ff;
                  border-radius: 6px;
                  color: #1890ff;
                  font-size: 14px;
                }
                .download-link {
                  display: inline-block;
                  margin: 10px;
                  padding: 12px 24px;
                  background: #1890ff;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 500;
                  transition: background-color 0.3s;
                }
                .download-link:hover {
                  background: #40a9ff;
                }
                .copy-button {
                  display: inline-block;
                  margin: 10px;
                  padding: 12px 24px;
                  background: #52c41a;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: background-color 0.3s;
                }
                .copy-button:hover {
                  background: #73d13d;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>水印图片已生成</h2>
                <div class="instructions">
                  <p><strong>保存方式：</strong></p>
                  <p>• 长按图片选择"保存图片到相册"</p>
                  <p>• 或点击下方按钮下载/复制</p>
                </div>
                <img src="${dataURL}" alt="${fileName}" id="generatedImage" />
                <br>
                <a href="${dataURL}" download="${fileName}" class="download-link">📥 下载图片</a>
                <button onclick="copyImage()" class="copy-button">📋 复制图片</button>
                
                <script>
                  function copyImage() {
                    const img = document.getElementById('generatedImage');
                    if (navigator.clipboard && window.ClipboardItem) {
                      // 现代浏览器支持
                      fetch('${dataURL}')
                        .then(res => res.blob())
                        .then(blob => {
                          const item = new ClipboardItem({ 'image/png': blob });
                          return navigator.clipboard.write([item]);
                        })
                        .then(() => alert('图片已复制到剪贴板'))
                        .catch(() => alert('复制失败，请手动保存图片'));
                    } else {
                      // 降级方案
                      alert('请长按图片手动保存');
                    }
                  }
                  
                  // 自动聚焦到图片
                  window.onload = function() {
                    document.getElementById('generatedImage').scrollIntoView();
                  };
                </script>
              </div>
            </body>
          </html>
        `;
        resolve(true);
      } else {
        // 如果无法打开新窗口，尝试直接跳转
        window.location.href = dataURL;
        resolve(true);
      }
    } catch (error) {
      console.error('DataURL下载失败:', error);
      resolve(false);
    }
  });
};

// 方案2：Blob + URL.createObjectURL（标准浏览器）
export const downloadViaBlob = (canvas: HTMLCanvasElement, fileName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 延迟释放URL
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
        
        resolve(true);
      }, 'image/png');
    } catch (error) {
      console.error('Blob下载失败:', error);
      resolve(false);
    }
  });
};

// 方案3：Base64 + 临时链接（兼容性最好）
export const downloadViaBase64Link = (canvas: HTMLCanvasElement, fileName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataURL;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      resolve(true);
    } catch (error) {
      console.error('Base64下载失败:', error);
      resolve(false);
    }
  });
};

// 主下载函数 - 自动选择最佳方案
export const downloadImage = async (
  canvas: HTMLCanvasElement, 
  fileName: string,
  onProgress?: (message: string) => void
): Promise<boolean> => {
  const env = detectEnvironment();
  const finalFileName = generateFileName(fileName);
  
  onProgress?.('正在准备下载...');
  
  // APK/WebView环境优先使用DataURL方案
  if (env.isAPK) {
    onProgress?.('使用APK兼容模式...');
    return await downloadViaDataURL(canvas, finalFileName);
  }
  
  // 移动设备但支持Blob的情况
  if (env.isMobile && env.supportsBlob) {
    onProgress?.('使用移动设备优化模式...');
    const success = await downloadViaBlob(canvas, finalFileName);
    if (success) return true;
    
    // Blob失败则降级到Base64
    onProgress?.('降级到Base64模式...');
    return await downloadViaBase64Link(canvas, finalFileName);
  }
  
  // 桌面设备优先使用Blob
  if (env.supportsBlob && env.supportsDownload) {
    onProgress?.('使用标准下载模式...');
    const success = await downloadViaBlob(canvas, finalFileName);
    if (success) return true;
  }
  
  // 最后的降级方案
  onProgress?.('使用兼容模式...');
  return await downloadViaBase64Link(canvas, finalFileName);
};
