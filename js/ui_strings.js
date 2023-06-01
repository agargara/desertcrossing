const UISTRINGS = {
  'en': {
    'descr_going': 'A vast desert lies before you.',
    'descr_returning': 'A vast desert lies behind you.',
    'descr_checkpoint': 'Checkpoint saved.',
    'status_home': 'Resting at home base',
    'status_going': 'Crossing the desert',
    'status_returning': 'Returning home',
    'status_stopped': 'Stopped',
    'template_fuel_deposit': 'There is a deposit containing <span class="fuel-text">$1 L</span> of fuel here.',
    'template_unlock_fuel_tank': 'Unlocked <span class="fuel-text">$1 L</span> Fuel Tank!'
  },
  'ja': {
  }
}
class UIStrings {
  constructor() {
    // Set lang from local storage
    let lang = localStorage.getItem('lang');
    this.set_lang(lang)
    // Translate UI 
    this.update_ui_strings()
  }

  s(target) {
    let str = UISTRINGS[this.lang][target]
    // No match? Try English
    if (str === undefined)
      str = UISTRINGS['en'][target]
    // Still no match? Return the target key as is
    if (str === undefined) {
      return target
    }
    return str
  }

  h(target) {
    return `<span class="uistr" data-uistr="${target}">${this.s(target)}</span>`
  }

  template(target, parts) {
    const template = this.s(target)
    return template.replace(/\$(\d)/g, (_, number) => parts[number - 1]);
  }

  set_lang(lang) {
    // Default to english if unsupported lang
    if (lang == undefined || UISTRINGS[lang] == undefined)
      this.lang = 'en'
    else
      this.lang = lang
    localStorage.setItem('lang', this.lang);
  }
  update_ui_strings() {

    // Translate additional elements with uistr class
    document.querySelectorAll('.uistr').forEach((el) => {
      // Try to get ui string key from data element
      let key = el.getAttribute('data-uistr')
      if (!key) {
        // If no data element, get key from text and set data element
        key = el.innerText
        // If no innerText, try innerHTML 
        if (key == undefined) key = el.innerHTML
        el.setAttribute('data-uistr', key)
      }
      // Optional: template parts
      const parts = el.getAttribute('data-uistr-parts')
      if (!parts)
        el.innerHTML = this.s(key)
      else
        el.innerHTML = this.template(key, parts)
    })

  }
}

export const uistr = new UIStrings()