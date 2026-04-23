import { Alert, AlertDescription } from '@/components/ui/alert'

export function OpenTrackingNotice() {
  return (
    <Alert variant="warning">
      <AlertDescription>
        Openingsdetectie kan onnauwkeurig zijn vanwege privacyinstellingen van e-mailclients.
      </AlertDescription>
    </Alert>
  )
}
