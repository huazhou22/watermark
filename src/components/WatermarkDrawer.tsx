import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import '../styles/drawer.css';

interface WatermarkDrawerProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onReset?: () => void;
  orientation?: 'portrait' | 'landscape';
  position?: 'bottom' | 'right';
}

const WatermarkDrawer: React.FC<WatermarkDrawerProps> = ({
  title,
  children,
  defaultExpanded = false,
  onReset,
  orientation = 'portrait',
  position = 'bottom'
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [currentSize, setCurrentSize] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 计算标题栏高度/宽度
  const [headerSize, setHeaderSize] = useState(40); // 默认高度

  useEffect(() => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      const size = position === 'bottom' ? rect.height : rect.width;
      setHeaderSize(size);

      // 更新CSS变量
      if (position === 'bottom') {
        document.documentElement.style.setProperty('--drawer-header-height', `${size}px`);
      }
    }
  }, [position]);

  // 当屏幕方向或位置改变时，重置抽屉状态
  useEffect(() => {
    setExpanded(defaultExpanded);
    if (drawerRef.current) {
      drawerRef.current.style.height = '';
      drawerRef.current.style.width = '';
    }
  }, [orientation, position, defaultExpanded]);

  // 处理展开/收起切换
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // 处理拖动开始
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setDragging(true);
    if ('touches' in e) {
      setStartY(e.touches[0].clientY);
      setStartX(e.touches[0].clientX);
    } else {
      setStartY(e.clientY);
      setStartX(e.clientX);
    }

    if (drawerRef.current) {
      const rect = drawerRef.current.getBoundingClientRect();
      setCurrentSize(position === 'bottom' ? rect.height : rect.width);
    }
  };

  // 处理拖动
  const handleDrag = useCallback((e: TouchEvent | MouseEvent) => {
    if (!dragging || currentSize === null) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

    if (drawerRef.current) {
      if (position === 'bottom') {
        // 竖屏模式，上下拖动
        const deltaY = startY - clientY;
        const newHeight = Math.max(headerSize, Math.min(window.innerHeight * 0.8, currentSize + deltaY));
        drawerRef.current.style.height = `${newHeight}px`;
      } else {
        // 横屏模式，左右拖动
        const deltaX = startX - clientX;
        const newWidth = Math.max(headerSize, Math.min(window.innerWidth * 0.8, currentSize + deltaX));
        drawerRef.current.style.width = `${newWidth}px`;
      }
    }
  }, [dragging, currentSize, startY, startX, headerSize, position]);

  // 处理拖动结束
  const handleDragEnd = useCallback(() => {
    setDragging(false);
    setCurrentSize(null);

    if (drawerRef.current && contentRef.current) {
      const rect = drawerRef.current.getBoundingClientRect();
      const size = position === 'bottom' ? rect.height : rect.width;
      const contentSize = position === 'bottom'
        ? contentRef.current.scrollHeight
        : contentRef.current.scrollWidth;

      // 如果大小小于内容的一半，则收起
      if (size < contentSize / 2) {
        setExpanded(false);
      } else {
        setExpanded(true);
        // 重置大小
        if (position === 'bottom') {
          drawerRef.current.style.height = '';
        } else {
          drawerRef.current.style.width = '';
        }
      }
    }
  }, [position, setExpanded]);

  // 添加和移除事件监听器
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [dragging, handleDrag, handleDragEnd]);

  // 根据位置和方向设置样式
  const getDrawerStyle = () => {
    if (position === 'bottom') {
      return {
        transform: expanded ? 'translateY(0)' : `translateY(calc(100% - ${headerSize}px))`
      };
    } else {
      return {
        transform: expanded ? 'translateX(0)' : `translateX(calc(100% - ${headerSize}px))`
      };
    }
  };

  const drawerClassName = `watermark-drawer ${expanded ? 'expanded' : 'collapsed'} ${position === 'bottom' ? 'drawer-bottom' : 'drawer-right'}`;

  return (
    <div
      ref={drawerRef}
      className={drawerClassName}
      style={getDrawerStyle()}
    >
      <div
        ref={headerRef}
        className={`drawer-header ${position === 'bottom' ? 'header-horizontal' : 'header-vertical'}`}
        onMouseDown={(e) => {
          // 只有点击在标题区域或拖动手柄上时才触发拖动
          if (e.target === headerRef.current ||
              (e.target as HTMLElement).classList.contains('drawer-handle') ||
              (e.target as HTMLElement).tagName === 'H3') {
            handleDragStart(e);
          }
        }}
        onTouchStart={(e) => {
          // 只有点击在标题区域或拖动手柄上时才触发拖动
          const target = e.target as HTMLElement;
          if (target === headerRef.current ||
              target.classList.contains('drawer-handle') ||
              target.tagName === 'H3') {
            handleDragStart(e);
          }
        }}
        onClick={(e) => {
          // 不再在这里处理展开/收起，只通过按钮控制
          // 这样可以避免与按钮点击事件冲突
        }}
      >
        <div
          className={`drawer-handle ${position === 'bottom' ? 'handle-horizontal' : 'handle-vertical'}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
        ></div>
        <h3
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
          style={{ cursor: 'pointer' }}
        >{title}</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onReset && (
            <Button
              type="text"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="reset-button"
            >
              重置
            </Button>
          )}
          <Button
            type="text"
            icon={expanded ? (position === 'bottom' ? <DownOutlined /> : <UpOutlined />) : (position === 'bottom' ? <UpOutlined /> : <DownOutlined />)}
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              toggleExpanded();
            }}
            className="toggle-button"
          />
        </div>
      </div>
      <div
        ref={contentRef}
        className={`drawer-content ${expanded ? 'visible' : 'hidden'}`}
      >
        {children}
      </div>
    </div>
  );
};

export default WatermarkDrawer;