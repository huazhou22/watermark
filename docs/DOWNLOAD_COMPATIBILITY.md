# 图片下载兼容性方案

## 概述

本项目提供了多种图片下载方式，以确保在不同环境（特别是APK/WebView环境）下都能正常工作。

## 支持的下载方式

### 1. DataURL + 新窗口显示（APK兼容）

**适用环境：** APK、WebView、不支持Blob的环境

**工作原理：**
- 使用 `canvas.toDataURL()` 将图片转换为Base64格式
- 在新窗口中显示图片，提供长按保存和下载链接
- 完全不依赖Blob API

**优点：**
- 兼容性最好，支持所有WebView环境
- 用户体验友好，提供多种保存方式
- 不受APK安全限制影响

**缺点：**
- 大图片可能导致内存占用较高
- 需要用户手动操作保存

### 2. Blob + URL.createObjectURL（标准方式）

**适用环境：** 现代浏览器、支持Blob API的环境

**工作原理：**
- 使用 `canvas.toBlob()` 生成Blob对象
- 通过 `URL.createObjectURL()` 创建临时URL
- 自动触发下载

**优点：**
- 内存效率高
- 自动下载，用户体验好
- 支持大文件

**缺点：**
- APK环境可能不支持
- 需要现代浏览器支持

### 3. Base64 + 直接下载（降级方案）

**适用环境：** 不支持Blob但支持下载属性的环境

**工作原理：**
- 使用 `canvas.toDataURL()` 生成Base64
- 直接设置为下载链接的href
- 触发下载

**优点：**
- 兼容性较好
- 实现简单

**缺点：**
- 大图片可能导致URL过长
- 某些环境下可能失败

## 自动选择策略

系统会根据当前环境自动选择最佳下载方式：

```typescript
// 环境检测
const env = detectEnvironment();

if (env.isAPK) {
  // APK环境：使用DataURL + 新窗口
  return downloadViaDataURL(canvas, fileName);
}

if (env.isMobile && env.supportsBlob) {
  // 移动设备：优先Blob，失败则降级
  const success = await downloadViaBlob(canvas, fileName);
  if (!success) {
    return downloadViaBase64Link(canvas, fileName);
  }
}

if (env.supportsBlob) {
  // 桌面设备：标准Blob下载
  return downloadViaBlob(canvas, fileName);
}

// 最终降级方案
return downloadViaBase64Link(canvas, fileName);
```

## 环境检测

### APK/WebView检测

```typescript
const isAPK = 
  userAgent.includes('wv') ||                    // WebView标识
  (userAgent.includes('Android') && 
   userAgent.includes('Version/')) ||            // Android WebView
  window.location.protocol === 'file:' ||        // 本地文件
  !window.URL || !window.URL.createObjectURL;   // 不支持Blob
```

### 功能支持检测

```typescript
const capabilities = {
  supportsBlob: !!(window.Blob && window.URL && window.URL.createObjectURL),
  supportsDownload: 'download' in document.createElement('a'),
  supportsCanvas: !!(document.createElement('canvas').getContext),
};
```

## 使用方法

### 基本用法

```typescript
import { downloadImage } from '../utils/downloadUtils';

const handleDownload = async () => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const success = await downloadImage(
    canvas, 
    'my-image.png',
    (message) => console.log(message) // 进度回调
  );

  if (success) {
    console.log('下载成功');
  } else {
    console.log('下载失败');
  }
};
```

### 高级用法

```typescript
import { 
  downloadViaDataURL, 
  downloadViaBlob, 
  downloadViaBase64Link,
  detectEnvironment 
} from '../utils/downloadUtils';

// 强制使用特定方式
const success = await downloadViaDataURL(canvas, 'image.png');

// 检测环境
const env = detectEnvironment();
console.log('当前环境:', env);
```

## 测试

项目包含了下载功能测试组件 `DownloadTest.tsx`，可以：

1. 检测当前运行环境
2. 显示支持的功能
3. 测试实际下载效果

## 故障排除

### APK环境下载失败

1. 确认WebView版本支持Canvas API
2. 检查是否启用了JavaScript
3. 验证文件访问权限

### 移动设备下载问题

1. 某些移动浏览器可能需要用户手势触发下载
2. iOS Safari可能会在新标签页打开图片而不是下载
3. 检查浏览器的下载设置

### 大图片处理

1. 对于超大图片，建议使用Blob方式避免内存问题
2. 可以考虑压缩图片质量：`canvas.toDataURL('image/jpeg', 0.8)`
3. 监控内存使用，必要时分块处理

## 兼容性矩阵

| 环境 | DataURL | Blob | Base64下载 | 推荐方案 |
|------|---------|------|------------|----------|
| Chrome桌面 | ✅ | ✅ | ✅ | Blob |
| Safari桌面 | ✅ | ✅ | ✅ | Blob |
| Chrome移动 | ✅ | ✅ | ✅ | Blob |
| Safari移动 | ✅ | ✅ | ⚠️ | DataURL |
| Android WebView | ✅ | ⚠️ | ⚠️ | DataURL |
| APK环境 | ✅ | ❌ | ❌ | DataURL |

**图例：**
- ✅ 完全支持
- ⚠️ 部分支持或需要用户交互
- ❌ 不支持
