import React, { useCallback, useEffect } from "react";
// import './App.css';

// https://doc.houdunren.com/%E7%B3%BB%E7%BB%9F%E8%AF%BE%E7%A8%8B/js/17%20Promise%E6%A0%B8%E5%BF%83.html#%E8%B5%B7%E6%AD%A5%E6%9E%84%E5%BB%BA
// promise状态只要被改变就不会被再次改变
/**
 * 实现：
 * 三个状态；
 * then在resolve调用后执行；
 * then内异步执行；
 * resolve和reject在最后执行
 * then链式调用
 * then的穿透
 * then返回promise处理
 * 实现静态方法RESOLVE和REJECT
 */
class Commitment {
    static PENDDING = "进行中";
    static FUFILLED = "已完成";
    static REJECTED = "已拒绝";
    constructor(fn) {
        this.status = Commitment.PENDDING;
        this.result = null; // resolve、reject中的同步执行代码
        this.resolveCallbacks = [];
        this.rejectCallbacks = [];
        fn(this.resolve, this.reject);
    }

    resolve = (data) => {
        // resolve和reject是在最后执行的
        if (this.status === Commitment.PENDDING) {
            this.result = data;
            this.status = Commitment.FUFILLED;
            setTimeout(() => {
                // console.log('this.result', this.result, this.status);
                this.resolveCallbacks ? .map((result) => result(data));
            });
        }
    };

    reject = (reason) => {
        // console.log('rej', this.status);
        if (this.status === Commitment.PENDDING) {
            this.result = reason;
            this.status = Commitment.REJECTED;
            setTimeout(() => {
                this.rejectCallbacks ? .map((result) => result(reason));
            });
        }
    };

