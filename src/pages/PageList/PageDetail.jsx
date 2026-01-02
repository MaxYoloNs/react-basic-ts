
import { useNavigate, useLocation } from 'react-router-dom';
// 详情页面组件
const DetailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // 从 location.state 中获取传递的参数
    const state = location.state;
    console.log('state', state);
    
    
    // 如果没有 state 数据，显示提示
    if (!state) {
      return (
        <div className="page-detail-container">
          <h2>文章详情</h2>
          <div className="error-message">
            <p>未找到文章数据，请从列表页进入</p>
            <button onClick={() => navigate('/')}>返回列表</button>
          </div>
        </div>
      );
    }
  
    const { id, title, author, date, content, from, timestamp } = state;
  
    return (
      <div className="page-detail-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← 返回列表
        </button>
        <h2>文章详情</h2>
        <div className="detail-content">
          <div className="detail-header">
            <h3>{title}</h3>
            <div className="detail-meta">
              <span>ID: {id}</span>
              <span>作者: {author}</span>
              <span>日期: {date}</span>
            </div>
          </div>
          <div className="detail-body">
            <p>{content}</p>
          </div>
          <div className="detail-footer">
            <p><strong>来源:</strong> {from}</p>
            <p><strong>时间戳:</strong> {new Date(timestamp).toLocaleString()}</p>
            <p><strong>URL:</strong> {location.pathname}</p>
            <p><strong>Hash:</strong> {location.hash}</p>
          </div>
        </div>
      </div>
    );
  };

  export default DetailPage;