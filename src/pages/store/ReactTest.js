import React, { useCallback, useEffect } from 'react';
import { useState, useMemo } from 'react';

/**
 * 
 * @returns React.memo篇
 */
// 因为父组件更新，子组件跟着更新。解决：memo浅对比，props未更新，跳过本次渲染
// const Son = () => {
//   const [num, setNum] = useState(1)
//   const arr = [1,2,3]
//   console.log('触发子组件更新');
//   return <div onClick={() => setNum(1)}>我是子组件{num}{arr}</div>
// }

// // const MemoSon = memo(({ list }) => {
// //   const [num, setNum] = useState(1)
// //   console.log('memo触发子组件更新', num);
// //   return <div onClick={() => setNum(1)}>我是子组件{num}{list}</div>
// // })

// function App() {
//   const [count, setCount] = useState(0)
//   // console.log('count', count);
//   const list = useMemo(() => [1,2,3], [])
//   return (
//     <div className="App">
//       {/* <MemoSon list={list} /> */}
//       <Son />
//       <button onClick={() => setCount(count+1)}>change Count{count}</button>
//     </div>
//   );
// }

// 使用 axios 的例子
import axios from 'axios';

/**
 * useMemo
 */
function fib(n) {
  console.log('重新计算啦');
  if(n < 3) return 1
  return fib(n-2) + fib(n-1)
}

function App () {
  const [cuont1, setCount1] = useState(0)
  const [cuont2, setCount2] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        // 处理获取到的模拟数据
        const response = await axios.get('http://localhost:3001/api/data');
        console.log('Mock Data:', response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    // fetchData();
  }, []) // 只在首次渲染完成后调用，不在更新时调用

  const result = useMemo(() => { // useMemo解决cuont2更新，也调用fib的问题
    return fib(cuont1)
  }, [cuont1])

  const jump = useCallback((page) => {
    console.log(page);
    window.history.pushState({ name:'传递参数' }, '标题', page)
  }, [])

  const handleCount1Click = () => {
    setCount1(cuont1 + 1);
    // window.location.href = `${window.location.origin + window.location.pathname}#/Mall/Sys/WeiPageNew/Pages`;
    jump(window.herf);
    // jump('https://www.baidu.com/');
  };
  
  const handleCount2Click = () => {
    setCount2(cuont2 + 1);
    jump('https://www.goole.com');
  };
  
  return (
    <div>
      <button onClick={() => handleCount1Click()}>cuont1{cuont1}</button>
      <button onClick={() => handleCount2Click()}>cuont2{cuont2}</button>
      <p>{result}</p>
    </div>
  )
}

export default App;
