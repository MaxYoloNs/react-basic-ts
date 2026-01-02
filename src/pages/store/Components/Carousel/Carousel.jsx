import React, {useCallback, useState, useEffect} from 'react';

const Carousel = ({
  images = [],
  autoPlay = true,
  interval = 3000,
  showArrow = true,
  showDot = true
}) => {
  const [curIndex, setCurIndex] = useState(0)
  const [isPause, setPause] = useState(false)

  // 展示上一张图片
  const toPrev = useCallback(() => {
    if(isPause) return
    setPause(true)
    setCurIndex(prev => (prev - 1 + images.length) % images.length)
  }, [images, isPause])

  // 展示下一张图片
  const toNext = useCallback(() => {
    if(isPause) return
    setPause(true)
    setCurIndex(prev => (prev + 1) % images.length)
  }, [images, isPause])

  const onChangeCurIndex = (index) => {
    if(isPause) return
    setPause(true)
    setCurIndex(index)
  }

  useEffect(() => {
    if(autoPlay) {
      const timer = setInterval(() => {
        toNext();
      }, [interval])
      return () => clearInterval(timer)
    }
  }, [autoPlay, interval, toNext])

  return (
    <div style={{ width: 500, position: 'relative', overflow: 'hidden' }}>
      {/* 图片 */}
      <div style={{ display: 'flex', transform: `translateX(-${curIndex * 100}%)`, transition: 'transform 300ms ease-in-out'}}
        onTransitionEnd={() => setPause(false)}
      >
        {
          images && images.length > 0 && images.map(item => (
            <div key={item} style={{ minWidth: '100%', height: '100%' }}>
              <img src={item} alt=''
                style={{ width: '100%', height: '100%', objectFit: 'cover'}}
              ></img>
            </div>
          ))
        }
      </div>
      {/* 箭头 */}
      {
        showArrow && (
          <>
            <span
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)'}}
              onClick={() => toPrev()}>◁</span>
            <span
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)'}}
              onClick={() => toNext()}>▷</span>
          </>
        )
      }
      {/* dot */}
      {
        showDot && (
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)'}}>
            {
              images.map((item, index) => <span key={item} onClick={() => onChangeCurIndex(index)}>
                {curIndex === index ? '●' : '○'}
              </span>)
            }
          </div>
        )
      }
    </div>
  )
}

export default Carousel;
