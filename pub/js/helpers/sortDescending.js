function sortDescending(intArray) {
  return _.sortBy(intArray, function(num) {return num}).reverse()
}

module.exports = sortDescending
