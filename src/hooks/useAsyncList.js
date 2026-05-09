import { useCallback, useEffect, useState } from 'react'

export const useAsyncList = (loader, initial = []) => {
  const [data, setData] = useState(initial)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await loader()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    load()
  }, [load])

  return { data, setData, error, loading, reload: load }
}
