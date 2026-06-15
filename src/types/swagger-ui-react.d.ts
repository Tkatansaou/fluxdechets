// Déclaration de type pour swagger-ui-react (pas de types officiels)
declare module 'swagger-ui-react' {
  import { ComponentType } from 'react'

  interface SwaggerUIProps {
    spec?: Record<string, unknown>
    url?: string
    [key: string]: unknown
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>
  export default SwaggerUI
}
