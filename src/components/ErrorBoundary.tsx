import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('图片处理错误:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="处理错误"
          description="图片处理过程中发生错误，请刷新页面重试。"
          type="error"
          showIcon
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;