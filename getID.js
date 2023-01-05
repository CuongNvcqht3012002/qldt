const a = document.querySelectorAll('input.custom-control-input')
const b = []
for(let item of a) b.push(item.value)
console.log(b)
