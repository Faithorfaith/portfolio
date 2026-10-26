// Reuse the installed Lucide React assets in the isolated Three.js document.
const fs = require('node:fs')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const lucide = require('lucide-react')
const names = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ArrowUpRight','X','Play','Pause','Volume2','Maximize2','Minimize2','Search','LayoutGrid','UserRound','FileText','Images','Video','Archive','SquarePen','Download','Undo2','Redo2','Bold','Italic','Pencil','List','ListOrdered','Quote','Link','Unlink','Image','Code','Minus','BookOpen','DoorOpen','Move','Glasses']
const icons = Object.fromEntries(names.map(name => [name,renderToStaticMarkup(React.createElement(lucide[name], {size:20,strokeWidth:1.75,'aria-hidden':true,focusable:false}))]))
fs.writeFileSync('public/gallery/icons.mjs', `// Generated from installed lucide-react; run node scripts/generate-gallery-icons.cjs.\nconst icons=${JSON.stringify(icons,null,2)};\nexport function icon(name){return icons[name] || icons.Play}\nexport function setButton(button,name,label){button.innerHTML=icon(name);if(label){button.append(document.createTextNode(label));button.setAttribute('aria-label',label)}return button}\nexport async function canvasIcon(ctx,name,x,y,size,color='#f3efe7'){const svg=icon(name).replace('currentColor',color);const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();ctx.drawImage(image,x,y,size,size)}\n`)
