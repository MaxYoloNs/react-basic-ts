import React, { useCallback, useEffect, useState } from 'react';

type Num = number

function Ts() {
  const [num, changeNum] = useState<Num>(0)
  const a = <div key="ooo">123</div>
  const b = <div key="ooo">456</div>
  return (
    <div onClick={() => changeNum(num + 1)}>
      {num ? a : b}
    </div>
  )
}

export default Ts;
