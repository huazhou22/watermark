import React from 'react';
import WatermarkApp from './components/WatermarkApp';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>水印添加工具</h1>
      </header>
      <div className="app-content">
        <WatermarkApp />
      </div>
      <footer className="app-footer">
        {/* 可以添加页脚信息 */}
      </footer>
    </div>
  );
};

export default App;