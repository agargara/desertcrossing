export function round_to_two(n){
  const before = n
  // Convert to float
  n = parseFloat(n)
  if (isNaN(n)) return 0
  // Convert to string
  let str = n.toString()
  // Split by e parts
  let parts = str.split('e');
  if (parts.length === 2) {
    /* If exponent already present, round just the coefficient portion */
    const coefficient = +(Math.round(parts[0] + "e+2")  + "e-2").toString()
    str = coefficient + 'e' + parts[1]
  } else {
    str = (Math.round(n + "e+2")  + "e-2").toString()
  }
  const after = +str
  if (isNaN(after)) console.log(before, after)
  return after
}
