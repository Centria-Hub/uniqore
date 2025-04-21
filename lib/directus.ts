import { createDirectus, rest } from '@directus/sdk'

const directus = createDirectus('https://api.hub.solo-web.studio').with(
	rest({
		onRequest: options => ({ ...options, cache: 'no-store' }),
	})
)

export default directus