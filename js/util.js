export function round_to_n(precision, n){
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
    const coefficient = +(Math.round(parts[0] + "e+" + precision)  + "e-" + precision).toString()
    str = coefficient + 'e' + parts[1]
  } else {
    str = (Math.round(n + "e+" + precision)  + "e-" + precision).toString()
  }
  const after = +str
  if (isNaN(after)) console.log(before, after)
  return after
}

export function linear_map(n, min_in, max_in, min_out, max_out){
  // edge case to avoid dividing by zero
  if (max_in == min_in) return min_out

  // clamp input to min_in, max_in
  n = Math.max(min_in, Math.min(max_in, n))

  // map n from input range to output range
  return ((n - min_in) * (max_out - min_out) / (max_in - min_in)) + min_out

}