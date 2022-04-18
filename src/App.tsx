import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Sheet, { useViewBox } from './Sheet';


type LineProps = {
  f: Function
}

function Line({f}: LineProps) {
    const [x,y,w,h] = useViewBox();

    const [t, setT] = useState(0);

    useEffect(()=>{
      const h = setTimeout(()=>{
        setT(t+0.1);
      }, 16)
  
      return ()=>clearTimeout(h)
    }, [t])
    
    try {
      const points = Array
        .from({length: w}, (_,i)=>i).map(i=>i+x)
        .map(x => [x, -f(x, t)]);

      const line = 
        points.map( ([x,y]) => `${x},${y}`).join(' ');
        
      return <polyline points={line}  fill="none" stroke="red" strokeWidth={3}/>;
    } catch {
      return null
    }
}

function compileFunction(formula: string) {
  try {
    return new Function("x", "t", "return " + formula)
  } catch {
    return () => 0
  }
}

function App() {
  const [formula, setFormula] = useState("0.01 * x * x * Math.sin(t*x/50) +Math.cos(t)*100");

  const f = compileFunction(formula);

  return (
    <div style={{display:'flex', width:'100%', justifyContent:'center'}}>    
      <div style={{
        display:'flex', 
        flexDirection:'column', 
        justifyContent:'stretch', 
        alignItems: 'stretch', 
        width:'800px', height: '100%'}}>
        <input 
          style={{flexGrow:1, fontSize:'2em', padding:'1em'}}
          onChange={(e)=>setFormula(e.target.value)} value={formula} />
          <Sheet style={{flexGrow:1}} height="800px" width="800px">
            <Line f={f} />
          </Sheet>
      </div>
    </div>

  )
}

export default App;
