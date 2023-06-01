import { round_to_n, linear_map } from './util.js'
import { uistr } from './ui_strings.js'

const MINFUEL = 0.01
const MINDISTANCE = 0.01
const MINFUELDEPOSITDISTANCE = 0.15

export class Game {
  constructor() {
    this.deposits = {}
    this.saved_deposits = {}
    this.gear = {
      'fuel_tank_max': 1,
      'motor_speed': 0.01,
      'fuel_efficiency': 1, // Fuel used per km, lower numbers are more efficient 
    }
    this.saved_gear = {...this.gear}
    this.restarts = 0
    this.fuel_deposit_max = 10 /* Maximum fuel that can be stored in a deposit */
    this.init()
    // Try to load from local storage
    this.load()
  }

  init(){
    this.fuel = this.gear['fuel_tank_max']
    this.distance = 0
    this.traveling = false
    this.direction = 1 /* 1 = crossing, -1 = going home */
    this.new_deposits = false
    this.set_status(uistr.h('status_home'))
  }

  // Save game to local storage
  save(){
    localStorage.setItem('desert_game',  JSON.stringify(this))
  }
  load(){
    const old_game = localStorage.getItem('desert_game')
    if (old_game === undefined || old_game === null) return
    // Copy old_game properties to current object
    Object.assign(this, JSON.parse(old_game))
  }

  get_distance(precision=2){
    return round_to_n(precision, this.distance)
  }

  get_fuel(){
    return round_to_n(2, this.fuel)
  }

  restart(){
    this.deposits = {...this.saved_deposits} /* Load saved deposits */
    this.gear = {...this.saved_gear} /* Load saved gear */
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
      this.set_status(uistr.h('status_going'))
    else
      this.set_status(uistr.h('status_returning'))
    this.traveling = true
  }

  stop(){
    this.set_status(uistr.h('status_stopped'))
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
    if (current_distance < MINFUELDEPOSITDISTANCE) return // Do not allow fuel deposits under minimum distance
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
    // Cap amount at current deposit (do not allow overdrawing)
    if (amount > current_deposit) amount = current_deposit
    // Cap amount at max fuel tank size
    if ((this.fuel + amount) > this.gear['fuel_tank_max'])
      amount = this.gear['fuel_tank_max'] - this.fuel
    this.deposits[d] -= amount
    this.fuel += amount
    if (this.deposits[d] < MINFUEL) delete this.deposits[d] // Delete deposit when fuel reaches 0
    this.new_deposits = true
  }

  return_home(){
    this.distance = 0
    this.stop()
    this.direction = 1
    this.fuel = this.gear['fuel_tank_max'] /* Refuel */
    this.saved_deposits = {...this.deposits} /* Save fuel deposits */
    this.saved_gear = {...this.gear} /* Save gear */
    this.set_status(uistr.h('status_home'))
    this.set_description(uistr.h('descr_checkpoint'))
    this.save()
  }

  loop(){
    if (this.traveling){
      if(this.fuel > MINFUEL){
        this.fuel -= this.gear['motor_speed'] * this.gear['fuel_efficiency']
        this.distance += this.gear['motor_speed'] * this.direction

        /* Stop traveling when reached home base */
        if (this.distance < MINDISTANCE)
          this.return_home()

        // Check for gear unlocks
        this.check_unlocks()

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

  check_unlocks(){
    // TODO tab with list of unlocks
    // Unlock: 1km, 2L fuel tank
    if (this.get_distance() > 1 && this.gear['fuel_tank_max'] < 2){
      this.announce(uistr.template('template_unlock_fuel_tank', [2]))
      this.gear['fuel_tank_max'] = 2
    }
  }

  distance_to_margin(d, offset=0){
    const padding = (d * 300) + offset
    return `${padding}px`
  }

  update_interface(){
    this.draw_deposits()
    const game = this

    /* Update numbers in interface */
    document.getElementById('current-fuel').innerText = this.get_fuel() + ' / ' + this.gear['fuel_tank_max'] + ' L'
    document.getElementById('current-distance').innerText = this.get_distance() + ' km'

    /* Flip car icon based on direction and set default description */
    if (this.direction == -1){
      if (this.distance >= MINDISTANCE)
        this.set_description(uistr.h('descr_returning'))
      document.getElementById('car-icon').classList.add('flip')
    }else{
      if (this.distance >= MINDISTANCE)
        this.set_description(uistr.h('descr_going'))
      document.getElementById('car-icon').classList.remove('flip')
    }

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
      /* Stopped in desert with fuel? Show turn around button */
      if (this.distance > 0){
        document.getElementById('btn-turn').classList.remove('hidden')
      }
      /* After minimum fuel deposit distance, show deposit fuel button */
      if (this.get_distance(1) > MINFUELDEPOSITDISTANCE){
        document.getElementById('btn-deposit-container').classList.remove('hidden')
        this.clamp_deposit_amount()
      }
    }

    /* Check for fuel deposits at current location */
    const deposit = game.deposits[game.get_distance(1)]
    if (deposit != undefined && deposit > 0){
      this.set_description(uistr.template('template_fuel_deposit', [round_to_n(2, deposit)]))
      /* Show take deposit button */
      document.getElementById('btn-take-container').classList.remove('hidden')
      this.clamp_take_amount(deposit)
    }else{
      document.querySelectorAll('.deposit-info').forEach((el)=>{
        el.classList.add('invisible')
      })
    }

    /* Change car icon location (left margin) based on distance traveled */
    // Offset left by 25px (half of icon width 50px)
    document.getElementById('car-icon-container').style.marginLeft = game.distance_to_margin(this.distance, -25)
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

  set_description(str){
    document.querySelectorAll('.description').forEach((el)=>{
      el.innerHTML = str
    })
  }

  fuel_to_height(fuel){
    return linear_map(fuel, 0, this.fuel_deposit_max, 6, 60)+'px'
  }

  /* Draw fuel deposits */
  draw_deposits(){
    const container = document.getElementById('fuel-deposits-container')
    /* Clear container */
    container.innerHTML = ''
    /* Draw each deposit */
    for (let d in this.deposits){
      const deposit_div = document.createElement('div')
    // Offset left by 6px (half of icon width 12px)
      deposit_div.style.marginLeft = this.distance_to_margin(d, -6)
      deposit_div.style.height = this.fuel_to_height(this.deposits[d])
      container.append(deposit_div)
    }
  }

  // Announce special messages
  announce(str){
    const announce_container = document.getElementById('announce-container');
    const announce_div = document.createElement('div')
    announce_div.innerHTML = str;
    announce_container.append(announce_div)
    // Remove announcement after fade out
    setTimeout(() => { announce_div.remove() }, 10000)
  }
}