import { createContext, useContext, useState } from "react";


type SheetProps = React.SVGProps<SVGSVGElement> 

const context = createContext([0,0,0,0]);

export const useViewBox = () => {
  return useContext(context);
}

export default function Sheet(props: SheetProps) {
  const [dragStart, setDrag] = useState<false|number[]>(false);
  const [viewBox, setViewBox] = useState([-500,-500, 1000, 1000]);

  return (
    <svg
      
      onMouseDown={(e) => {
        const [vx, vy] = viewBox;

        const {left, top, width, height} = e.currentTarget.getBoundingClientRect();
        const mx = (e.pageX - left) / width;
        const my = (e.pageY - top) / height;

        setDrag([vx, vy, mx, my]);
      }}
      
      onMouseUp={()=>setDrag(false)}
      
      onMouseMove={(e)=>{
        if (dragStart) {
          const [_x, _y, vw, vh] = viewBox;

          const {left, top, width, height} = e.currentTarget.getBoundingClientRect();
          const mx = (e.pageX - left) / width;
          const my = (e.pageY - top) / height;    

          setViewBox([
            dragStart[0] + (dragStart[2] - mx) * vw,
            dragStart[1] + (dragStart[3] - my) * vh,
            vw,
            vh
          ]);
        }
      }}

      onWheel={(e) => {
        const [vx, vy, vw, vh] = viewBox;

        const {left, top, width, height} = e.currentTarget.getBoundingClientRect();
        const mx = (e.pageX - left) / width;
        const my = (e.pageY - top) / height;

        const d = e.deltaY > 0 ? +1 : -1;

        const w = vw * (1.0 + d*0.01) 
        const h = vh * (1.0 + d*0.01) 

        const cx = vx + vw * mx;
        const cy = vy + vh * my;

        const newViewBox = [
          cx - w * mx,//lerp(vx, vx+w, 0.5),
          cy - h * my,//lerp(vh, vh+h, 0.5),
          w,
          h
        ]

        setViewBox(newViewBox);
      
      }}
      style={{
        flexGrow:1,
        border:'solid 1px red'
      }}
      viewBox={viewBox.join(' ')}
      {...props}>
      <defs>
          <pattern id="smallGrid" width={10} height={10} patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" strokeWidth="0.5"/>
          </pattern>
          <pattern id="grid" width={100} height={100} patternUnits="userSpaceOnUse">
            <rect width={100} height={100} fill="url(#smallGrid)"/>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="gray" strokeWidth="1"/>
          </pattern>
      </defs>

      <path d={`M ${viewBox[0]-viewBox[2]} 0 L ${viewBox[0]+viewBox[2]} 0 M 0 ${viewBox[1]-viewBox[3]} L 0 ${viewBox[1]+viewBox[3]}`} fill="none" stroke="black" strokeWidth="1"/>
          
      <rect 
        x={viewBox[0]-viewBox[2]} 
        y={viewBox[1]-viewBox[3]} 

        width={viewBox[2]*2}
        height={viewBox[3]*2}

        fill="url(#grid)"  />
      
      <context.Provider value={viewBox}>
        {props.children}
      </context.Provider>
    </svg>
  );
}