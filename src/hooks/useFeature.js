import { useEffect, useState } from 'react'
import { isFeatureAvailable } from '../utils/auth/featureGuard.ts'

export default function useFeature(featureName) {
  const [isAvailable, setIsAvailable] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const res = await isFeatureAvailable(featureName)
        if (active) {
          setIsAvailable(res)
          setLoading(false)
        }
      } catch {
        if (active) {
          setIsAvailable(false)
          setLoading(false)
        }
      }
    }
    check()
    return () => {
      active = false
    }
  }, [featureName])

  return { isAvailable, loading }
}
