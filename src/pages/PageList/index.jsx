import React from 'react';
import { useNavigate } from 'react-router-dom';
// import './index.css';

// 模拟列表数据
const mockListData = [
  { id: 1, title: '文章标题 1', author: '张三', date: '2024-01-15', content: '这是文章1的详细内容...' },
  { id: 2, title: '文章标题 2', author: '李四', date: '2024-01-16', content: '这是文章2的详细内容...' },
  { id: 3, title: '文章标题 3', author: '王五', date: '2024-01-17', content: '这是文章3的详细内容...' },
  { id: 4, title: '文章标题 4', author: '赵六', date: '2024-01-18', content: '这是文章4的详细内容...' },
  { id: 5, title: '文章标题 5', author: '钱七', date: '2024-01-19', content: '这是文章5的详细内容...' },
];

// 列表页面组件
const ListPage = () => {
  const navigate = useNavigate();

  // 通过 state 携带参数跳转到详情页
  const handleItemClick = (item) => {
    navigate('/detail', {
      state: {
        id: item.id,
        title: item.title,
        author: item.author,
        date: item.date,
        content: item.content,
        // 可以传递任意数据
        from: 'list',
        timestamp: Date.now(),
      }
    });
  };

  return (
    <div className="page-list-container">
      <h2>文章列表</h2>
      <div className="list-header">
        <p>点击列表项查看详情（使用 HashRouter 和 state 传递参数）</p>
      </div>
      <ul className="list-items">
        {mockListData.map(item => (
          <li 
            key={item.id} 
            className="list-item"
            onClick={() => handleItemClick(item)}
          >
            <div className="item-content">
              <h3>{item.title}</h3>
              <div className="item-meta">
                <span className="author">作者: {item.author}</span>
                <span className="date">日期: {item.date}</span>
              </div>
              <p className="item-preview">{item.content}</p>
            </div>
            <div className="item-arrow">→</div>
          </li>
        ))}
      </ul>
    </div>
  );
};


// 主组件：使用 HashRouter
// const PageList = () => {
//   return (
//     <HashRouter>
//       <Routes>
//         <Route path="/" element={<ListPage />} />
//         <Route path="/detail" element={<DetailPage />} />
//       </Routes>
//     </HashRouter>
//   );
// };

// export { ListPage, DetailPage };
export default ListPage;

