'use client'

import { useEffect } from 'react'

// Drives the animated USSD phone and the scroll-reveal effects on the landing
// page. Mirrors the real FitPay USSD flow: dial *919*4012# -> main menu ->
// 4. Buy sessions -> pick a package -> payment link sent by SMS -> paid by MoMo.
export default function LandingScripts() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const screen = document.getElementById('ussdScreen')

    const sigLine =
      '<div class="sig"><span>▮▮▮▯</span><span>12:47</span><span>▮▮▯</span></div>'

    const menuText =
      'FitPay\n1. Book a session\n2. View my plan\n3. Session balance\n4. Buy sessions\n0. Exit\n\nReply: '
    const packagesText =
      'Buy sessions:\n1. Starter · GH₵250\n2. Premium · GH₵450\n3. Elite · GH₵800\n0. Back\n\nReply: '
    const sentText =
      sigLine +
      'FitPay\n\nPayment link sent via SMS. Complete payment to activate your sessions.'
    const smsText =
      sigLine +
      'New SMS · FitPaySMS\n\n' +
      'FitPay payment link:\npay.moolre.com/fp26x4\n\n' +
      '<span class="paid">✓ Paid GH₵250 by MoMo\nSessions activated.</span>'

    const timers: ReturnType<typeof setTimeout>[] = []
    let cancelled = false

    if (reduced || !screen) {
      if (screen) screen.innerHTML = smsText
    } else {
      const wait = (ms: number, fn: () => void) => {
        if (cancelled) return
        timers.push(setTimeout(fn, ms))
      }

      const typeInto = (prefix: string, text: string, speed: number, done: () => void) => {
        let i = 0
        const tick = () => {
          if (cancelled || !screen) return
          screen.innerHTML = prefix + text.slice(0, i) + '<span class="cursor"></span>'
          i++
          if (i <= text.length) timers.push(setTimeout(tick, speed))
          else wait(500, done)
        }
        tick()
      }

      const showFor = (html: string, ms: number, done: () => void) => {
        if (cancelled || !screen) return
        screen.innerHTML = html
        wait(ms, done)
      }

      const loop = () => {
        typeInto(sigLine + 'Dialing:\n\n', '*919*4012#', 150, () => {
          showFor(sigLine + menuText + '<span class="cursor"></span>', 1300, () => {
            typeInto(sigLine + menuText, '4', 200, () => {
              showFor(sigLine + packagesText + '<span class="cursor"></span>', 1300, () => {
                typeInto(sigLine + packagesText, '1', 200, () => {
                  showFor(sentText, 2200, () => {
                    showFor(smsText, 3400, loop)
                  })
                })
              })
            })
          })
        })
      }
      loop()
    }

    // Scroll reveals
    let io: IntersectionObserver | null = null
    const revealEls = Array.from(document.querySelectorAll('.reveal'))
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in')
              io?.unobserve(e.target)
            }
          })
        },
        { threshold: 0.15 }
      )
      revealEls.forEach((el) => io!.observe(el))
    } else {
      revealEls.forEach((el) => el.classList.add('in'))
    }

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      io?.disconnect()
    }
  }, [])

  return null
}
