'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type GameId = 'tic' | 'rps' | 'memory' | 'connect'
type GameDefinition = { id: GameId; title: string; short: string }

const games: GameDefinition[] = [
  { id: 'tic', title: 'Tic-Tac-Toe', short: 'Three in a row' },
  { id: 'rps', title: 'Rock, Paper, Scissors', short: 'Best instinct wins' },
  { id: 'memory', title: 'Memory Match', short: 'Find every pair' },
  { id: 'connect', title: 'Connect Four', short: 'Outthink the conductor' },
]

const winner = (board: string[]) => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  return board.every(Boolean) ? 'draw' : null
}

const minimax = (board: string[], maximizing: boolean): number => {
  const result = winner(board)
  if (result === 'O') return 10
  if (result === 'X') return -10
  if (result === 'draw') return 0
  const scores = board.map((cell, index) => {
    if (cell) return maximizing ? -Infinity : Infinity
    const next = [...board]; next[index] = maximizing ? 'O' : 'X'
    return minimax(next, !maximizing)
  })
  return maximizing ? Math.max(...scores) : Math.min(...scores)
}

function TicTacToe() {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''))
  const result = winner(board)
  const play = (index: number) => {
    if (board[index] || result) return
    const next = [...board]; next[index] = 'X'
    if (!winner(next)) {
      const options = next.map((cell, i) => cell ? null : { i, score: minimax([...next.slice(0, i), 'O', ...next.slice(i + 1)], false) }).filter(Boolean) as { i: number; score: number }[]
      const best = options.sort((a, b) => b.score - a.score)[0]
      if (best) next[best.i] = 'O'
    }
    setBoard(next)
  }
  return <div className="game-panel"><p>{result === 'X' ? 'You won.' : result === 'O' ? 'I won this round.' : result === 'draw' ? 'A draw.' : 'You are X. Make your move.'}</p><div className="tic-grid">{board.map((cell, i) => <button key={i} onClick={() => play(i)} aria-label={`Square ${i + 1}${cell ? `: ${cell}` : ''}`}>{cell}</button>)}</div><button className="game-action" onClick={() => setBoard(Array(9).fill(''))}>Replay</button></div>
}

function RockPaperScissors() {
  const choices = ['Rock', 'Paper', 'Scissors'] as const
  const [message, setMessage] = useState('Choose your move.')
  const [score, setScore] = useState([0, 0])
  const play = (choice: typeof choices[number]) => {
    const computer = choices[Math.floor(Math.random() * choices.length)]
    const win = (choice === 'Rock' && computer === 'Scissors') || (choice === 'Paper' && computer === 'Rock') || (choice === 'Scissors' && computer === 'Paper')
    const draw = choice === computer
    setMessage(`You: ${choice}. Me: ${computer}. ${draw ? 'Draw.' : win ? 'You win.' : 'I win.'}`)
    if (!draw) setScore(([you, me]) => win ? [you + 1, me] : [you, me + 1])
  }
  return <div className="game-panel"><p>{message}</p><strong className="game-score">You {score[0]} · {score[1]} Faith</strong><div className="rps-row">{choices.map(choice => <button key={choice} onClick={() => play(choice)}>{choice}</button>)}</div><button className="game-action" onClick={() => { setScore([0,0]); setMessage('Choose your move.') }}>Reset score</button></div>
}

const memorySymbols = ['●','▲','■','◆','✦','✿']
const shuffledCards = () => [...memorySymbols, ...memorySymbols].sort(() => Math.random() - .5).map((symbol, id) => ({ id, symbol }))

function MemoryMatch() {
  const [cards, setCards] = useState(shuffledCards)
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const choose = (id: number) => {
    if (open.length === 2 || open.includes(id) || matched.includes(id)) return
    const next = [...open, id]; setOpen(next)
    if (next.length === 2) {
      const [a,b] = next.map(cardId => cards.find(card => card.id === cardId)!)
      window.setTimeout(() => { if (a.symbol === b.symbol) setMatched(current => [...current, a.id, b.id]); setOpen([]) }, 550)
    }
  }
  const reset = () => { setCards(shuffledCards()); setOpen([]); setMatched([]) }
  return <div className="game-panel"><p>{matched.length === cards.length ? 'Every pair found. Nicely done.' : `${matched.length / 2} of ${memorySymbols.length} pairs found.`}</p><div className="memory-grid">{cards.map(card => <button key={card.id} onClick={() => choose(card.id)} aria-label={open.includes(card.id) || matched.includes(card.id) ? card.symbol : 'Hidden card'}>{open.includes(card.id) || matched.includes(card.id) ? card.symbol : ''}</button>)}</div><button className="game-action" onClick={reset}>Replay</button></div>
}

type Disc = 0 | 1 | 2
const connectWin = (board: Disc[], player: Disc) => {
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) for (const [dr, dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
    if ([0,1,2,3].every(step => { const row = r + dr * step; const col = c + dc * step; return row >= 0 && row < 6 && col >= 0 && col < 7 && board[row * 7 + col] === player })) return true
  }
  return false
}
const dropDisc = (board: Disc[], column: number, player: Disc) => {
  const next = [...board]
  for (let row = 5; row >= 0; row--) if (!next[row * 7 + column]) { next[row * 7 + column] = player; return next }
  return null
}

