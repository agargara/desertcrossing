import { Game } from './game.js'
import { Controls } from './controls.js'

const game = new Game()
const controls = new Controls(game)
game.start()
window.game = game