import serverless from 'serverless-http'
import { createApp } from '../../server/app.js'

const app = createApp()

export const handler = serverless(app, {
  request(request, event) {
    const route = event.rawUrl?.match(/\/\.netlify\/functions\/api(\/.*)?$/)?.[1]

    if (route) {
      request.url = `/api${route}`
    }
  }
})