    // then方法是Promise实例上的方法
    /**
     *
     * @param {*} onFulfilled
     * @param {*} onRejected
     * @returns 返回promise对象，用于链式调用
     * then 可以有两个参数，即成功和错误时的回调函数
     * then 的函数参数都不是必须的，所以需要设置默认值为函数，用于处理当没有传递时情况
     * 当执行 then 传递的函数发生异常时，统一交给 onRejected 来处理错误
     * onFulfilled 与 onRejected 做为异步宏任务执行
     * pending 状态时将 then 方法的回调函数添加到 callbacks 数组中，用于异步执行，当状态改变时循环调用
     */
    then = (onFulfilled, onRejected) => {
        // 不是函数设置为默认函数
        if (typeof onFulfilled != "function") {
            onFulfilled = (value) => value;
        }
        // 类型判断，防止出现仅传reject函数，onRejected为null的情况
        if (typeof onRejected != "function") {
            onRejected = (value) => value;
        }
        // then链式调用
        return new Commitment((resolve, reject) => {
            // console.log(resolve);
            if (this.status === Commitment.PENDDING) {
                // resolve异步执行，把异步执行代码放入对应队列
                this.resolveCallbacks.push(() => {
                    // try catch防止resolve传入格式错误
                    try {
                        let res = onFulfilled(this.result);
                        // 返回的是promise类型，进入.then继续处理
                        if (res instanceof Commitment) {
                            res.then(resolve, reject);
                        } else {
                            resolve(res);
                        }
                        // resolve(res)
                    } catch (error) {
                        reject(error);
                    }
                });
                this.rejectCallbacks.push(() => {
                    // try catch防止resolve传入格式错误
                    try {
                        let res = onRejected(this.result);
                        if (res instanceof Commitment) {
                            res.then(resolve, reject);
                        } else {
                            resolve(res);
                        }
                        // resolve(res)
                    } catch (error) {
                        reject(error);
                    }
                });
            }
            if (this.status === Commitment.FUFILLED) {
                setTimeout(() => {
                    try {
                        let res = onFulfilled(this.result);
                        if (res instanceof Commitment) {
                            res.then(resolve, reject);
                        } else {
                            resolve(res);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }
            if (this.status === Commitment.REJECTED) {
                setTimeout(() => {
                    try {
                        let res = onRejected(this.result);
                        if (res instanceof Commitment) {
                            res.then(resolve, reject);
                        } else {
                            resolve(res);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        });
    };

    // resolve静态方法：
    // 入参类型包括promise对象和返回值
    // 在then方法中，第一个参数中执行
    static resolve(value) {
        return new Commitment((resolve, reject) => {
            if (value instanceof Commitment) {
                value.then(resolve, reject);
            } else {
                resolve(value);
            }
        });
    }

    // reject静态方法：
    // 入参类型包括promise对象和返回值
    // 在then方法中，第二个参数中执行
    static reject(value) {
        return new Commitment((resolve, reject) => {
            if (value instanceof Commitment) {
                value.then(resolve, reject);
            } else {
                reject(value);
            }
        });
    }

    // 数组中所有promis都成功，才以数组形式返回值；有一个失败，返回失败的值
    static all(promises) {
        let success = [];
        return new Commitment((resolve, reject) => {
            promises.forEach((element) => {
                element.then(
                    (res) => {
                        success.push(res);
                        if (success.length === promises.length) {
                            resolve(success);
                        }
                    },
                    (reason) => {
                        reject(reason);
                    }
                );
            });
        });
    }

    // 返回先执行完的promise
    static race(promises) {
        return new Commitment((resolve, reject) => {
            promises.map((promise) => {
                return promise.then(
                    (value) => {
                        return resolve(value);
                    },
                    (reason) => {
                        return reject(reason);
                    }
                );
            });
        });
    }
}

// console.log(1);
// let commitment = new Commitment((resolve, reject) => {
//   console.log(2);
//   setTimeout(() => {
//     resolve('一定一定')
//     // reject('错了')
//     console.log(4);
//   })
// })
// commitment.then().then((res) => {
//   console.log(res)
//   // return '正确'
// }, (rej) => {
//   console.log(rej)
//   // return new Commitment('错误')
//   return new Commitment(resolve => resolve('错误'))
// })
// .then((res) => {
//   console.log('===', res)
// })

// Promise.resolve参数可传入字符串、数字、promise
let p = new Commitment((resolve) => resolve(123));
// Commitment.resolve('456').then(resolve => console.log(resolve))
// Commitment.resolve(p).then(res => console.log(res))
Commitment.reject(p).then(
    (res) => console.log(res),
    (rej) => console.log(rej)
);

// then的onRejected参数，返回值为promise对象;
// 输出结果：rej 456
let aa = new Commitment((res, rej) => rej(456));
new Commitment((resolve, rej) => {
        rej("解决");
    })
    .then()
    .then(
        (val) => val,
        (rej) => aa
    )
    .then(
        (res) => console.log("res", res),
        (rej) => console.log("rej", rej)
    );
console.log(3);

// console.log('promise======');
// console.log(1);
// let promise = new Promise((resolve, reject) => {
//   console.log(2);
//   setTimeout(() => {
//     resolve('一定一定')
//     // reject('错了')
//     console.log(4);
//   })
// })
// promise.then().then((res) => {
//   console.log(res)
//   // return '正确'
// }, (rej) => {
//   console.log(rej)
//   // return new Commitment('错误')
//   return new Commitment(resolve => resolve('错误'))
// })
// .then((res) => {
//   console.log('===', res)
// })

// console.log(3);
// Promise.resolve('123').then(resolve => console.log(resolve))

// 示例
let pp = new Commitment((res, rej) => rej(456));
Commitment.reject(pp)
    .then(
        (val) => {
            console.log("-", val);
            return "111";
        },
        (rej) => {
            console.log("rej", rej);
            return "222";
        }
    )
    .then(
        (val) => console.log("===", val),
        (rej) => console.log("最后的拒绝", rej)
    );

// all的示例
let p1 = new Commitment((resolve, reject) => {
    resolve("后盾人");
});
let p2 = new Commitment((resolve, reject) => {
    reject("1");
});
let promises = Commitment.all([p1, p2]).then(
    (promises) => {
        console.log(promises);
    },
    (reason) => {
        console.log(reason);
    }
);

// race的示例
//   let p1 = new Commitment(resolve => {
//     setInterval(() => {
//       resolve("后盾人");
//     }, 2000);
//   });
//   let p2 = new Commitment(resolve => {
//     setInterval(() => {
//       resolve("houdunren.com");
//     }, 1000);
//   });
//   let promises = Commitment.race([p1, p2]).then(
//     promises => {
//       console.log(promises);
//     },
//     reason => {
//       console.log(reason);
//     }
//   );

// 值穿透：promise方法链通过return实现传值，没有return相当于相互独立的任务
// https://www.jianshu.com/p/4e8aaa87540a

export default Commitment;