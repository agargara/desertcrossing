export class Controls {
  constructor(game) {
    this.game = game
    this.set_events()
  }

  set_events(){
    const game = this.game
    document.getElementById('btn-go').addEventListener('click', ()=>{
      game.go()
    })
    document.getElementById('btn-stop').addEventListener('click', ()=>{
      game.stop()
    })
    document.getElementById('btn-turn').addEventListener('click', ()=>{
      game.turn()
    })
    document.getElementById('btn-restart').addEventListener('click', ()=>{
      game.restart()
    })
    document.getElementById('btn-deposit').addEventListener('click', ()=>{
      game.deposit()
    })
    document.getElementById('btn-take').addEventListener('click', ()=>{
      game.take()
    })

  }
}