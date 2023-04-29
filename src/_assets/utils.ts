export function displayAlert(problem: string) {
  let error = 'Errore sconosciuto'
  switch (problem) {
    case 'x-range-not-symmetric':
      error =
        'Attenzione! Xmin e Xmax diversi in valore assoluto: il range delle X deve essere simmetrico.'
      break
    case 'function':
      error =
        'Attenzione! Funzione sintatticamente scorretta. <a href="https://mathjs.org/docs/expressions/syntax.html" target=_blank>Consultare la documentazione</a>'
      break
    case 'axes':
      error = 'Attenzione! X minimo e massimo sono errati.'
      break
    case 'min_max':
      error = 'Attenzione! X/Y minimo e/o massimo superano i limiti di -1000/+1000.'
      break
    case 'xfis_xmob':
      error = 'Attenzione! X0 e/o X non rientrano nel range Xmin-Xmax'
      break
    case 'unlimited':
      error = 'Attenzione! Funzione non limitata.'
      break
  }

  document.querySelector('#error')!.innerHTML = error
  document.querySelector('#alert')!.classList.remove('d-none')
}