function ConnectFour() {
  const [board, setBoard] = useState<Disc[]>(Array(42).fill(0))
  const [status, setStatus] = useState('Choose a column. You play black.')
  const play = (column: number) => {
    if (connectWin(board, 1) || connectWin(board, 2)) return
    const playerBoard = dropDisc(board, column, 1); if (!playerBoard) return
    if (connectWin(playerBoard, 1)) { setBoard(playerBoard); setStatus('You connected four.'); return }
    const legal = [0,1,2,3,4,5,6].filter(c => dropDisc(playerBoard, c, 2))
    const winning = legal.find(c => connectWin(dropDisc(playerBoard, c, 2)!, 2))
    const blocking = legal.find(c => connectWin(dropDisc(playerBoard, c, 1)!, 1))
    const preferred = [3,2,4,1,5,0,6].find(c => legal.includes(c))
    const choice = winning ?? blocking ?? preferred
    const computerBoard = choice === undefined ? playerBoard : dropDisc(playerBoard, choice, 2)!
    setBoard(computerBoard)
    setStatus(connectWin(computerBoard, 2) ? 'I connected four.' : computerBoard.every(Boolean) ? 'The board is full.' : 'Your turn.')
  }
  return <div className="game-panel"><p>{status}</p><div className="connect-columns">{[0,1,2,3,4,5,6].map(column => <button key={column} onClick={() => play(column)} aria-label={`Drop in column ${column + 1}`}>↓</button>)}</div><div className="connect-grid">{board.map((cell, i) => <span key={i} className={cell === 1 ? 'is-player' : cell === 2 ? 'is-computer' : ''} />)}</div><button className="game-action" onClick={() => { setBoard(Array(42).fill(0)); setStatus('Choose a column. You play black.') }}>Replay</button></div>
}

function Game({ id }: { id: GameId }) {
  if (id === 'tic') return <TicTacToe />
  if (id === 'rps') return <RockPaperScissors />
  if (id === 'memory') return <MemoryMatch />
  return <ConnectFour />
}

function TrainConsist({ copy, onPlay }: { copy: number; onPlay: (game: GameDefinition) => void }) {
  return <div className="train-drawn-consist game-train-consist" aria-hidden={copy > 0}>
    {games.map((game, index) => <div className="train-drawn-coach game-train-coach" key={`${copy}-${game.id}`}>
      <svg viewBox="0 0 300 76" aria-hidden="true">
        <defs>
          <linearGradient id={`game-body-${copy}-${index}`} x2="0" y2="1">
            <stop stopColor="#fff" />
            <stop offset=".45" stopColor="#d9dee0" />
            <stop offset="1" stopColor="#8b959a" />
          </linearGradient>
        </defs>
        <path d={index === 3 ? 'M3 12H239Q266 12 295 55V62H3Z' : index === 0 ? 'M5 18Q5 12 15 12H297V62H5Z' : 'M3 12H297V62H3Z'} fill={`url(#game-body-${copy}-${index})`} stroke="#859097" strokeWidth=".8" />
        <path d={index === 3 ? 'M8 24H242L278 48H8Z' : 'M8 24H292V48H8Z'} fill="#29363d" />
        <path d="M8 51H287V57H8Z" fill="#9db0ba" />
        <path d="M10 19H242" stroke="#cc3028" strokeWidth="2" />
        {[72,102,132,162,192].map(x => <rect key={x} x={x} y="27" width="22" height="17" rx="1" fill="#9cbcd0" stroke="#50636d" strokeWidth=".7" />)}
        <path d="M15 64H286" stroke="#343d42" strokeWidth="4" />
        {[39,62,235,258].map(x => <g key={x}><circle cx={x} cy="66" r="7" fill="#30383c" /><circle cx={x} cy="66" r="3" fill="#9ca5a8" /></g>)}
        <path d="M90 10H180" stroke="#c2c9cc" strokeWidth="4" />
        {index === 2 && <path d="M125 10L145 0L165 10" fill="none" stroke="#68757b" strokeWidth="1.5" />}
        {index < 3 && <path d="M295 58H305" stroke="#323a3e" strokeWidth="3" />}
      </svg>
      <button className="train-real-door" onClick={() => onPlay(game)} aria-label={`Play ${game.title}`} tabIndex={copy > 0 ? -1 : 0}>
        <i /><span>{game.title}</span>
      </button>
    </div>)}
    <div className="train-vapor"><i /><i /><i /></div>
  </div>
}

export default function HomepageGameTrain({ email }: { email?: string | null }) {
  const [active, setActive] = useState<GameDefinition | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (active) dialog.current?.showModal(); else dialog.current?.close() }, [active])
  const copyright = useMemo(() => new Date().getFullYear(), [])
  return <section id="train" className="new-train-section" aria-labelledby="train-heading">
    <div className="new-section-intro"><h2 id="train-heading">A moving mind always finds its luck.</h2><p>A little play before the last stop. Four coaches, four games. Think you can beat me?</p></div>
    <div className="new-train-stage">
      <div className="new-train-loop">
        <TrainConsist copy={0} onPlay={setActive} />
        <TrainConsist copy={1} onPlay={setActive} />
      </div>
      <div className="new-train-track" aria-hidden="true" />
    </div>
    <footer id="footer" className="new-home-footer"><span>Faith Awokunle · {copyright}</span><div><a href="#top">Back to top</a>{email && <a href={`mailto:${email}`}>Contact</a>}</div></footer>
    {active && <dialog ref={dialog} className="game-dialog" onCancel={() => setActive(null)} onClick={event => event.target === event.currentTarget && setActive(null)}>
      <div><header><span>Coach {String(games.findIndex(game => game.id === active.id) + 1).padStart(2, '0')}</span><button onClick={() => setActive(null)} aria-label="Close game">×</button></header><h2>{active.title}</h2><Game id={active.id} /></div>
    </dialog>}
  </section>
}
