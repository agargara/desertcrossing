import { round_to_n, linear_map } from './util.js'

const MINFUEL = 0.01
const MINDISTANCE = 0.01

export class Game {
  constructor() {
    this.previous_deposits = {}
    this.deposits = {}
    this.restarts = 0
    this.travel_rate = 0.01
    this.fuel_efficiency = 1 /* Fuel used per km, lower numbers are more efficient */
    this.fuel_deposit_max = 10 /* Maximum fuel that can be stored in a deposit */
    this.init()
  }

  init(){
    this.fuel = 1
    this.distance = 0
    this.traveling = false
    this.direction = 1 /* 1 = crossing, -1 = going home */
    this.new_deposits = false
    this.set_status('At home base')
  }

  get_distance(precision=2){
    return round_to_n(precision, this.distance)
  }

  get_fuel(){
    return round_to_n(2, this.fuel)
  }

  restart(){
    this.deposits = {...this.previous_deposits} /* Clone previous deposits */
    this.restarts += 1
    this.init()
    /* Show restart info */
    document.querySelectorAll('.restart-info').forEach((el)=>{el.classList.remove('hidden')})
    document.getElementById('restart-count').innerHTML=this.restarts
  }

  /* Start the game loop */
  start(){
    this.interval_loop = window.setInterval(this.loop.bind(this), 100)
    this.interval_update_interface = window.setInterval(this.update_interface.bind(this), 100)
  }

  /* Pause the game loop */
  pause(){
    window.clearInterval(this.interval_loop)
    window.clearInterval(this.interval_update_interface)
  }

  go(){
    if (this.direction == 1)
      this.set_status('Crossing the desert')
    else
      this.set_status('Returning home')
    this.traveling = true
  }

  stop(){
    this.set_status('Stopped')
    this.traveling = false
  }

  turn(){
    this.direction *= -1
  }

  deposit(){
    let amount = parseFloat(document.getElementById('fuel-deposit-amount').value)
    /* Do not allow depositing bad amounts */
    if (isNaN(amount)) return
    amount = round_to_n(2, amount)
    if (amount <= 0) return
    if (amount > this.get_fuel()) amount = this.get_fuel()
    const current_distance = this.get_distance(1)
    if (this.deposits[current_distance] === undefined)
      this.deposits[current_distance] = 0
    this.deposits[current_distance] += amount
    this.fuel -= amount
    if (this.fuel < MINFUEL) this.fuel = 0 // Clamp fuel
    this.new_deposits = true
  }

  take(){
    /* Check current deposit availability */
    const d = this.get_distance(1)
    const current_deposit = this.deposits[d]
    if (current_deposit === undefined || current_deposit <= 0) return
    let amount = parseFloat(document.getElementById('fuel-take-amount').value)
    /* Do not allow taking bad amounts */
    if (isNaN(amount)) return
    amount = round_to_n(2, amount)
    if (amount <= 0) return
    if (amount > current_deposit) amount = current_deposit
    this.deposits[d] -= amount
    this.fuel += amount
    if (this.deposits[d] < MINFUEL) delete this.deposits[d] // Delete deposit when fuel reaches 0
    this.new_deposits = true
  }

  return_home(){
    this.distance = 0
    this.stop()
    this.direction = 1
    this.fuel = 1 /* Refuel */
    this.previous_deposits = {...this.deposits} /* Save fuel deposits */
    if (this.new_deposits)
      this.set_status('At home base, saved new fuel deposits')
    else
      this.set_status('At home base')
    this.new_deposits = false
  }

  loop(){
    if (this.traveling){
      if(this.fuel > MINFUEL){
        this.fuel -= this.travel_rate * this.fuel_efficiency
        this.distance += this.travel_rate * this.direction

        /* Stop traveling when reached home base */
        if (this.distance < MINDISTANCE)
          this.return_home()
        
        /* Todo make this a toggle option in settings, don't keep stopping after restarting */
        /* After moving, automatically stop if reached a fuel deposit */
        /* const deposit = this.deposits[this.get_distance(1)]
        if (deposit != undefined && deposit > 0) this.stop()*/
      }else{
        /* Automatically stop when out of fuel */
        this.fuel = 0
        this.stop()
      }
    }
  }

