import { useCallback, useEffect, useState } from 'react'

export const useAsyncValue = (loader, initial = null) => {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await loader()
      setValue(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    load()
  }, [load])

  return { value, setValue, error, loading, reload: load }
}
