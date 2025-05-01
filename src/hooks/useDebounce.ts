import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 设置一个定时器，在 delay 毫秒后更新 debouncedValue
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：在 value 或 delay 变化时，或组件卸载时清除定时器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // 仅在 value 或 delay 变化时重新设置定时器

  return debouncedValue;
}

export default useDebounce;