import React, { useReducer, useState, useRef, useEffect } from 'react';
/**
 * 使用useReducer实现一个TodoList
 */
const initialState = []
const reducer = (state, action) => {
    switch(action.type) {
        case 'ADD_TODO':
            return [...state, {
                text: action.inputValue, id: action.id
            }]
        case 'EDIT_TODO':
            return state.map(item => item.id === action.id ? {...item, text: action.currentInputValue } : item)
        case 'DELETE_TODO':
            return state.filter(todo => todo.id !== action.id)
        default:
            return state
    }  
}

const TodoList = () => {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [count, setCount] = useState(0);
    console.log('count', count);
    
    const initIds = useRef(0)
    const [input, setInputValue] = useState('')
    const [currentIndex, setCurrentIndex] = useState(null)

    const functionMax = () => {
        let a = 3;
        let b = 4;
        function fnucB() {
            a
        }
        // function funcC() {
        //     b
        // }
        // return funcC
    }

    useEffect(() => {
        functionMax()
        // const timer = setTimeout(() => {
        //     // 闭包陷阱：count 是闭包变量，每次渲染时都会重新创建一个闭包，导致 count 的值不会更新，解决：传入count作为依赖项
        //     setCount(prev => ++prev)
        // }, 1000)
        // return () => clearTimeout(timer)
    // }, [count])
    }, [])
    return (
        <div>
            <h1 onClick={() => functionMax()}>Todo List{count}</h1>
            {/* <input type="text" value={input} onChange={(e) => setInputValue(e.target.value)} />
            <button onClick={() => dispatch({ type: 'ADD_TODO', id: initIds.current++, inputValue: input })}>Add</button>
            {state?.length > 0 && state.map((todo) => (
                <div key={todo.id}>
                    {
                        currentIndex === todo.id ? (
                            <>
                                <input type="text" value={todo.text} onChange={(e) => dispatch({ type: 'EDIT_TODO', id: todo.id, currentInputValue: e.target.value })} />
                                <button onClick={() => setCurrentIndex(null)}>Save</button>
                            </>
                        ) : (
                            <>
                                {todo.text}
                                <button onClick={() => setCurrentIndex(todo.id)}>Edit</button>
                            </>
                        )
                    }
                    <button onClick={() => dispatch({ type: 'DELETE_TODO', id: todo.id })}>Delete</button>
                </div>
            ))} */}
        </div>
    )
}

export default TodoList;