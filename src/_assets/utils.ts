import { Toast } from 'bootstrap'

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

export function setInputsValuesFromQueryParams() {
  const urlParams = new URLSearchParams(window.location.search)
  document.querySelectorAll('input').forEach((input: HTMLInputElement) => {
    const queryValue = urlParams.get(input.id)
    if (queryValue == null) {
      return
    }
    if (input.type === 'checkbox') {
      input.checked = Boolean(queryValue)
    } else if (input.type === 'radio' && input.value === queryValue) {
      input.checked = true
    } else if (queryValue) {
      input.value = queryValue
    }
  })
}

export function copyLinkToClipboard() {
  const link = new URL(window.location.href)
  link.search = ''
  document.querySelectorAll('input').forEach((input: HTMLInputElement) => {
    if (['radio', 'checkbox'].includes(input.type) && !input.checked) {
      return
    }
    if (input.type === 'submit') {
      return
    }
    link.searchParams.set(input.id, input.value)
  })
  navigator.clipboard.writeText(link.href)
  const toastElement = document.getElementById('link-copied-toast')!
  const toast = new Toast(toastElement, { delay: 2000 })
  toast.show()
}