  distance_to_margin(d){
    const padding = d * 300
    return `${padding}px`
  }

  update_interface(){
    this.draw_deposits()
    const game = this
    /* Update numbers in interface */
    document.querySelectorAll('.fuel-count').forEach((el)=>{
      el.innerText = this.get_fuel() + ' L'
    })
    document.querySelectorAll('.distance').forEach((el)=>{
      el.innerText = this.get_distance() + ' km'
    })

    /* Hide/show buttons based on game state */
    /* Start by hiding all buttons in main controls */
    const buttons = document.querySelectorAll('.controls-main > *')
    buttons.forEach((el)=>{
      el.classList.add('hidden')
    })
    /* Show buttons depending on game state */
    if (this.traveling){
      document.getElementById('btn-stop').classList.remove('hidden')
    }else if (this.fuel > 0){
      /* Still have fuel? Show go button */
      document.getElementById('btn-go').classList.remove('hidden')
      /* Stopped in desert with fuel? Show turn around, fuel deposit buttons */
      if (this.distance > 0){
        document.getElementById('btn-turn').classList.remove('hidden')
        document.getElementById('btn-deposit-container').classList.remove('hidden')
        this.clamp_deposit_amount()
      }
    }

    /* Check for fuel deposits at current location */
    const deposit = game.deposits[game.get_distance(1)]
    if (deposit != undefined && deposit > 0){
      document.querySelectorAll('.deposit-info').forEach((el)=>{
        el.classList.remove('invisible')
        el.innerHTML = `There is a deposit containing <span class="fuel-count">${round_to_n(2, deposit)} L</span> of fuel here.`
      })
      /* Show take deposit button */
      document.getElementById('btn-take-container').classList.remove('hidden')
      this.clamp_take_amount(deposit)
    }else{
      document.querySelectorAll('.deposit-info').forEach((el)=>{
        el.classList.add('invisible')
      })
    }

    /* Flip car icon based on direction */
    if (this.direction == -1)
      document.getElementById('car-icon').classList.add('flip')
    else
      document.getElementById('car-icon').classList.remove('flip')

    /* Change car icon location (left margin) based on distance traveled */
    document.getElementById('car-icon-container').style.marginLeft = game.distance_to_margin(this.distance)
  }

  // Clamp deposit amount
  clamp_deposit_amount(){
    const fuel_deposit_amount = document.getElementById('fuel-deposit-amount')
    const v = fuel_deposit_amount.value
    if (v < 0) fuel_deposit_amount.value = 0
/* if (v > this.get_fuel()) fuel_deposit_amount.value = this.get_fuel()*/
    const rounded = round_to_n(2, fuel_deposit_amount.value)
    if (v != rounded) fuel_deposit_amount.value = rounded
  }

  // Clamp take amount
  clamp_take_amount(deposit){
    const fuel_take_amount = document.getElementById('fuel-take-amount')
    const v = fuel_take_amount.value
    if (v < 0) fuel_take_amount.value = 0
    /*if (v > deposit) fuel_take_amount.value = deposit*/
    const rounded = round_to_n(2, fuel_take_amount.value)
    if (v != rounded) fuel_take_amount.value = rounded
  }

  set_status(str){
    document.querySelectorAll('.current-status').forEach((el)=>{
      el.innerHTML = str
    })
  }

  fuel_to_height(fuel){
    return linear_map(fuel, 0, this.fuel_deposit_max, 6, 140)+'px'
  }

  /* Draw fuel deposits */
  draw_deposits(){
    const container = document.getElementById('fuel-deposits-container')
    /* Clear container */
    container.innerHTML = ''
    /* Draw each deposit */
    for (let d in this.deposits){
      const deposit_div = document.createElement('div')
      deposit_div.style.marginLeft = this.distance_to_margin(d)
      deposit_div.style.height = this.fuel_to_height(this.deposits[d])
      container.append(deposit_div)
    }
  }
}