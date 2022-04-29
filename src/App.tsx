import React, { useEffect, useMemo, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Sheet, { useViewBox } from './Sheet';
import {AxesHelper, BufferGeometry, Material, Mesh, Vector3} from 'three'
import * as Three from 'three'
import { Canvas, useFrame, useThree, extend, ReactThreeFiber } from '@react-three/fiber'
import { DEG2RAD, degToRad } from 'three/src/math/MathUtils';
import {ParametricGeometries}  from 'three/examples/jsm/geometries/ParametricGeometries';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Editor from "@monaco-editor/react";

extend({OrbitControls});


declare global {
  namespace JSX {
    interface IntrinsicElements {
      'orbitControls': ReactThreeFiber.Object3DNode<OrbitControls, typeof OrbitControls>;
    }
  }
}

let examples = `

// parametric function renderer
// u and v are parameters from 0 to 1
// use t for animations, t is incremented every ~16ms

// you can adjust the camera by dragging and scrolling

function torus (u, v, t) {
  const r = 2*(2+Math.cos(t/10));
  return [
    15 + Math.cos(u * Math.PI*2)*(r+2*Math.cos(v*Math.PI*2)),
    Math.sin(u * Math.PI*2)*(r + 2*Math.cos(v*Math.PI*2)),
    2*Math.sin(v * Math.PI*2)
  ]
}

function klein (u, v) {

  const U = u * 2 * Math.PI;
  const V = v * 2 * Math.PI;

  const y = - 2 * ( 1 - Math.cos( U) / 2 ) * Math.sin( V );

  if ( U < Math.PI ) {
    
    const x = 3 * Math.cos( U ) * ( 1 + Math.sin( U ) ) + ( 2 * ( 1 - Math.cos( U ) / 2 ) ) * Math.cos( U ) * Math.cos( V );
    const z = - 8 * Math.sin( U ) - 2 * ( 1 - Math.cos( U ) / 2 ) * Math.sin( U ) * Math.cos( V );
    return [x,y,z];

  } else {

    const x = 3 * Math.cos( U ) * ( 1 + Math.sin( U ) ) + ( 2 * ( 1 - Math.cos( U ) / 2 ) ) * Math.cos( V + Math.PI );
    const z = - 8 * Math.sin( U );
    return [x,y,z];
  
  }
}

render(torus);
render(klein);

`;

type ParametricFunction = (u: number, v: number, t: number) => [number, number, number]

type ParametricPlotProps = {
  f: ParametricFunction
  color?: string
  wireframe?: boolean
  lod?: number
}

function OrbitControl() {
  const {
    camera,
    gl: { domElement }
  } = useThree();

  return (
    <orbitControls args={[camera, domElement]} />
  )

}

function ParametricPlot({f, lod, wireframe, color = 'orange'}: ParametricPlotProps) {

  const [t, setTimer] = useState(0);

  useEffect(()=>{
    requestAnimationFrame(()=>{
      setTimer(t+1);
    })
  }, [t]);

  const kmesh = useMemo(() => {
    try {
    return (
      f && new ParametricGeometry((u: number ,v: number, target) => 
            target.set(...f(u, v, t)) , lod, lod)
      );
    } catch {
      return null;
    }
  }, [f, t]);


  if(!kmesh) return null;

  return (
      <mesh
        key={kmesh.uuid} 
        geometry={kmesh}>
        <meshStandardMaterial color={color} wireframe={wireframe} />
      </mesh>
  )
}




type LineProps = {
  f: Function
}

function Line({f}: LineProps) {
  const [x,y,w,h] = useViewBox();

  const [t, setT] = useState(0);

  useEffect(() => {
    const h = setTimeout(()=>{
      setT(t+0.1);
    }, 16)

    return () => clearTimeout(h)
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

function ParametricLine({f}: LineProps) {
  const [x,y,w,h] = useViewBox();

  const [t, setT] = useState(0);

  useEffect(()=>{
    const h = setTimeout(()=>{
      setT(t+0.1);
    }, 100)

    return ()=>clearTimeout(h)
  }, [t])
  
  try {
    const points = Array
      .from({length: 1000}, (_,i) => i/1000)
      .map(x => f(x, t) as unknown as number[]);


    const line = 
      points.map( ([x,y]) => `${x},${y}`).join(' ');
      
    return <polyline points={line}  fill="none" stroke="red" strokeWidth={3}/>;
  } catch {
    return null
  }
}

function compileFunction(formula: string) {
  try {
    return new Function("render", formula)
  } catch {
    return null;
  }
}

const colors = [
  'orange',
  'red',
  'blue',
  'green',
  '#333'
]


function App() {
  const [lod, setLod] = useState(15);
  const [wireframe, setWireframe] = useState(false);
  const [functions, setFunctions] = useState<ParametricFunction[]>([]);
  const editorRef = useRef<null | {getValue():string}>(null);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor; 
  }

  function compile() {
      const code = editorRef.current?.getValue();
      if(!code) return;
      const f = compileFunction(code);

      if(!f) return;

      let functions = [] as ParametricFunction[];

      f((func:ParametricFunction) => {
        functions.push(func);
      });

      setFunctions(functions);
  }

  useEffect(()=>{setTimeout(compile,1000)}, []);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display:'flex', 
      justifyContent:'stretch', 
      alignItems:'stretch'
    }}>
      <div style={{display:'flex', justifyContent: 'stretch', width: '400px', flex:1}} 
        >
        <Editor
          defaultValue={examples}
          onMount={handleEditorDidMount}
          width={"100%"}
          height={"100%"}
          language="javascript"
          theme="vs-dark"/>
      </div>
      <div style={{display:'flex', flex:1, justifyContent:'stretch', flexDirection: 'column'}}>
        <div style={{background:'grey'}}>
          <button onClick={compile}> compile </button>
          <label> detail: <input type="number" min={1} max={2000} value={lod} onChange={e => {
            setLod(+e.target.value)
          }} /></label>
          <button onClick={()=>setWireframe(!wireframe)}> show {wireframe ? 'solid': 'wireframe'} </button>
        </div>
        <Canvas
          camera={{ fov: 75, position: [0, 0, 35]}}
          style={{flex: 1, height:'100%', background:'#eee'}}>
          <ambientLight />
          <pointLight position={[0, 0, 1000]} />
          <OrbitControl/>
          <axesHelper scale={1} />
          {functions.map((f, i) => (
            <ParametricPlot key={i} f={f} color={colors[i]} lod={lod} wireframe={wireframe} />
          ))}
        </Canvas>
      </div>
    </div>
  )

  // return (
  //   <div style={{display:'flex', width:'100%', justifyContent:'center'}}>    
  //     <div style={{
  //       display:'flex', 
  //       flexDirection:'column', 
  //       justifyContent:'stretch', 
  //       alignItems: 'stretch', 
  //       width:'800px', height: '100%'}}>
  //       <input 
  //         style={{flexGrow:1, fontSize:'2em', padding:'1em'}}
  //         onChange={(e)=>setFormula(e.target.value)} value={formula} />
  //         <Sheet style={{flexGrow:1}} height="800px" width="800px">
  //           <ParametricLine f={f} />
  //         </Sheet>
  //     </div>
  //   </div>

  // )
}

export default App;
