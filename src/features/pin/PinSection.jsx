import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { clearPin, hasPin as hasPinStored, setPin, verifyPin } from './pinService.js'

export default function PinSection() {
  const [hasPin, setHasPin] = useState(false)
  const [locked, setLocked] = useState(false)
  const [pin, setPinValue] = useState('')
  const [error, setError] = useState(null)

  const load = async () => {
    setHasPin(await hasPinStored())
  }

  useEffect(() => {
    load()
  }, [])

  const handleSetPin = async () => {
    try {
      setError(null)
      await setPin(pin)
      setPinValue('')
      await load()
    } catch (err) {
      setError(err)
    }
  }

  const handleVerify = async () => {
    try {
      setError(null)
      const ok = await verifyPin(pin)
      if (!ok) {
        throw new Error('El PIN es incorrecto.')
      }
      setLocked(false)
      setPinValue('')
    } catch (err) {
      setError(err)
    }
  }

  const handleClear = async () => {
    await clearPin()
    setLocked(false)
    setPinValue('')
    await load()
  }

  return (
    <Card title="Protección con PIN">
      {error ? (
        <ErrorState
          title="No se pudo validar"
          description={error.message}
          action={
            <button
              className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-700"
              onClick={() => setError(null)}
            >
              Cerrar
            </button>
          }
        />
      ) : null}
      <p className="text-sm text-slate-600">
        Puedes proteger la app con un PIN de 4 dígitos. La validación se guarda localmente.
      </p>
      <input
        className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="PIN de 4 dígitos"
        value={pin}
        onChange={(event) => setPinValue(event.target.value)}
        maxLength={4}
      />
      <div className="flex flex-wrap gap-2">
        {!hasPin ? (
          <button
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={handleSetPin}
          >
            Configurar PIN
          </button>
        ) : null}
        {hasPin && !locked ? (
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            onClick={() => setLocked(true)}
          >
            Bloquear
          </button>
        ) : null}
        {locked ? (
          <button
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={handleVerify}
          >
            Desbloquear
          </button>
        ) : null}
        {hasPin ? (
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            onClick={handleClear}
          >
            Eliminar PIN
          </button>
        ) : null}
      </div>
      {locked ? (
        <p className="text-xs text-rose-600">App bloqueada, ingresa el PIN para continuar.</p>
      ) : null}
    </Card>
  )
}
