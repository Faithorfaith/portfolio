/** Nine fixed positions; the entrance at depth 0 stays completely clear. */
export function exhibitionLayout(centerZ, side, count, entranceX = 13) {
  const rows = []
  for (let i=0;i<Math.min(count,9);i++) {
    const wall = i<3?'far':i<6?'left':'right'
    const column=i%3
    const depth=wall==='far'?20.1:[5.2,10.6,16][column]
    const across=wall==='far'?[-5.7,0,5.7][column]:wall==='left'?-9.12:9.12
    rows.push({index:i,wall,x:side*(entranceX+depth),y:3.85,z:centerZ+side*across,rotation:wall==='far'?-side*Math.PI/2:wall==='left'?(side===1?0:Math.PI):(side===1?Math.PI:0),width:2.3,height:4.09})
  }
  return rows
}
export function clampExhibitionPosition(position, centerZ, side, entranceX = 13) {
  const depth=Math.max(entranceX+2,Math.min(entranceX+18,position.x*side))
  return {x:depth*side,z:Math.max(centerZ-7.8,Math.min(centerZ+7.8,position.z))}
}
