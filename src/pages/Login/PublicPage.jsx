import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SortTable from '../store/Components/SortTable/SortTable';
import sampleData from '../../mock/table.json';
/**
 * 路由跳转4种方式
 * 声明式导航：使用 Link 组件
编程式导航：使用 useNavigate Hook
复杂逻辑：使用自定义Hook封装 withRouter高阶组件 
类组件：使用高阶组件或渲染属性
 */
// 表格示例数据 status 1添加 2编辑 3删除  4保存 5跳转
// const sampleData = [
// { id: 1, name: '张三', age: 25, score: 85, department: '技术部', status: 1 },
// { id: 2, name: '李四', age: 30, score: 92, department: '产品部', status: 2 },
// { id: 3, name: '王五', age: 28, score: 78, department: '技术部', status: 3 },
// { id: 4, name: '赵六', age: 25, score: 88, department: '设计部', status: 4 },
// { id: 5, name: '钱七', age: 32, score: 95, department: '产品部', status: 5 },
// { id: 6, name: '孙八', age: 28, score: 82, department: '技术部', status: 1 },
// { id: 7, name: '周九', age: 26, score: 90, department: '设计部', status: 2 },
// ];
// todo useReducer
const PublicPage = () => {
    const navigate = useNavigate();
    // const generateColumns = useCallback((data) => {
    //     const srcObj = data[0];
    //     const expectKeys = ['id', 'status']
    //     // 字段名到中文标题的映射
    //     const titleMap = {
    //       name: '姓名',
    //       age: '年龄',
    //       score: '分数',
    //       department: '部门',
    //     //   status: '操作'
    //     };
    //     return Object.keys(srcObj)
    //     .filter(key => !expectKeys.includes(key))
    //     .map(key => ({ key, title: titleMap[key], sortable: true }))
    //     .concat([{ key: 'handle', title: '操作', render: (value, row, index) => <span onClick={() => navigate(`/profile/${row.id}`)}>跳转</span>  }])
    // }, [])

    // const columns = useMemo(() => generateColumns(sampleData), [generateColumns])
    const [data, setData] = useState([])
    // 列配置：可传入字段名和列标题
    const columns = [
    { key: 'name', title: '姓名', sortable: true },
    { key: 'age', title: '年龄', sortable: true },
    { key: 'score', title: '分数', sortable: true },
    { key: 'department', title: '部门', sortable: true },
    { key: 'handle', title: '操作', render: (value, row, index) => <span onClick={() => navigate(`/profile/${row.id}`)}>跳转</span>  },
    ];

    // const computedList = sampleData.map(item => ({ ...item, key: 'handle' }))

    const getData = async () => {
        try {
            const res = await Promise.resolve(sampleData)
            const computedList = res.map(item => ({ ...item, key: 'handle' }))
            setData(computedList)
        } catch (error) {
            console.log(error.message)
        }
    }

    useEffect(() => {
        getData()
    }, [])

    return (
        <SortTable data={data} columns={columns} />
    )
}

export default PublicPage;